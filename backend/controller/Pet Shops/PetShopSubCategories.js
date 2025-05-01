const PetShopSubCategoriesSchema = require("../../models/PetShops/PetShopSubCategories");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");

exports.createPetShopSubCategory = async (req, res) => {
    let imageUrl = '';
    let publicId = '';
    try {
        const { name, position, active = true, parentCategory = [] } = req.body;
        const file = req.file;
        console.log(req.body)

        let emptyFields = [];
        if (!name) emptyFields.push('Name is required');
        if (!position) emptyFields.push('Position is required');

        if (emptyFields.length > 0) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Validation Error",
                errors: emptyFields
            });
        }

        const checkPosition = await PetShopSubCategoriesSchema.findOne({ position });
        if (checkPosition) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: `Position ${position} is already taken. Please choose another.`,
            });
        }

        if (file) {
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;
        }
        let jsonparentCategory = [];

        if (parentCategory) {
            try {
                if (parentCategory.startsWith('[')) {
                    // JSON array string format
                    jsonparentCategory = JSON.parse(parentCategory);
                } else {
                    // Comma-separated string format
                    jsonparentCategory = parentCategory.split(',').map(id => id.trim());
                }

                if (!Array.isArray(jsonparentCategory)) {
                    throw new Error("parentCategory is not an array");
                }

            } catch (e) {
                if (file) await deleteFile(file.path);
                if (publicId) await deleteFileCloud(publicId);
                return res.status(400).json({
                    success: false,
                    message: "Invalid parentCategory format",
                    error: e.message
                });
            }
        }



        const newSubCategory = await PetShopSubCategoriesSchema.create({
            name,
            position,
            active,
            parentCategory: jsonparentCategory,
            imageUrl: {
                url: imageUrl,
                public_id: publicId
            }
        });

        if (file) await deleteFile(file.path);

        const redis = req.app.get('redis');
        const keys = await redis.keys('PetShopSubCat:*');
        if (keys.length > 0) await redis.del(keys);

        return res.status(201).json({
            success: true,
            message: "Pet Shop Sub Category created successfully",
            data: newSubCategory
        });

    } catch (error) {
        console.error(error);
        if (publicId) await deleteFileCloud(publicId);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.updatePetShopSubCategory = async (req, res) => {
    let publicIdToDelete = '';
    try {
        const { id } = req.params;
        const { name, position, active, parentCategory } = req.body;
        const file = req.file;

        const category = await PetShopSubCategoriesSchema.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Sub Category not found" });
        }

        let num = Number(position);
        if (num && num !== category.position) {
            const exists = await PetShopSubCategoriesSchema.findOne({ position: num });
            if (exists) {
                return res.status(400).json({ success: false, message: `Position ${position} is already taken.` });
            }
        }

        // Handle file upload
        if (file) {
            const uploadResult = await uploadSingleFile(file);
            publicIdToDelete = category.imageUrl?.public_id;
            category.imageUrl = {
                url: uploadResult.url,
                public_id: uploadResult.public_id
            };
        }

        // Update basic fields
        category.name = name || category.name;
        category.position = position || category.position;
        category.active = active !== undefined ? active : category.active;

        // Parse and update parentCategory
        let parent = parentCategory;
        let jsonparentCategory = [];

        try {
            if (typeof parent === 'string') {
                if (parent.trim().startsWith('[')) {
                    // JSON array string
                    jsonparentCategory = JSON.parse(parent);
                } else {
                    // Comma-separated string
                    jsonparentCategory = parent.split(',').map(id => id.trim());
                }
            } else if (Array.isArray(parent)) {
                jsonparentCategory = parent;
            } else {
                throw new Error("Invalid parentCategory type");
            }

            if (!Array.isArray(jsonparentCategory)) {
                throw new Error("parentCategory must be an array");
            }

            // ✅ Replace the entire array of parentCategory
            category.parentCategory = jsonparentCategory;

        } catch (e) {
            if (req.file) await deleteFile(req.file.path);
            if (publicIdToDelete) await deleteFileCloud(publicIdToDelete);
            return res.status(400).json({
                success: false,
                message: "Invalid parentCategory format",
                error: e.message
            });
        }

        await category.save();

        // Clean up local and cloud files
        if (file) {
            await deleteFile(file.path);
            if (publicIdToDelete) await deleteFileCloud(publicIdToDelete);
        }

        // Invalidate Redis cache
        const redis = req.app.get('redis');
        const keys = await redis.keys('PetShopSubCat:*');
        if (keys.length > 0) await redis.del(keys);

        return res.json({
            success: true,
            message: "Sub Category updated successfully",
            data: category
        });

    } catch (error) {
        console.error(error);
        if (req.file && publicIdToDelete) await deleteFileCloud(publicIdToDelete);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};



exports.deletePetShopSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await PetShopSubCategoriesSchema.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Sub Category not found" });

        if (category.imageUrl?.public_id) {
            await deleteFileCloud(category.imageUrl.public_id);
        }

        await PetShopSubCategoriesSchema.findByIdAndDelete(id);

        const redis = req.app.get('redis');
        const keys = await redis.keys('PetShopSubCat:*');
        if (keys.length > 0) await redis.del(keys);

        return res.json({ success: true, message: "Sub Category deleted successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};



exports.getAllPetShopSubCategories = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { search = '', page = 1, limit = 10 } = req.query;

        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 10;
        const skip = (parsedPage - 1) * parsedLimit;

        const cacheKey = `PetShopSubCat:all:${search}:${parsedPage}:${parsedLimit}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json({ success: true, message: "Fetched from cache", ...JSON.parse(cached) });
        }

        const query = {};
        if (search) {
            query.name = { $regex: search, $options: 'i' }; // case-insensitive search on subcategory name
        }

        const [subCategories, total] = await Promise.all([
            PetShopSubCategoriesSchema.find(query)
                .populate('parentCategory', 'title')
                .sort({ position: 1 })
                .skip(skip)
                .limit(parsedLimit),
            PetShopSubCategoriesSchema.countDocuments(query),
        ]);

        const response = {
            success: true,
            message: "Sub Categories fetched successfully",
            data: subCategories,
            total,
            page: parsedPage,
            totalPages: Math.ceil(total / parsedLimit),
        };

        await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600);

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




exports.getSinglePetShopSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await PetShopSubCategoriesSchema.findById(id);
        if (!category) return res.status(404).json({ success: false, message: "Sub Category not found" });

        return res.json({ success: true, message: "Sub Category fetched successfully", data: category });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
