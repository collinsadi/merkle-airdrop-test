const { ethers, network } = require("hardhat");
const { expect } = require("chai");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const BAYC_MAINNET_ADDRESS = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
const BAYC_HOLDER_ADDRESS = "0x2CA043BF85fE1553bdeF8c0Dbf021Ad6202EfB41";

describe("Fork Mainnet and Interact with BAYC", function () {
  let baycHolder;
  let token, airdrop;
  let owner, addr1, addr2;
  let merkleRoot, leaf;
  let leafNodes, merkleTree;

  before(async function () {
    // Impersonate BAYC holder
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [BAYC_HOLDER_ADDRESS],
    });
    baycHolder = await ethers.getSigner(BAYC_HOLDER_ADDRESS);

    // Check BAYC holder's balance
    const bayc = await ethers.getContractAt("IERC721", BAYC_MAINNET_ADDRESS);
    const baycBalance = await bayc.balanceOf(BAYC_HOLDER_ADDRESS);
    console.log(`BAYC holder ${BAYC_HOLDER_ADDRESS} owns ${baycBalance.toString()} BAYC NFTs`);
    if (baycBalance.toString() === "0") {
      throw new Error(`Impersonated holder does not own any BAYC NFTs`);
    }

    // Deploy ERC20 token
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MindToken");
    token = await Token.deploy();
    await token.waitForDeployment();

    // Deploy MerkleAirdrop contract
    const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
    airdrop = await MerkleAirdrop.deploy(token.address, merkleRoot, BAYC_MAINNET_ADDRESS);
    await airdrop.deployed();

    console.log(`MerkleAirdrop deployed at: ${airdrop.address}`);

    // Set up Merkle tree
    leafNodes = [
      { address: addr1.address, amount: ethers.utils.parseEther("100") },
    ].map((x) =>
      keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [x.address, x.amount]
        )
      )
    );
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getRoot();
    await airdrop.updateMerkleRoot(merkleRoot);

    // Approve airdrop contract to spend tokens
    await token.approve(airdrop.address, ethers.utils.parseEther("100"));

    // Mint BAYC NFT to addr1 (assuming minting function exists)
    await bayc.connect(owner).mint(addr1.address);
  });

  after(async function () {
    // Stop impersonating account
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [BAYC_HOLDER_ADDRESS],
    });
  });


  it("Should allow claiming tokens with valid Merkle proof", async function () {
    leaf = keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [addr1.address, ethers.utils.parseEther("100")]
      )
    );
    const proof = merkleTree
      .getProof(leaf)
      .map((p) => "0x" + p.toString("hex"));

    await expect(
      airdrop.connect(addr1).claim(ethers.utils.parseEther("100"), proof)
    )
      .to.emit(token, "Transfer")
      .withArgs(airdrop.address, addr1.address, ethers.utils.parseEther("100"));
  });

  it("Should not allow claiming tokens twice", async function () {
    leaf = keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [addr1.address, ethers.utils.parseEther("100")]
      )
    );
    const proof = merkleTree
      .getProof(leaf)
      .map((p) => "0x" + p.toString("hex"));

    // Claim tokens once
    await airdrop.connect(addr1).claim(ethers.utils.parseEther("100"), proof);

    // Attempt to claim again
    await expect(
      airdrop.connect(addr1).claim(ethers.utils.parseEther("100"), proof)
    ).to.be.revertedWith("Airdrop already claimed");
  });

  it("Should not allow claiming without BAYC NFT ownership", async function () {
    leaf = keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [addr2.address, ethers.utils.parseEther("100")]
      )
    );
    const proof = merkleTree
      .getProof(leaf)
      .map((p) => "0x" + p.toString("hex"));

    await expect(
      airdrop.connect(addr2).claim(ethers.utils.parseEther("100"), proof)
    ).to.be.revertedWith("Must own a BAYC NFT");
  });
});
