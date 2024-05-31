const ImageStore = artifacts.require("ImageStore");

module.exports = function(deployer) {
  deployer.deploy(ImageStore);
};
