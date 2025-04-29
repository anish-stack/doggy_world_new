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
      // Check if files are passed
      if (!files || files.length === 0) return;

      // Loop through each file and delete it
      for (let file of files) {
          if (file?.path) {
              // If it's a local file, delete it
              await fs.unlink(file.path);
              console.log(`Deleted local file: ${file.path}`);
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
