const express = require("express");
const { verifyToken, verifyRole } = require("../middlewares/auth");

const upload = require("../middlewares/upload");
const { uploadData } = require("../controllers/UploadController");

const uploadRoute = express.Router();

uploadRoute.post("/:type/:userId", 
    verifyToken, 
    verifyRole(["USER", "ADMIN", "RECRUITER"]), 
    upload.single("file"), 
    uploadData
);


module.exports = uploadRoute;
