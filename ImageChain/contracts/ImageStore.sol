// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ImageStore {
    struct ImageData {
        string imageHash;
        string studentId;
    }

    mapping(string => ImageData) private imageRecords;
    mapping(string => bool) private studentUploaded;

    event ImageUploaded(string imageHash, string studentId);

    function uploadImage(string memory _imageHash, string memory _studentId) public {
        require(!studentUploaded[_studentId], "Student has already uploaded an image");

        imageRecords[_imageHash] = ImageData({
            imageHash: _imageHash,
            studentId: _studentId
        });

        studentUploaded[_studentId] = true;

        emit ImageUploaded(_imageHash, _studentId);
    }

    function getImageData(string memory _imageHash) public view returns (string memory, string memory) {
        ImageData memory data = imageRecords[_imageHash];
        return (data.imageHash, data.studentId);
    }

    function hasUploaded(string memory _studentId) public view returns (bool) {
        return studentUploaded[_studentId];
    }
}
