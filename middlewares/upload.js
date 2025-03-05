const multer = require("multer");

const storage = multer.memoryStorage(); // Stocker en mémoire avant de l'envoyer à Supabase

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf","text/plain"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non supporté"), false);
  }
};

const upload = multer({
  storage:storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
  // Limite de 10MB
});

module.exports = upload;
