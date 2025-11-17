const express = require("express");
const multer = require("multer");
const axios = require("axios");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/file-upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file found" });
    }

    const owner = "Dream-Origin";
    const repo = "boutique-images";
    const branch = "main";
    const filePath = `src/data/images/${Date.now()}_${file.originalname}`;

    const base64 = file.buffer.toString("base64");

    const result = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        message: "Upload product image",
        content: base64,
        branch: branch,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawURL = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

    return res.json({
      success: true,
      raw_url: rawURL,
    });
  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
