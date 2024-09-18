require("@nomicfoundation/hardhat-toolbox");

const { vars } = require("hardhat/config");

const ALCHEMY_API_KEY = vars.get("ALCHEMY_API_KEY");

const SEPOLIA_PRIVATE_KEY = vars.get("SEPOLIA_PRIVATE_KEY");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const ALCHEMY_MAINNET_API_KEY = vars.get("ALCHEMY_MAINNET_API_KEY");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.26",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    "lisk-sepolia": {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [SEPOLIA_PRIVATE_KEY],
      gasPrice: 1000000000,
    },
    hardhat: {
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_MAINNET_API_KEY}`,
      },
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      "lisk-sepolia": "123",
    },
    customChains: [
      {
        network: "lisk-sepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
};
