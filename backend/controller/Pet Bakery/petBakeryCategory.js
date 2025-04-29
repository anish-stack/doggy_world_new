const petBakery = require("../../models/Bakery/petBakerySchema");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");

exports.createPetBakery = async (req, res) => {

    let imageUrl = null;
    let publicId = null;

    try {
        const redis = req.app.get('redis');
        const { title, screenName, tag, active, position } = req.body;

        // Validate required fields
        if (!title) {
            await deleteFile(req.file.path);
            return res.status(400).json({ success: false, message: "Title is required" });
        }
        if (!position) {
            await deleteFile(req.file.path);

            return res.status(400).json({ success: false, message: "Position is required" });
        }

        // Check if position already exists
        const existing = await petBakery.findOne({ position });
        if (existing) {
            await deleteFile(req.file.path);

            return res.status(400).json({ success: false, message: "Position already exists" });
        }

        const image = req.file;
        if (!image) {

            return res.status(400).json({ success: false, message: "Image is required" });
        }

        try {
            const uploadResult = await uploadSingleFile(image);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;
        } catch (uploadError) {
            await deleteFileCloud(publicId);
            await deleteFile(req.file.path);

            return res.status(500).json({
                success: false,
                message: `Error uploading image: ${uploadError.message}`
            });
        }

        const newVaccineProduct = new petBakery({
            title,
            screenName:title,
            tag,
            active,
            position,
            imageUrl: {
                url: imageUrl,
                public_id: publicId
            }
        });

        await newVaccineProduct.save();

        if (redis) {
            await redis.del('petBakery:all');
        }
        await deleteFile(req.file.path);

        return res.status(201).json({
            success: true,
            message: "Pet bakery product created successfully",
            data: newVaccineProduct
        });

    } catch (error) {
        console.error("Create Vaccine Product Error:", error);

        if (req.file && req.file.path) {
            await deleteFile(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: "Error creating vaccine product",
            error: error.message
        });
    }
};


exports.getAllPetBakery = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { search = '', page = 1, limit = 10 } = req.query;


        const cached = await redis.get('petBakery:all');
        if (cached) {
            return res.status(200).json({
                success: true,
                message: "Fetched from Redis Cache",
                data: JSON.parse(cached)
            });
        }

        const query = {
            title: { $regex: search, $options: 'i' }
        };

        const total = await petBakery.countDocuments(query);
        const types = await petBakery.find(query)
            .sort({ position: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        await redis.set('petBakery:all', JSON.stringify(types));

        return res.status(200).json({
            success: true,
            message: "Fetched from Database",
            data: types,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePetBakery = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { id } = req.params;
        const { title, tag, active, position } = req.body;

        const existingBakery = await petBakery.findById(id);
        if (!existingBakery) {
            if (req.file?.path) await deleteFile(req.file.path);
            return res.status(404).json({ success: false, message: "Pet bakery item not found" });
        }

        let numPos = Number(position)

        // Check for duplicate position
        if (numPos && numPos !== existingBakery.position) {
            const existingPosition = await petBakery.findOne({ numPos });
            if (existingPosition) {
                if (req.file?.path) await deleteFile(req.file.path);
                return res.status(400).json({ success: false, message: "Position already exists" });
            }
        }

        let imageUrl = existingBakery.imageUrl.url;
        let publicId = existingBakery.imageUrl.public_id;

        if (req.file) {
            try {
                const uploadResult = await uploadSingleFile(req.file);
                imageUrl = uploadResult.url;
                await deleteFileCloud(publicId);
                publicId = uploadResult.public_id;
                if (req.file?.path) await deleteFile(req.file.path);
            } catch (uploadError) {
                if (req.file?.path) await deleteFile(req.file.path);
                return res.status(500).json({
                    success: false,
                    message: "Image upload failed",
                    error: uploadError.message
                });
            }
        }

        const updated = await petBakery.findByIdAndUpdate(id, {
            title,
           
            tag,
            active,
            position,
            imageUrl: { url: imageUrl, public_id: publicId }
        }, { new: true });

        if (redis) await redis.del('petBakery:all');

        return res.status(200).json({
            success: true,
            message: "Pet bakery item updated successfully",
            data: updated
        });

    } catch (error) {
        console.error("Update Error:", error);
        if (req.file?.path) await deleteFile(req.file.path);
        return res.status(500).json({
            success: false,
            message: "Error updating pet bakery item",
            error: error.message
        });
    }
};




exports.deletePetBakery = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { id } = req.params;

        const bakery = await petBakery.findById(id);
        if (!bakery) {
            return res.status(404).json({ success: false, message: "Pet bakery item not found" });
        }

        // Delete image from cloud
        if (bakery.imageUrl.public_id) {
            await deleteFileCloud(bakery.imageUrl.public_id);
        }

        await petBakery.findByIdAndDelete(id);

        if (redis) await redis.del('petBakery:all');

        return res.status(200).json({
            success: true,
            message: "Pet bakery item deleted successfully"
        });
    } catch (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting pet bakery item",
            error: error.message
        });
    }
};


exports.getSinglePetBakery = async (req, res) => {
    try {
        const { id } = req.params;

        const bakery = await petBakery.findById(id);
        if (!bakery) {
            return res.status(404).json({ success: false, message: "Pet bakery item not found" });
        }

        return res.status(200).json({
            success: true,
            data: bakery
        });
    } catch (error) {
        console.error("Get Single Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching pet bakery item",
            error: error.message
        });
    }
};
