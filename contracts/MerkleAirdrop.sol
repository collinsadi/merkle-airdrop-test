// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop {
    IERC20 public token;
    bytes32 public merkleRoot;
    IERC721 public baycNFT;
    mapping(address => bool) public hasClaimed;

    constructor(
        address _tokenAddress,
        bytes32 _merkleRoot,
        address _baycNFTAddress
    ) {
        token = IERC20(_tokenAddress);
        merkleRoot = _merkleRoot;
        baycNFT = IERC721(_baycNFTAddress);
    }

    function claim(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!hasClaimed[msg.sender], "Airdrop already claimed");
        require(baycNFT.balanceOf(msg.sender) > 0, "Must own a BAYC NFT");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        bool valid = MerkleProof.verify(merkleProof, merkleRoot, leaf);
        require(valid, "Invalid Merkle proof");

        hasClaimed[msg.sender] = true;
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }
}
