const PetShopCategoriesSchema = require("../../models/PetShops/PetShopCategoriesSchema");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");


exports.createPetShopCategory = async (req, res) => {
    let imageUrl = '';
    let publicId = '';
    try {
        const { title, position, active = true, backgroundColour } = req.body;
        const file = req.file;

        let emptyFields = [];
        if (!title) emptyFields.push('Title is required');
        if (!position) emptyFields.push('Position is required');

        if (emptyFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: emptyFields
            });
        }

        const checkAvailablePosition = await PetShopCategoriesSchema.findOne({ position });
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

        const newCategory = await PetShopCategoriesSchema.create({
            title,
            position,
            backgroundColour,
            active,
            screen: title,
            imageUrl: {
                url: imageUrl,
                public_id: publicId
            }
        });

        if (file) await deleteFile(file.path);
        const redis = req.app.get('redis');

        const keys = await redis.keys('PetShopCat:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} category cache keys.`);
        } else {
            console.log('No category cache keys to clear.');
        }

        return res.status(201).json({
            success: true,
            message: "Pet Shop category created successfully",
            data: newCategory
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


exports.updatePetShopCategory = async (req, res) => {
    let publicIdToDelete = '';
    try {
        const { id } = req.params;
        const { title, position, backgroundColour, active } = req.body;
        const file = req.file;

        const category = await PetShopCategoriesSchema.findById(id);

        const checkAvailablePosition = await PetShopCategoriesSchema.findOne({
            position: Number(position),
            _id: { $ne: id }, 
        });

        if (checkAvailablePosition) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: `Position ${position} is already taken. Please choose a different position.`,
            });
        }


        if (!category) return res.status(404).json({ success: false, message: "Category not found" });


        if (file) {
            const uploadResult = await uploadSingleFile(file);
            publicIdToDelete = category.imageUrl.public_id;
            category.imageUrl = {
                url: uploadResult.url,
                public_id: uploadResult.public_id
            };
        }

        category.title = title || category.title;
        category.position = position || category.position;
        category.backgroundColour = backgroundColour || category.backgroundColour;
        category.active = active !== undefined ? active : category.active;
        category.screen = title || category.screen;

        await category.save();

        if (file) {
            await deleteFile(file.path);
            console.log("publicIdToDelete",publicIdToDelete)
            if (publicIdToDelete) await deleteFileCloud(publicIdToDelete);
        }

        const redis = req.app.get('redis');
        const keys = await redis.keys('PetShopCat:*');
        if (keys.length > 0) await redis.del(keys);

        return res.json({ success: true, message: "Category updated successfully", data: category });

    } catch (error) {
        console.error(error);
        if (req.file) await deleteFileCloud(publicIdToDelete);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};



exports.deletePetShopCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await PetShopCategoriesSchema.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        if (category.imageUrl.public_id) {
            await deleteFileCloud(category.imageUrl.public_id);
        }

        await PetShopCategoriesSchema.findByIdAndDelete(id);

        const redis = req.app.get('redis');
        const keys = await redis.keys('PetShopCat:*');
        if (keys.length > 0) await redis.del(keys);

        return res.json({ success: true, message: "Category deleted successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};


exports.getAllPetShopCategories = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { search = '', page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 10;
        const skip = (parsedPage - 1) * parsedLimit;

        const cacheKey = `PetShopCat:all:${search}:${parsedPage}:${parsedLimit}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                message: "Fetched from cache",
                ...JSON.parse(cached),
            });
        }

        // Build search filter
        const query = {};
        if (search) {
            query.title = { $regex: search, $options: 'i' }; // case-insensitive search on title
        }

        const [categories, totalCount] = await Promise.all([
            PetShopCategoriesSchema.find(query).sort({ position: 1 }).skip(skip).limit(parsedLimit),
            PetShopCategoriesSchema.countDocuments(query)
        ]);

        const response = {
            success: true,
            message: "Categories fetched successfully",
            data: categories,
            total: totalCount,
            page: parsedPage,
            totalPages: Math.ceil(totalCount / parsedLimit),
        };

        await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600); // cache for 1 hour

        return res.json(response);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.getSinglePetShopCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await PetShopCategoriesSchema.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        return res.json({ success: true, message: "Category fetched successfully", data: category });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

