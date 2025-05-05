const ServiceBanner = require("../../models/Banners/ServiceBanner");
const { deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");

exports.createAServiceBanners = async (req, res) => {
    let imageUrls = [];
    
    try {
        const { position, type, isActive } = req.body;
        const files = req.files;
        
        // Validation
        const errors = [];
        if (!position) errors.push("Position is required");
        if (!type) errors.push("Type is required");
        if (!files || files.length === 0) errors.push("At least one image file is required");
        
        // Validate position is a number
        if (position && isNaN(Number(position))) {
            errors.push("Position must be a number");
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors
            });
        }
        
        // Check if position is already used
        const existingBanner = await ServiceBanner.findOne({ position });
        if (existingBanner) {
            for (const file of files) {
                await deleteMultipleFiles(file.path); // Clean up local files
            }
            return res.status(400).json({
                success: false,
                message: `Position ${position} is already taken. Please choose another.`
            });
        }
        
        // Upload to Cloudinary
        const uploadedImages = await uploadMultipleFiles(files, "ServiceBanners");
        
        imageUrls = uploadedImages.map(item => ({
            url: item.url,
            public_id: item.public_id
        }));
        
        // Create banner document
        const newBanner = new ServiceBanner({
            imageUrl: imageUrls,
            position: Number(position),
            type,
            isActive: isActive !== undefined ? isActive : false
        });
        
        await newBanner.save();
        
        // Clear cache if using Redis
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            const keys = await redis.keys('serviceBanner:*');
            if (keys.length > 0) {
                await redis.del(keys);
                console.log(`Cleared ${keys.length} Service Banner cache keys.`);
            }
        }
        
        return res.status(201).json({
            success: true,
            message: "Service banner created successfully",
            data: newBanner
        });
        
    } catch (error) {
        console.error("Error creating service banner:", error);
        
        // Cleanup Cloudinary images if DB operation fails
        if (imageUrls.length > 0) {
            const publicIds = imageUrls.map(img => img.public_id);
            await deleteMultipleFilesCloud(publicIds);
        }
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.updateServiceBanner = async (req, res) => {
    let newImageUrls = [];
    
    try {
        const { id } = req.params;
        const { position, type, isActive, removeImages } = req.body;
        console.log(req.body)
        const files = req.files;
        
        // Find existing banner
        const existingBanner = await ServiceBanner.findById(id);
        if (!existingBanner) {
            // Clean up uploaded files if any
            if (files && files.length > 0) {
                for (const file of files) {
                    await deleteMultipleFiles(file.path);
                }
            }
            return res.status(404).json({
                success: false,
                message: "Service banner not found"
            });
        }
        
        // Validate position is a number if provided
        if (position !== undefined && isNaN(Number(position))) {
            if (files && files.length > 0) {
                for (const file of files) {
                    await deleteMultipleFiles(file.path);
                }
            }
            return res.status(400).json({
                success: false,
                message: "Position must be a number",
            });
        }
        
        // Check if new position is already taken by another banner
        if (position !== undefined && String(existingBanner.position) !== String(position)) {
            const positionTaken = await ServiceBanner.findOne({ 
                position: Number(position),
                _id: { $ne: id }
            });
            
            if (positionTaken) {
                if (files && files.length > 0) {
                    for (const file of files) {
                        await deleteMultipleFiles(file.path);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose another.`
                });
            }
        }
        
        // Handle image updates
        let currentImages = [...existingBanner.imageUrl];
        
        const jsonRemoveeImages = JSON.parse(removeImages)
        // Handle image removals if specified
        if (jsonRemoveeImages && Array.isArray(jsonRemoveeImages) && jsonRemoveeImages.length > 0) {
            // Extract public_ids for images to remove
            const publicIdsToRemove = [];
            
            jsonRemoveeImages.forEach(imgId => {
                const imageToRemove = currentImages.find(img => String(img._id) === String(imgId));
                if (imageToRemove && imageToRemove.public_id) {
                    publicIdsToRemove.push(imageToRemove.public_id);
                }
            });
            
            // Delete from cloud storage
            if (publicIdsToRemove.length > 0) {
                await deleteMultipleFilesCloud(publicIdsToRemove);
            }
            
            // Filter out removed images
            currentImages = currentImages.filter(img => 
                !removeImages.includes(String(img._id))
            );
        }
        
        // Add new images if any
        if (files && files.length > 0) {
            const uploadedImages = await uploadMultipleFiles(files, "ServiceBanners");
            
            newImageUrls = uploadedImages.map(item => ({
                url: item.url,
                public_id: item.public_id
            }));
            
            // Combine with existing images that weren't removed
            currentImages = [...currentImages, ...newImageUrls];
        }
        
        // Update banner
        const updateData = {
            imageUrl: currentImages,
            ...(position !== undefined && { position: Number(position) }),
            ...(type !== undefined && { type }),
            ...(isActive !== undefined && { isActive })
        };
        
        const updatedBanner = await ServiceBanner.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        
        // Clear cache if using Redis
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            const keys = await redis.keys('serviceBanner:*');
            if (keys.length > 0) {
                await redis.del(keys);
                console.log(`Cleared ${keys.length} Service Banner cache keys.`);
            }
        }
        
        return res.status(200).json({
            success: true,
            message: "Service banner updated successfully",
            data: updatedBanner
        });
        
    } catch (error) {
        console.error("Error updating service banner:", error);
        
        // Cleanup newly uploaded Cloudinary images if DB operation fails
        if (newImageUrls.length > 0) {
            const publicIds = newImageUrls.map(img => img.public_id);
            await deleteMultipleFilesCloud(publicIds);
        }
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.deleteServiceBanner = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the banner
        const banner = await ServiceBanner.findById(id);
        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Service banner not found"
            });
        }
        
        // Delete images from cloud storage
        if (banner.imageUrl && banner.imageUrl.length > 0) {
            const publicIds = banner.imageUrl
                .filter(img => img.public_id)
                .map(img => img.public_id);
            
            if (publicIds.length > 0) {
                await deleteMultipleFilesCloud(publicIds);
            }
        }
        
        // Delete banner document
        await ServiceBanner.findByIdAndDelete(id);
        
        // Clear cache if using Redis
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            const keys = await redis.keys('serviceBanner:*');
            if (keys.length > 0) {
                await redis.del(keys);
                console.log(`Cleared ${keys.length} Service Banner cache keys.`);
            }
        }
        
        return res.status(200).json({
            success: true,
            message: "Service banner deleted successfully"
        });
        
    } catch (error) {
        console.error("Error deleting service banner:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getAllServiceBanners = async (req, res) => {
    try {
        // Check cache if Redis is available
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            const cacheKey = 'serviceBanner:all';
            
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({
                    success: true,
                    message: "Service banners retrieved from cache",
                    data: JSON.parse(cachedData),
                    fromCache: true
                });
            }
        }
        
        // Fetch from database
        const banners = await ServiceBanner.find().sort({ position: 1 });
        
        // Store in cache if Redis is available
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            await redis.set('serviceBanner:all', JSON.stringify(banners), 'EX', 3600); // Cache for 1 hour
        }
        
        return res.status(200).json({
            success: true,
            message: "Service banners retrieved successfully",
            data: banners
        });
        
    } catch (error) {
        console.error("Error fetching service banners:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.getServiceBannersByType = async (req, res) => {
    try {
        const { type } = req.params;
        
        if (!type) {
            return res.status(400).json({
                success: false,
                message: "Type parameter is required"
            });
        }
        
        // Check cache if Redis is available
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            const cacheKey = `serviceBanner:type:${type}`;
            
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({
                    success: true,
                    message: `Service banners of type '${type}' retrieved from cache`,
                    data: JSON.parse(cachedData),
                    fromCache: true
                });
            }
        }
        
        // Fetch from database
        const banners = await ServiceBanner.find({ type }).sort({ position: 1 });
        
        // Store in cache if Redis is available
        if (req.app.get('redis')) {
            const redis = req.app.get('redis');
            await redis.set(`serviceBanner:type:${type}`, JSON.stringify(banners), 'EX', 3600); // Cache for 1 hour
        }
        
        return res.status(200).json({
            success: true,
            message: `Service banners of type '${type}' retrieved successfully`,
            data: banners
        });
        
    } catch (error) {
        console.error("Error fetching service banners by type:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.checkPositionAvailability = async (req, res) => {
    try {
        const { position } = req.params;
        
        if (!position) {
            return res.status(400).json({
                success: false,
                message: "Position parameter is required"
            });
        }
        
        // Validate position is a number
        if (isNaN(Number(position))) {
            return res.status(400).json({
                success: false,
                message: "Position must be a number"
            });
        }
        
        // Check if position is already taken
        const existingBanner = await ServiceBanner.findOne({ position: Number(position) });
        
        return res.status(200).json({
            success: true,
            message: existingBanner ? 
                `Position ${position} is already taken` : 
                `Position ${position} is available`,
            isAvailable: !existingBanner
        });
        
    } catch (error) {
        console.error("Error checking position availability:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};