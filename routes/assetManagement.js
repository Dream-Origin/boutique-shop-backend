const express = require("express");
const { body, param, validationResult } = require("express-validator");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");

const multer = require("multer");
const fs = require("fs").promises;
const { Readable } = require("stream");
const path = require('path');
const process = require('process');

const router = express.Router();
const upload = multer();

const CREDENTIALS_PATH = path.join(process.cwd(), "client_secret.json");
const TOKEN_STORE_PATH = path.join(process.cwd(), "storage.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_STORE_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
    access_token: client.credentials.access_token,
    token_expiry: client.credentials.token_expiry,
    scopes: client.credentials.scopes,
  });
  await fs.writeFile(TOKEN_STORE_PATH, payload);
}

async function authorize() {
  var client = await loadSavedCredentialsIfExist();
  if (client) return google.drive({ version: "v3", auth: client });
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) await saveCredentials(client);
  const service = google.drive({ version: "v3", auth: client });
  return service;
}

// const doAuth = async () => {
//   const auth = new GoogleAuth({
//     scopes: "https://www.googleapis.com/auth/drive",
//   });
//   const service = google.drive({ version: "v3", auth });

//   return service;
// };

// Create Inventory
router.post(
  "/",
  upload.fields([{ name: "files", maxCount: 5 }]),
  async (req, res, next) => {
    console.log(req.files);
    const fileIds = [];
    try {
      const files = req.files.files ?? [];
      const serviceInstance = await authorize();

      for (let file of files) {
        const { originalname, mimetype, buffer } = file;
        // The request body for the file to be uploaded.
        const requestBody = {
          name: originalname,
          fields: "id",
        };

        // The media content to be uploaded.
        const media = {
          mimeType: mimetype,
          body: Readable.from(file.buffer),
        };

        // Upload the file.
        const uploadedRes = await serviceInstance.files.create({
          requestBody,
          media,
        });
        console.log("File Id:", uploadedRes.data.id);
        fileIds.push(uploadedRes);
      }

      // Print the ID of the uploaded file.
      res.json({ objectIds: fileIds });
    } catch (err) {
      next(err);
    }
  }
);

// Get Inventory by ID
router.get(
  "/:id",
  //   authMiddleware,
  //   validate([param("id").isMongoId()]),
  async (req, res, next) => {
    try {
      const inventory = await Inventory.findById(req.params.id).populate(
        "productId"
      );
      if (!inventory)
        return res.status(404).json({ error: "Inventory not found" });
      res.json(inventory);
    } catch (err) {
      next(err);
    }
  }
);

// Update Inventory
router.put(
  "/:id",
  //   authMiddleware,
  //   validate([param("id").isMongoId()]),
  async (req, res, next) => {
    try {
      const inventory = await Inventory.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!inventory)
        return res.status(404).json({ error: "Inventory not found" });
      res.json(inventory);
    } catch (err) {
      next(err);
    }
  }
);

// Delete Inventory
router.delete(
  "/:id",
  //   authMiddleware,
  //   validate([param("id").isMongoId()]),
  async (req, res, next) => {
    try {
      const inventory = await Inventory.findByIdAndDelete(req.params.id);
      if (!inventory)
        return res.status(404).json({ error: "Inventory not found" });
      res.json({ message: "Inventory deleted" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
