const LabtestProduct = require("../../models/LabsTest/LabSchema");
const { deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");

// Create a new labtest product
exports.createLabTestProduct = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const {
            title,
            price,
            discount_price,
            off_percentage,
            is_active,
            tag,
            forage,
            is_dog,
            is_popular,
            LabTestdInclueds,
            is_cat,
            small_desc,
            desc,
            position,
            home_price_of_package,
            home_price_of_package_discount,
            WhichTypeOfvaccinations
        } = req.body;

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required"
            });
        }

        if (!price || isNaN(parseFloat(price))) {
            return res.status(400).json({
                success: false,
                message: "Valid price is required"
            });
        }

        // Validate numeric fields
        if (discount_price && isNaN(parseFloat(discount_price))) {
            return res.status(400).json({
                success: false,
                message: "Discount price must be a number"
            });
        }

        if (off_percentage && (isNaN(parseFloat(off_percentage)) || parseFloat(off_percentage) < 0 || parseFloat(off_percentage) > 100)) {
            return res.status(400).json({
                success: false,
                message: "Off percentage must be a number between 0 and 100"
            });
        }

        if (home_price_of_package && isNaN(parseFloat(home_price_of_package))) {
            return res.status(400).json({
                success: false,
                message: "Home price of package must be a number"
            });
        }

        if (home_price_of_package_discount && isNaN(parseFloat(home_price_of_package_discount))) {
            return res.status(400).json({
                success: false,
                message: "Home price of package discount must be a number"
            });
        }

        // Validate boolean fields
        const booleanFields = { is_active, is_dog, is_popular, is_cat };
        for (const [key, value] of Object.entries(booleanFields)) {
            if (value !== undefined && typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                return res.status(400).json({
                    success: false,
                    message: `${key} must be a boolean value`
                });
            }
        }

        // Check if at least one image is uploaded
        const images = req.files;

        if (!images || images.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one image is required"
            });
        }


        const imageUrls = [];
        const publicIds = [];

        try {
            const uploadResult = await uploadMultipleFiles(images);

            console.log("result", uploadResult);

            uploadResult.forEach(img => {
                imageUrls.push({
                    url: img.url,
                    public_id: img.public_id
                });
                publicIds.push(img.public_id);
            });

        } catch (uploadError) {
            // Clean up any images that were successfully uploaded
            if (publicIds.length > 0) {
                await deleteMultipleFilesCloud(publicIds);
            }

            throw new Error(`Error uploading images: ${uploadError.message}`);
        }

        const mainImage = {
            url: imageUrls[0].url,
            public_id: imageUrls[0].public_id  // <-- fix here
        };
        // Create new labtest product with validated data
        const newLabTestProduct = new LabtestProduct({
            title,
            price: parseFloat(price),
            discount_price: discount_price ? parseFloat(discount_price) : undefined,
            off_percentage: off_percentage ? parseFloat(off_percentage) : undefined,
            is_active: is_active === 'true' || is_active === true,
            tag,
            forage,
            LabTestdInclueds,
            is_dog: is_dog === 'true' || is_dog === true,
            is_popular: is_popular === 'true' || is_popular === true,
            is_cat: is_cat === 'true' || is_cat === true,
            small_desc,
            desc,
            position,
            home_price_of_package: home_price_of_package ? parseFloat(home_price_of_package) : undefined,
            home_price_of_package_discount: home_price_of_package_discount ? parseFloat(home_price_of_package_discount) : undefined,
            mainImage,
            image: imageUrls.map((img, index) => ({
                url: img.url,
                public_id: img.public_id,
                position: index + 1
            })),
            WhichTypeOfvaccinations
        });

        // Validate using Mongoose schema validation
        const validationError = newLabTestProduct.validateSync();
        if (validationError) {
            // Clean up uploaded images if validation fails
            if (publicIds.length > 0) {
                await deleteMultipleFilesCloud(publicIds);
            }

            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: validationError.message
            });
        }

        // Save the new product
        await newLabTestProduct.save();

        // Invalidate cache
        if (redis) {
            await redis.del('labtest-products:all');
        }

        return res.status(201).json({
            success: true,
            message: "LabTest product created successfully",
            data: newLabTestProduct
        });
    } catch (error) {
        console.error("Create LabTest Product Error:", error);

        // Clean up uploaded files if any error occurs
        try {
            if (req.files && req.files.length > 0) {
                await deleteMultipleFiles(req.files);
            }
        } catch (cleanupError) {
            console.error("Error during file cleanup:", cleanupError);
        }

        return res.status(500).json({
            success: false,
            message: "Error creating labtest product",
            error: error.message
        });
    }
};



// Get all labtest products with pagination
exports.getAllLabTestProducts = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;


        const skip = (page - 1) * limit;


        const totalLabTests = await LabtestProduct.countDocuments();


        const labtests = await LabtestProduct.find()
            .skip(skip)
            .limit(limit)
            .populate('WhichTypeOfvaccinations', 'title');


        const totalPages = Math.ceil(totalLabTests / limit);

        return res.status(200).json({
            success: true,
            message: "LabTest products fetched successfully",
            data: labtests,
            pagination: {
                totalItems: totalLabTests,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching labtest products",
            error: error.message,
        });
    }
};


// Get a single labtest product by ID
exports.getSingleLabTestProduct = async (req, res) => {
    try {
        const labtestProduct = await LabtestProduct.findById(req.params.id).populate('WhichTypeOfvaccinations');
        if (!labtestProduct) {
            return res.status(404).json({
                success: false,
                message: "LabTest product not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "LabTest product fetched successfully",
            data: labtestProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching labtest product",
            error: error.message
        });
    }
};

exports.updateLabTestProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            WhichTypeOfvaccinations,
            LabTestdInclueds,
            ...otherFields
        } = req.body;

        // Convert WhichTypeOfvaccinations to Array
        let whichTypeOfLabtestProductsArray = [];
        if (WhichTypeOfvaccinations) {
            if (typeof WhichTypeOfvaccinations === 'string') {
                whichTypeOfLabtestProductsArray = WhichTypeOfvaccinations.split(',').map(id => id.trim());
            } else if (Array.isArray(WhichTypeOfvaccinations)) {
                whichTypeOfLabtestProductsArray = WhichTypeOfvaccinations;
            }
        }

        // Convert LabTestdInclueds to Array
        let labtestdIncluedsArray = [];
        if (LabTestdInclueds) {
            if (typeof LabTestdInclueds === 'string') {
                labtestdIncluedsArray = LabTestdInclueds.split(',').map(item => item.trim());
            } else if (Array.isArray(LabTestdInclueds)) {
                labtestdIncluedsArray = LabTestdInclueds;
            }
        }

        let updateData = {
            ...otherFields,
            WhichTypeOfvaccinations: whichTypeOfLabtestProductsArray,
            LabTestdInclueds: labtestdIncluedsArray,
        };

        console.log(req.files)
        // If new images are uploaded
        if (req.files && req.files.length > 0) {
            const uploadResult = await uploadMultipleFiles(req.files);

            // Set the first image as mainImage
            updateData.mainImage = {
                url: uploadResult[0].url,
                public_id: uploadResult[0].public_id,
            };

            // Map all images
            updateData.image = uploadResult.map((img, index) => ({
                url: img.url,
                public_id: img.public_id,
                position: index + 1,
            }));
        }

        const updatedLabTest = await LabtestProduct.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedLabTest) {
            return res.status(404).json({
                success: false,
                message: "LabTest product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "LabTest product updated successfully",
            data: updatedLabTest,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error updating labtest product",
            error: error.message,
        });
    }
};

// Delete a labtest product by ID
exports.deleteLabTestProduct = async (req, res) => {
    try {
        const deletedProduct = await LabtestProduct.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "LabTest product not found"
            });
        }

        // Delete associated images from cloud storage if any
        if (deletedProduct.image.length > 0) {
            await deleteMultipleFilesCloud(deletedProduct.image.map(img => img.public_id));
        }

        await redis.del('labtest-products:all');  // Cache invalidation

        return res.status(200).json({
            success: true,
            message: "LabTest product deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error deleting labtest product",
            error: error.message
        });
    }
};
