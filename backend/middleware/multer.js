const multer = require('multer');
const fs = require('fs');
const fsP = require('fs').promises;
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
  limits: { fileSize: 100 * 1024 * 1024 },
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

const deleteMultipleFiles = async (files) => {
  try {
    if (!files || files.length === 0) return;

    for (let file of files) {
      if (file?.path) {
        const filePath = path.resolve(file.path); // Use resolve to handle cross-platform paths
        try {
          await fsP.access(filePath);  // Check if file exists
          await fsP.unlink(filePath);
          console.log(`Deleted local file: ${filePath}`);
        } catch (err) {
          console.error(`File not found or already deleted: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting multiple files:", error);
    throw new Error("Error deleting files");
  }
};
module.exports = {
  upload,
  deleteFile,
  deleteMultipleFiles
};
