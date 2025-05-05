const HomeBanner = require("../../models/Banners/HomeBanner");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");

exports.createHomeBanner = async (req, res) => {
    let imageUrl = '';
    let publicId = '';
    try {
        const { link, position, isActive = true } = req.body;
        const file = req.file;

        let emptyFields = [];
        if (!link) emptyFields.push('link is required');
        if (!position) emptyFields.push('Position is required');

        if (emptyFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: emptyFields
            });
        }

        const checkAvailablePosition = await HomeBanner.findOne({ position });
        if (checkAvailablePosition) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: `Position ${position} is already taken. Please choose a different position.`,
            });
        }

        if (file) {
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;
        }

        const newHomeBanner = await HomeBanner.create({
            position,
            isActive,
            link,
            imageUrl: {
                url: imageUrl,
                public_id: publicId
            }
        });

        if (file) await deleteFile(file.path);
        const redis = req.app.get('redis');

        const keys = await redis.keys('homeBanner:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Home Banner cache keys.`);
        } else {
            console.log('No Home Banner cache keys to clear.');
        }

        return res.status(201).json({
            success: true,
            message: "Home Banner created successfully",
            data: newHomeBanner
        });
    } catch (error) {
        console.error(error);
        if (req.file) await deleteFileCloud(publicId);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.updateHomeBanner = async (req, res) => {
    let imageUrl = '';
    let publicId = '';
    try {
        const { id } = req.params;
        const { link, position, isActive } = req.body;
        const file = req.file;

        // Find the banner to update
        const banner = await HomeBanner.findById(id);
        if (!banner) {
            if (file) await deleteFile(file.path);
            return res.status(404).json({
                success: false,
                message: "Home Banner not found"
            });
        }
        let numPos = Number(position)

        // Check if position is being updated and if it's already taken
        if (Number(numPos) && Number(numPos) !== banner.position) {
            const checkAvailablePosition = await HomeBanner.findOne({ position: numPos, _id: { $ne: id } });
            if (checkAvailablePosition) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }

        // Handle file upload if new file is provided
        if (file) {
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;

            // Delete old image from cloud if exists
            if (banner.imageUrl && banner.imageUrl.public_id) {
                await deleteFileCloud(banner.imageUrl.public_id);
            }
        }

        // Prepare update data
        const updateData = {
            link: link || banner.link,
            position: position || banner.position,
            isActive: isActive !== undefined ? isActive : banner.isActive
        };

        // Update image URL if new file was uploaded
        if (file) {
            updateData.imageUrl = {
                url: imageUrl,
                public_id: publicId
            };
        }

        // Update the banner
        const updatedBanner = await HomeBanner.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        // Clean up temporary file if it exists
        if (file) await deleteFile(file.path);

        // Clear cache
        const redis = req.app.get('redis');
        const keys = await redis.keys('homeBanner:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Home Banner cache keys.`);
        } else {
            console.log('No Home Banner cache keys to clear.');
        }

        return res.status(200).json({
            success: true,
            message: "Home Banner updated successfully",
            data: updatedBanner
        });
    } catch (error) {
        console.error(error);
        if (req.file) await deleteFileCloud(publicId);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.deleteHomeBanner = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the banner to delete
        const banner = await HomeBanner.findById(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Home Banner not found"
            });
        }

        // Delete the image from cloud storage if exists
        if (banner.imageUrl && banner.imageUrl.public_id) {
            await deleteFileCloud(banner.imageUrl.public_id);
        }

        // Delete the banner from database
        await HomeBanner.findByIdAndDelete(id);

        // Clear cache
        const redis = req.app.get('redis');
        const keys = await redis.keys('homeBanner:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Home Banner cache keys.`);
        } else {
            console.log('No Home Banner cache keys to clear.');
        }

        return res.status(200).json({
            success: true,
            message: "Home Banner deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getAllHomeBanners = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const cacheKey = 'homeBanner:all';

        // Try to get data from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Home Banners retrieved from cache",
                data: JSON.parse(cachedData),
                fromCache: true
            });
        }

        // If not in cache, get from database
        const banners = await HomeBanner.find().sort({ position: 1 });

        // Store in cache for future requests
        await redis.set(cacheKey, JSON.stringify(banners), 'EX', 3600); // Cache for 1 hour

        return res.status(200).json({
            success: true,
            message: "Home Banners retrieved successfully",
            data: banners
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getHomeBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const redis = req.app.get('redis');
        const cacheKey = `homeBanner:${id}`;

        // Try to get data from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Home Banner retrieved from cache",
                data: JSON.parse(cachedData),
                fromCache: true
            });
        }

        // If not in cache, get from database
        const banner = await HomeBanner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Home Banner not found"
            });
        }

        // Store in cache for future requests
        await redis.set(cacheKey, JSON.stringify(banner), 'EX', 3600); // Cache for 1 hour

        return res.status(200).json({
            success: true,
            message: "Home Banner retrieved successfully",
            data: banner
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};