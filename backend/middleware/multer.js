const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper function to delete file
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err.message);
    } else {
      console.log('Temporary file deleted:', filePath);
    }
  });
};

module.exports = {
  upload,
  deleteFile
};
