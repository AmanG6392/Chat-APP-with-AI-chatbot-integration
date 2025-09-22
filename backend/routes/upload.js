import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const upload = multer({ dest: "uploads/" }); // temporary local storage
const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto", // auto detects image, video, raw file
      folder: "chat_uploads" // optional: organize uploads
    });

    fs.unlinkSync(req.file.path); // remove local file after upload

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "File upload failed" });
  }
});

export default router;
