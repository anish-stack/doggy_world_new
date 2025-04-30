const PhysioTherapy = require("../../models/PhysioTherapy/PhysioTherapy");
const { deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");

exports.createPhysioTherepay = async (req, res) => {
    let publicIds = [];
    let images = [];
    const redis = req.app.get("redis");

    try {
        const {
            title,
            smallDesc,
            description,
            price,
            priceMinute,
            discountPrice,
            popular,
            position,
        } = req.body;

        console.log("Received Physio data:", req.body);

        // Validation
        if (!title || !price) {
            if (req.files) deleteMultipleFiles(req.files);
            return res.status(400).json({
                success: false,
                message: "Title and Price are required fields",
            });
        }
        const checkValidposition = await PhysioTherapy.findOne({ position })
        if (checkValidposition) {
            return res.status(403).json({
                success: false,
                message: 'Position Already taken'
            })
        }

        if (price && (isNaN(price) || Number(price) < 0)) {
            if (req.files) deleteMultipleFiles(req.files);
            return res.status(400).json({
                success: false,
                message: "Price must be a valid positive number",
            });
        }

        const files = req.files || [];
        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one image is required",
            });
        }

        // Upload images to cloud
        try {
            const uploadResult = await uploadMultipleFiles(files);
            uploadResult.forEach((img, idx) => {
                images.push({
                    url: img.url,
                    public_id: img.public_id,
                    position: idx + 1,
                });
                publicIds.push(img.public_id);
            });
        } catch (uploadError) {
            if (req.files) deleteMultipleFiles(req.files);
            if (publicIds.length > 0) await deleteMultipleFilesCloud(publicIds);
            return res.status(500).json({
                success: false,
                message: `Error uploading images: ${uploadError.message}`,
            });
        }

        // Calculate discount percentage if not provided
        let offPercentage = 0;
        if (price && discountPrice) {
            offPercentage = Math.round(((price - discountPrice) / price) * 100);
        }

        // Create new PhysioTherapy document
        const newTherapy = new PhysioTherapy({
            title,
            smallDesc,
            description,
            price,
            priceMinute,
            discountPrice,
            popular: popular === "true",
            position,
            imageUrl: images,
            offPercentage,
        });

        const savedTherapy = await newTherapy.save();


        if (redis) {
            try {
                await redis.del("physioTherapyList");
                console.log("Redis cache cleared");
            } catch (err) {
                console.error("Redis error:", err);
            }
        }

        return res.status(201).json({
            success: true,
            message: "Physiotherapy service created successfully",
            data: savedTherapy,
        });
    } catch (error) {
        if (req.files) deleteMultipleFiles(req.files);
        if (publicIds.length > 0) await deleteMultipleFilesCloud(publicIds);

        console.error("Error in createPhysioTherepay:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create Physiotherapy service",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
};



exports.getAllPhysioTherapies = async (req, res) => {
    const redis = req.app.get("redis");
    try {

        if (redis) {
            const cachedData = await redis.get("physioTherapyList");
            if (cachedData) {
                console.log("Using cached physio therapy data");
                return res.status(200).json({
                    success: true,
                    message: "Retrieved physiotherapy services from cache",
                    data: JSON.parse(cachedData),
                });
            }
        }

        // If not cached, fetch from database
        const therapies = await PhysioTherapy.find().sort({ position: 1 });

        // Cache the results
        if (redis) {
            await redis.set("physioTherapyList", JSON.stringify(therapies), {
                EX: 3600,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Retrieved all physiotherapy services",
            count: therapies.length,
            data: therapies,
        });
    } catch (error) {
        console.error("Error in getAllPhysioTherapies:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve physiotherapy services",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
};


exports.getPhysioTherapyById = async (req, res) => {
    try {
        const { id } = req.params;

        const therapy = await PhysioTherapy.findById(id);

        if (!therapy) {
            return res.status(404).json({
                success: false,
                message: "Physiotherapy service not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Retrieved physiotherapy service",
            data: therapy,
        });
    } catch (error) {
        console.error("Error in getPhysioTherapyById:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve physiotherapy service",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
};

// Update a physiotherapy service
exports.updatePhysioTherapy = async (req, res) => {
    let publicIds = [];
    let newImages = [];
    const redis = req.app.get("redis");

    try {
        const { id } = req.params;
        const {
            title,
            smallDesc,
            description,
            price,
            priceMinute,
            discountPrice,
            popular,
            position,
            imagesToDelete,
        } = req.body;

        const therapy = await PhysioTherapy.findById(id);

        if (!therapy) {
            if (req.files) await deleteMultipleFiles(req.files);
            return res.status(404).json({
                success: false,
                message: "Physiotherapy service not found",
            });
        }

        const numPos = Number(position);

        // Check if position already taken
        if (numPos && numPos !== therapy.position) {
            const checkValidPosition = await PhysioTherapy.findOne({
                position: numPos,
                _id: { $ne: id },
            });

            if (checkValidPosition) {
                if (req.files) await deleteMultipleFiles(req.files);
                return res.status(403).json({
                    success: false,
                    message: "Position already taken by another service",
                });
            }
        }

        // Validate price
        if (price && (isNaN(price) || Number(price) < 0)) {
            if (req.files) await deleteMultipleFiles(req.files);
            return res.status(400).json({
                success: false,
                message: "Price must be a valid positive number",
            });
        }

        // Parse and handle imagesToDelete
        let JsonRemove = [];
        if (imagesToDelete) {
            try {
                JsonRemove = JSON.parse(imagesToDelete);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid format for imagesToDelete",
                });
            }
        }

        // Delete images from Cloudinary and local list
        const existingImages = [...therapy.imageUrl];
        if (Array.isArray(JsonRemove) && JsonRemove.length > 0) {
            await deleteMultipleFilesCloud(JsonRemove);
            therapy.imageUrl = existingImages.filter(img => !JsonRemove.includes(img.public_id));
        }

        // Handle new file uploads
        if (req.files && req.files.length > 0) {
            try {
                const uploadResult = await uploadMultipleFiles(req.files);
                let imgPos = therapy.imageUrl.length + 1;

                uploadResult.forEach((img) => {
                    newImages.push({
                        url: img.url,
                        public_id: img.public_id,
                        position: imgPos++,
                    });
                    publicIds.push(img.public_id);
                });

                therapy.imageUrl = [...therapy.imageUrl, ...newImages];
            } catch (uploadError) {
                if (req.files) await deleteMultipleFiles(req.files);
                if (publicIds.length > 0) await deleteMultipleFilesCloud(publicIds);

                return res.status(500).json({
                    success: false,
                    message: `Error uploading images: ${uploadError.message}`,
                });
            }
        }

        // Calculate discount percentage
        let offPercentage = therapy.offPercentage;
        if (price && discountPrice) {
            offPercentage = Math.round(((price - discountPrice) / price) * 100);
        }

        // Update fields
        therapy.title = title || therapy.title;
        therapy.smallDesc = smallDesc !== undefined ? smallDesc : therapy.smallDesc;
        therapy.description = description !== undefined ? description : therapy.description;
        therapy.price = price || therapy.price;
        therapy.priceMinute = priceMinute !== undefined ? priceMinute : therapy.priceMinute;
        therapy.discountPrice = discountPrice !== undefined ? discountPrice : therapy.discountPrice;
        therapy.popular = popular !== undefined ? popular === "true" : therapy.popular;
        therapy.position = numPos || therapy.position;
        therapy.offPercentage = offPercentage;

        const updatedTherapy = await therapy.save();

        // Clear Redis Cache
        if (redis) {
            try {
                await redis.del("physioTherapyList");
                console.log("Redis cache cleared after update");
            } catch (err) {
                console.error("Redis error:", err);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Physiotherapy service updated successfully",
            data: updatedTherapy,
        });

    } catch (error) {
        if (req.files) await deleteMultipleFiles(req.files);
        if (publicIds.length > 0) await deleteMultipleFilesCloud(publicIds);

        console.error("Error in updatePhysioTherapy:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update physiotherapy service",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
};

// Delete a physiotherapy service
exports.deletePhysioTherapy = async (req, res) => {
    const redis = req.app.get("redis");

    try {
        const { id } = req.params;

        const therapy = await PhysioTherapy.findById(id);

        if (!therapy) {
            return res.status(404).json({
                success: false,
                message: "Physiotherapy service not found",
            });
        }

        // Delete associated images from cloud storage
        const imageIds = therapy.imageUrl.map(img => img.public_id);
        if (imageIds.length > 0) {
            await deleteMultipleFilesCloud(imageIds);
        }

        // Delete the therapy document
        await PhysioTherapy.findByIdAndDelete(id);

        // Clear Redis cache
        if (redis) {
            try {
                await redis.del("physioTherapyList");
                console.log("Redis cache cleared after deletion");
            } catch (err) {
                console.error("Redis error:", err);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Physiotherapy service deleted successfully",
        });
    } catch (error) {
        console.error("Error in deletePhysioTherapy:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete physiotherapy service",
            error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
        });
    }
};