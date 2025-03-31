require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers, zeroPadValue, toUtf8Bytes, to } = require("ethers");

const app = express();
app.use(express.json());
app.use(cors());

const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.CONTRACT_ADDRESS;
const abi = [
    "function registerImage(bytes32 imageHash) public",
    "function isImageAuthentic(bytes32 imageHash) public view returns (bool)"
];

const contract = new ethers.Contract(contractAddress, abi, signer);

//Register Image Hash
app.post("/register", async (req, res) => {
    try {
        const { imageHash } = req.body;
        if (!imageHash) return res.status(400).json({ error: "Image hash required" });

        // Convert the hash to bytes32 format
        const paddedHash = zeroPadValue("0x"+imageHash, 32);
        const tx = await contract.registerImage(paddedHash);
        await tx.wait();

        res.json({ message: "Image hash registered successfully", txHash: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error registering image hash" });
    }
});

//Check Image Authenticity
app.get("/check/:hash", async (req, res) => {
    try {
        const { hash } = req.params;
        const paddedHash = zeroPadValue("0x"+hash, 32);
        const exists = await contract.isImageAuthentic(paddedHash);
        res.json({ exists: exists });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error checking image authenticity" });
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running on port 3000"));
