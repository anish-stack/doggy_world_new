const Blogs = require("../../models/Blogs/BlogsSchema");
const { deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");

// Create a new blog
exports.createBlogs = async (req, res) => {

    const files = req.files || [];
    const { title, content, category, tags, isPublished } = req.body;

    try {
        if (!title || !content) {
            for (const file of files) {
                await deleteMultipleFiles(file);
            }
            return res.status(400).json({
                success: false,
                message: "Title and content are required fields",
            });
        }

        // Upload images if any
        let uploadedImages = [];
        if (files.length > 0) {
            uploadedImages = await uploadMultipleFiles(files);
        }

        // Parse tags if provided as a string
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (error) {
                for (const file of files) {
                    await deleteMultipleFiles(file);
                }
                return res.status(400).json({
                    success: false,
                    message: "Invalid tags format",
                });
            }
        }

        // Create new blog object
        const newBlog = new Blogs({
            title,
            content,
            category: category || "",
            tags: parsedTags,
            imageUrl: uploadedImages.map((item) => ({
                url: item.url,
                public_id: item.public_id,
            })),
            isPublished: isPublished === "true" || isPublished === true ? true : false,
        });

        // Save the new blog
        await newBlog.save();

      

        // Delete files after successful blog creation
        for (const file of files) {
            await deleteMultipleFiles(file.path);
        }

        res.status(201).json({
            success: true,
            message: "Blog created successfully",
            data: newBlog,
        });
    } catch (error) {
        // Delete files in case of an error
        for (const file of files) {
            await deleteMultipleFiles(file.path);
        }
        console.error("Error creating blog:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create blog",
            error: error.message,
        });
    }
};

// Get all blogs with optional filtering
exports.getAllBlogs = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { category, isPublished, limit = 10, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query filter
        const filter = {};
        if (category) filter.category = category;
        if (isPublished !== undefined) filter.isPublished = isPublished === "true";


        // Get total count for pagination
        const total = await Blogs.countDocuments(filter);

        // Fetch blogs with pagination
        const blogs = await Blogs.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

      

        res.status(200).json({
            success: true,
            count: blogs.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: blogs,
        });
    } catch (error) {
        console.error("Error fetching blogs:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch blogs",
            error: error.message,
        });
    }
};

// Get a single blog by ID
exports.getSingleBlog = async (req, res) => {
   
    try {
        const blogId = req.params.id;

        // Check Redis cache first
       

        const blog = await Blogs.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

      

        res.status(200).json({
            success: true,
            data: blog,
        });
    } catch (error) {
        console.error("Error fetching blog:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch blog",
            error: error.message,
        });
    }
};

// Update a blog
exports.updateBlog = async (req, res) => {
   
    try {
        const blogId = req.params.id;
        const files = req.files || [];
        const { title, content, category, tags, isPublished, removeImages } = req.body;

        // Check if blog exists
        const blog = await Blogs.findById(blogId);
        if (!blog) {
            if (files) {
                for (const file of files) {
                    await deleteMultipleFiles(file);
                }
            }
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        // Handle image removal if specified
        let currentImages = [...blog.imageUrl];
        if (removeImages) {
            const imagesToRemove = typeof removeImages === 'string' ?
                JSON.parse(removeImages) : removeImages;

            // Extract public_ids of images to delete from cloud storage
            const publicIdsToDelete = imagesToRemove.map(id => {
                const foundImage = blog.imageUrl.find(img => img._id.toString() === id);
                return foundImage ? foundImage.public_id : null;
            }).filter(id => id);

            // Delete from cloud storage
            if (publicIdsToDelete.length > 0) {
                await deleteMultipleFilesCloud(publicIdsToDelete);
            }

            // Filter out removed images
            currentImages = blog.imageUrl.filter(
                img => !imagesToRemove.includes(img._id.toString())
            );
        }

        // Upload new images if any
        let newImages = [];
        if (files.length > 0) {
            newImages = await uploadMultipleFiles(files);
        }

        // Parse tags if provided as a string
        let parsedTags = blog.tags;
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }

        // Update blog with new data
        const updatedBlog = await Blogs.findByIdAndUpdate(
            blogId,
            {
                title: title || blog.title,
                content: content || blog.content,
                category: category || blog.category,
                tags: parsedTags,
                imageUrl: [...currentImages, ...newImages],
                isPublished: isPublished === "true" || isPublished === true ? true : false,
            },
            { new: true }
        );

      

        res.status(200).json({
            success: true,
            message: "Blog updated successfully",
            data: updatedBlog,
        });

        if (files) {
            for (const file of files) {
                await deleteMultipleFiles(file);
            }
        }
    } catch (error) {
        console.error("Error updating blog:", error);
        if (files) {
            for (const file of files) {
                await deleteMultipleFiles(file);
            }
        }

        res.status(500).json({
            success: false,
            message: "Failed to update blog",
            error: error.message,
        });
    }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const blogId = req.params.id;

        // Check if blog exists
        const blog = await Blogs.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        // Delete associated images from cloud storage
        if (blog.imageUrl && blog.imageUrl.length > 0) {
            const publicIds = blog.imageUrl.map(img => img.public_id).filter(id => id);
            if (publicIds.length > 0) {
                await deleteMultipleFilesCloud(publicIds);
            }
        }

        // Delete the blog
        await Blogs.findByIdAndDelete(blogId);

        // Remove blog from Redis cache
        await redis.del(`blog:${blogId}`);

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting blog:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete blog",
            error: error.message,
        });
    }
};
