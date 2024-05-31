const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const Web3 = require('web3');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors'); // Import CORS
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "imageHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentId",
        "type": "string"
      }
    ],
    "name": "ImageUploaded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_imageHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_studentId",
        "type": "string"
      }
    ],
    "name": "uploadImage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_imageHash",
        "type": "string"
      }
    ],
    "name": "getImageData",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_studentId",
        "type": "string"
      }
    ],
    "name": "hasUploaded",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
]; // ABI of the deployed contract
const contractAddress = '0x57aB7827a2F62D5f4bBeb29941342D04A10cc846';

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Use CORS

const upload = multer({ dest: 'uploads/' });

// Initialize Web3 with HttpProvider
const provider = new Web3.providers.HttpProvider('http://localhost:7545');
const web3 = new Web3(provider);

const contract = new web3.eth.Contract(contractABI, contractAddress);
const account = '0xfD763eecE5EEB797645a7D95071c6D9Cfe252F67'; // Replace with your account address from Ganache

app.post('/upload', upload.single('image'), async (req, res) => {
  const { studentId } = req.body;
  const image = req.file;

  console.log('Received upload request');
  console.log('Student ID:', studentId);
  console.log('Image File:', image);

  if (!image || !studentId) {
      console.error('Missing image or student ID');
      return res.status(400).send('Image and student ID are required');
  }

  let imageBuffer;
  try {
      imageBuffer = fs.readFileSync(image.path);
      console.log('Image read successfully');
  } catch (readError) {
      console.error('Error reading image file:', readError);
      return res.status(500).send('Error reading image file');
  }

  let imageHash;
  try {
      imageHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      console.log('Image hash created:', imageHash);
  } catch (hashError) {
      console.error('Error creating image hash:', hashError);
      return res.status(500).send('Error creating image hash');
  }

  try {
      const hasUploaded = await contract.methods.hasUploaded(studentId).call();
      console.log('Checked if student has already uploaded an image:', hasUploaded);
      if (hasUploaded) {
          console.error('Student has already uploaded an image');
          return res.status(400).send('Student has already uploaded an image');
      }

      const gasEstimate = await contract.methods.uploadImage(imageHash, studentId).estimateGas({ from: account });
      console.log('Gas estimate for transaction:', gasEstimate);

      await contract.methods.uploadImage(imageHash, studentId).send({
          from: account,
          gas: gasEstimate + 20000, // Adding some buffer to the gas estimate
          gasPrice: '20000000000' // 20 Gwei
      });
      console.log('Image uploaded to blockchain successfully');

      const blockNumber = await web3.eth.getBlockNumber();
      const block = await web3.eth.getBlock(blockNumber);

      res.json({ 
          message: 'Image uploaded successfully', 
          blockInfo: {
              number: blockNumber,
              hash: block.hash,
              previousHash: block.parentHash
          }
      });
  } catch (blockchainError) {
      console.error('Error interacting with the blockchain:', blockchainError);
      return res.status(500).send(`Error interacting with the blockchain: ${blockchainError.message}`);
  } finally {
      try {
          fs.unlinkSync(image.path); // Clean up uploaded file
          console.log('Cleaned up uploaded file');
      } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError);
      }
  }
});

app.get('/blocks', async (req, res) => {
  try {
      const latestBlockNumber = await web3.eth.getBlockNumber();
      const blocks = [];
      for (let i = 0; i <= latestBlockNumber; i++) {
          const block = await web3.eth.getBlock(i);
          blocks.push({
              number: block.number,
              hash: block.hash,
              previousHash: block.parentHash,
          });
      }
      res.json(blocks);
  } catch (error) {
      console.error('Error fetching blocks:', error);
      res.status(500).send('Error fetching blocks');
  }
});

app.listen(4000, () => {
  console.log('Server started on http://localhost:4000');
});