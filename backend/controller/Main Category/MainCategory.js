const { deleteFile } = require("../../middleware/multer");
const Category = require("../../models/Category/Category");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");


// CREATE Main Category --- (Already Done)

exports.createMainCategory = async (req, res) => {
    try {
        const { title, position, isActive = true, route } = req.body;
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

        const checkAvailablePosition = await Category.findOne({ position });
        if (checkAvailablePosition) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: `Position ${position} is already taken. Please choose a different position.`,
            });
        }

        let imageUrl = '';
        let publicId = '';
        if (file) {
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;
        }

        const newCategory = await Category.create({
            title,
            position,
            isActive,
            route: route || title,
            image: {
                url: imageUrl,
                publicId: publicId
            }
        });

        if (file) await deleteFile(file.path);
        const redis = req.app.get('redis');

        const keys = await redis.keys('categories:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} category cache keys.`);
        } else {
            console.log('No category cache keys to clear.');
        }

        return res.status(201).json({
            success: true,
            message: "Main category created successfully",
            data: newCategory
        });

    } catch (error) {
        console.error(error);
        if (req.file) await deleteFileCloud(req.file.filename);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------------------------

// GET ALL Categories
exports.getAllCategories = async (req, res) => {
    try {
        const redis = req.app.get('redis'); 
        const { search = "", page = 1, limit = 10 } = req.query;

        const cacheKey = `categories:search=${search}:page=${page}:limit=${limit}`;

        // Check if data exists in Redis cache
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            return res.status(200).json({
                success: true,
                message: "Categories fetched successfully (from cache)",
                data: parsedData.data,
                pagination: parsedData.pagination,
                source: "cache"
            });
        }

        // If not cached, fetch from database
        const query = {
            $or: [
                { title: { $regex: search, $options: "i" } },
                { route: { $regex: search, $options: "i" } }
            ]
        };

        const totalCategories = await Category.countDocuments(query);

        const categories = await Category.find(query)
            .sort({ position: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const responseData = {
            data: categories,
            pagination: {
                total: totalCategories,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(totalCategories / limit),
            }
        };

        // Store the fresh data into Redis for next time (optional: 5 minutes expire)
        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 600);

        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully (from database)",
            ...responseData,
            source: "database"
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



// ----------------------------------------------------------------------------------------------------

// GET SINGLE Category
exports.getSingleCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category fetched successfully",
            data: category
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

// ----------------------------------------------------------------------------------------------------

// UPDATE Category (with image handling)
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, position, isActive, route } = req.body;
        const file = req.file;

        const category = await Category.findById(id);

        if (!category) {
            if (file) await deleteFile(file.path);
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }
        let numPosition = Number(position)

        // Check if position already used (by another category)
        if (numPosition && numPosition !== category.position) {
            const positionTaken = await Category.findOne({ numPosition });
            if (positionTaken) {
                if (file) await deleteFile(file.path); // Clean up uploaded file if new file uploaded
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }


        // If new image uploaded
        if (file) {
            if (category.image && category.image.publicId) {
                await deleteFileCloud(category.image.publicId); // Delete old image from cloud
            }
            const uploadResult = await uploadSingleFile(file);
            category.image.url = uploadResult.url;
            category.image.publicId = uploadResult.public_id;
            await deleteFile(file.path); // Remove temp file
        }

        // Update fields
        if (title) category.title = title;
        if (position) category.position = position;
        if (isActive !== undefined) category.isActive = isActive;
        if (route) category.route = route;

        await category.save();
        const redis = req.app.get('redis');

        const keys = await redis.keys('categories:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared from update ${keys.length} category cache keys.`);
        } else {
            console.log('No category cache keys to clear.');
        }

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category
        });

    } catch (error) {
        console.error(error);
        if (req.file) await deleteFileCloud(req.file.filename);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------------------------

// DELETE Category (also delete image from Cloudinary)
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        if (category.image && category.image.publicId) {
            await deleteFileCloud(category.image.publicId); // Delete image from Cloud
        }

        await Category.findByIdAndDelete(id);
        const redis = req.app.get('redis');

        const keys = await redis.keys('categories:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} category cache keys.`);
        } else {
            console.log('No category cache keys to clear.');
        }
        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
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
