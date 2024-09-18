const fs = require("fs");
const csv = require("csv-parser");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

// Variables to store the addresses and amounts
let entries = [];

// Read CSV file and parse it
fs.createReadStream("airdrop.csv")
  .pipe(csv())
  .on("data", (row) => {
    // Store each entry as an array [address, amount]
    entries.push([row.address, row.amount]);
  })
  .on("end", () => {
    console.log("CSV file successfully processed");

    // Create the Merkle Tree using the entries
    const tree = StandardMerkleTree.of(entries, ["address", "uint256"]);

    // Get the Merkle Root
    const rootHash = tree.root;
    console.log("Merkle Root:", rootHash);

    // Generate proofs for each entry
    const proofs = {};
    entries.forEach((entry, index) => {
      const proof = tree.getProof(index);
      proofs[entry[0]] = {
        amount: entry[1],
        proof: proof,
      };
    });

    // Save proofs to a JSON file
    fs.writeFileSync(
      "proofs.json",
      JSON.stringify({ rootHash, proofs }, null, 2)
    );

    console.log("Proofs saved to proofs.json");
  });