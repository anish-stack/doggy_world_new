const Cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
require('dotenv').config()
ffmpeg.setFfmpegPath(ffmpegPath);

Cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return mimetype === 'image/gif' ? 'gif' : 'image';
  } else if (mimetype.startsWith('video/')) {
    return 'video';
  } else {
    return 'other';
  }
};


const uploadToCloudinary = async (filePath, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = Cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve({
          public_id: result.public_id,
          url: result.secure_url,
          resource_type: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height
        });
      }
    );

    fs.createReadStream(filePath).pipe(uploadStream);
  });
};

const handleImageUpload = async (file, folder = 'uploads', options = { quality: 80, width: 1280 }) => {
  const tempFilePath = `${file.path}_compressed`;

  try {

    await sharp(file.path)
      .resize({ width: options.width, withoutEnlargement: true })
      .jpeg({ quality: options.quality })
      .toFile(tempFilePath);

    // Upload compressed image
    const result = await uploadToCloudinary(file.path, folder);

    // Clean up
    fs.unlinkSync(tempFilePath);

    return result;
  } catch (error) {
    // Clean up if exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

const handleVideoUpload = async (file, folder = 'uploads', options = { bitrate: 1000, resolution: '720p' }) => {
  const tempFilePath = `${file.path}_compressed.mp4`;

  return new Promise((resolve, reject) => {
    ffmpeg(file.path)
      .outputOptions([
        `-b:v ${options.bitrate}k`,
        `-vf scale=-2:${options.resolution === '720p' ? 720 : 480}`
      ])
      .output(tempFilePath)
      .on('end', async () => {
        try {
          // Upload compressed video
          const result = await uploadToCloudinary(tempFilePath, folder);

          // Clean up
          fs.unlinkSync(tempFilePath);

          resolve(result);
        } catch (err) {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          reject(new Error(`Video upload failed: ${err.message}`));
        }
      })
      .on('error', (err) => {
        reject(new Error(`Video compression failed: ${err.message}`));
      })
      .run();
  });
};

const handleGifUpload = async (file, folder = 'uploads') => {
  try {
    return await uploadToCloudinary(file.path, folder);
  } catch (error) {
    throw new Error(`GIF upload failed: ${error.message}`);
  }
};

const uploadSingleFile = async (file, options = {}) => {
  const {
    folder = 'uploads',
    compress = true,
    imageOptions = { quality: 80, width: 1280 },
    videoOptions = { bitrate: 1000, resolution: '720p' }
  } = options;

  try {
    const fileType = getFileType(file.mimetype);

    if (fileType === 'image' && compress) {
      return await handleImageUpload(file, folder, imageOptions);
    } else if (fileType === 'video' && compress) {
      return await handleVideoUpload(file, folder, videoOptions);
    } else if (fileType === 'gif') {
      return await handleGifUpload(file, folder);
    } else {
      return await uploadToCloudinary(file.path, folder);
    }
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

const uploadMultipleFiles = async (files, options = {}) => {
  try {
    const uploadPromises = files.map(file => uploadSingleFile(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple file upload error:', error);
    throw new Error(`Multiple file upload failed: ${error.message}`);
  }
};

const deleteFileCloud = async (publicId) => {
  try {
    return await Cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

const deleteMultipleFilesCloud = async (publicIds) => {
  try {
    return await Cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Multiple file deletion error:', error);
    throw new Error(`Multiple file deletion failed: ${error.message}`);
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  handleImageUpload,
  handleVideoUpload,
  handleGifUpload,
  deleteFileCloud,
  deleteMultipleFilesCloud,
  uploadToCloudinary
};