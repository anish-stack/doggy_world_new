const GroomingService = require("../../models/Grooming/GroomingService");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");

// Create a new grooming service
exports.CreateGrommingService = async (req, res) => {
    let imageUrl = "";
    let publicId = "";
    try {
        const file = req.file || {};

        const {
            type,
            description,
            startPrice,
            endPrice,
            position,
            anyOffer = false,
            offer,
            priceVary,
            bookingAccept,
            isActive,
        } = req.body;

        const checkAvailablePosition = await GroomingService.findOne({ position });
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

        const newService = await GroomingService.create({
            type,
            description,
            startPrice,
            endPrice,
            position,
            anyOffer,
            offer,
            priceVary,
            bookingAccept,
            isActive,
            imageUrl: {
                url: imageUrl,
                public_id: publicId,
            },
        });

        if (file) await deleteFile(file.path);
        const redis = req.app.get("redis");

        const keys = await redis.keys("GroomingServices:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Grooming Services cache keys.`);
        } else {
            console.log("No Grooming Services cache keys to clear.");
        }
        return res.status(201).json({
            success: true,
            message: " Grooming Services created successfully",
            data: newService,
        });
    } catch (error) {
        console.error(error);
        if (file) await deleteFile(file.path);
        if (publicId) await deleteFileCloud(publicId);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Get all grooming services
exports.GetAllGroomingServices = async (req, res) => {
    try {
        const redis = req.app.get("redis");
        const cacheKey = "GroomingServices:all";

        // Try to get data from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log("Returning grooming services from cache");
            return res.status(200).json({
                success: true,
                message: "Grooming services retrieved successfully",
                data: JSON.parse(cachedData),
            });
        }

        // If not in cache, fetch from database
        const services = await GroomingService.find().sort({ position: 1 });

        // Store in cache for future requests
        await redis.set(cacheKey, JSON.stringify(services), { EX: 3600 }); // Cache for 1 hour

        return res.status(200).json({
            success: true,
            message: "Grooming services retrieved successfully",
            data: services,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Get a single grooming service by ID
exports.GetSingleGroomingService = async (req, res) => {
    try {
        const { id } = req.params;
        const redis = req.app.get("redis");
        const cacheKey = `GroomingServices:${id}`;

        // Try to get data from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`Returning grooming service ${id} from cache`);
            return res.status(200).json({
                success: true,
                message: "Grooming service retrieved successfully",
                data: JSON.parse(cachedData),
            });
        }

        // If not in cache, fetch from database
        const service = await GroomingService.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Grooming service not found",
            });
        }

        // Store in cache for future requests
        await redis.set(cacheKey, JSON.stringify(service), { EX: 3600 }); // Cache for 1 hour

        return res.status(200).json({
            success: true,
            message: "Grooming service retrieved successfully",
            data: service,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Update a grooming service
exports.UpdateGroomingService = async (req, res) => {
    let imageUrl = "";
    let publicId = "";
    try {
        const { id } = req.params;
        const file = req.file
        const {
            type,
            description,
            startPrice,
            endPrice,
            position,
            anyOffer,
            offer,
            priceVary,
            bookingAccept,
            isActive,
        } = req.body;
console.log(file)
        // Find the service to update
        const existingService = await GroomingService.findById(id);
        if (!existingService) {
            if (file) await deleteFile(file);
            return res.status(404).json({
                success: false,
                message: "Grooming service not found",
            });
        }

        // Check if the new position is already taken by another service
        if (position && position !== existingService.position.toString()) {
            const checkAvailablePosition = await GroomingService.findOne({
                position:Number(position),
                _id: { $ne: id },
            });
            if (checkAvailablePosition) {
                if (file) await deleteFile(file);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }

        // Handle image upload if there's a new file
        if (file && file.path) {
            // Delete previous image from cloud if it exists
            if (existingService.imageUrl && existingService.imageUrl.publicId) {
                await deleteFileCloud(existingService.imageUrl.publicId);
            }

            // Upload the new image
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;

            // Delete the temp file
            await deleteFile(file);
        } else {
            // Keep the existing image data
            imageUrl = existingService.imageUrl?.url || "";
            publicId = existingService.imageUrl?.publicId || "";
        }

        // Update the service with new data
        const updatedService = await GroomingService.findByIdAndUpdate(
            id,
            {
                type: type || existingService.type,
                description: description || existingService.description,
                startPrice: startPrice || existingService.startPrice,
                endPrice: endPrice || existingService.endPrice,
                position: position || existingService.position,
                anyOffer: anyOffer !== undefined ? anyOffer : existingService.anyOffer,
                offer: offer || existingService.offer,
                priceVary:
                    priceVary !== undefined ? priceVary : existingService.priceVary,
                bookingAccept:
                    bookingAccept !== undefined
                        ? bookingAccept
                        : existingService.bookingAccept,
                isActive: isActive !== undefined ? isActive : existingService.isActive,
                imageUrl: {
                    url: imageUrl,
                    publicId: publicId,
                },
            },
            { new: true }
        );

        // Clear cache
        const redis = req.app.get("redis");
        const keys = await redis.keys("GroomingServices:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Grooming Services cache keys.`);
        }

        return res.status(200).json({
            success: true,
            message: "Grooming service updated successfully",
            data: updatedService,
        });
    } catch (error) {
        console.error(error);
        if (file) await deleteFile(file);
        if (publicId && !existingService?.imageUrl?.publicId)
            await deleteFileCloud(publicId);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Delete a grooming service
exports.DeleteGroomingService = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the service to delete
        const service = await GroomingService.findById(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Grooming service not found",
            });
        }

        // Delete the associated image from cloud storage if it exists
        if (service.imageUrl && service.imageUrl.publicId) {
            await deleteFileCloud(service.imageUrl.publicId);
        }

        // Delete the service from the database
        await GroomingService.findByIdAndDelete(id);

        // Clear cache
        const redis = req.app.get("redis");
        const keys = await redis.keys("GroomingServices:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Grooming Services cache keys.`);
        }

        return res.status(200).json({
            success: true,
            message: "Grooming service deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
