const Vaccination = require("../../models/VaccinationSchema/VaccinationSchema");
const { deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");

// Create a new vaccine product
exports.createVaccineProduct = async (req, res) => {
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
            VaccinedInclueds,
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
        // Create new vaccine product with validated data
        const newVaccineProduct = new Vaccination({
            title,
            price: parseFloat(price),
            discount_price: discount_price ? parseFloat(discount_price) : undefined,
            off_percentage: off_percentage ? parseFloat(off_percentage) : undefined,
            is_active: is_active === 'true' || is_active === true,
            tag,
            forage,
            VaccinedInclueds,
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
        const validationError = newVaccineProduct.validateSync();
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
        await newVaccineProduct.save();

        // Invalidate cache
        if (redis) {
            await redis.del('vaccine-products:all');
        }

        return res.status(201).json({
            success: true,
            message: "Vaccine product created successfully",
            data: newVaccineProduct
        });
    } catch (error) {
        console.error("Create Vaccine Product Error:", error);

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
            message: "Error creating vaccine product",
            error: error.message
        });
    }
};



// Get all vaccine products with pagination
exports.getAllVaccineProducts = async (req, res) => {
    try {
        // Get page and limit from query parameters
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to limit of 10 items per page

        // Calculate the skip value
        const skip = (page - 1) * limit;

        // Fetch the total number of products to calculate total pages
        const totalVaccines = await Vaccination.countDocuments();

        // Get the actual vaccine products with pagination
        const vaccines = await Vaccination.find()
            .skip(skip)  // Skip the number of products already fetched
            .limit(limit)  // Limit to the number of products per page
            .populate('WhichTypeOfvaccinations', 'title');

        // Calculate total pages
        const totalPages = Math.ceil(totalVaccines / limit);

        return res.status(200).json({
            success: true,
            message: "Vaccine products fetched successfully",
            data: vaccines,
            pagination: {
                totalItems: totalVaccines,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching vaccine products",
            error: error.message,
        });
    }
};


// Get a single vaccine product by ID
exports.getSingleVaccineProduct = async (req, res) => {
    try {
        const vaccineProduct = await Vaccination.findById(req.params.id).populate('WhichTypeOfvaccinations');
        if (!vaccineProduct) {
            return res.status(404).json({
                success: false,
                message: "Vaccine product not found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Vaccine product fetched successfully",
            data: vaccineProduct
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error fetching vaccine product",
            error: error.message
        });
    }
};

exports.updateVaccineProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            WhichTypeOfvaccinations,
            VaccinedInclueds,
            ...otherFields
        } = req.body;

        // Convert WhichTypeOfvaccinations to Array
        let whichTypeOfVaccinationsArray = [];
        if (WhichTypeOfvaccinations) {
            if (typeof WhichTypeOfvaccinations === 'string') {
                whichTypeOfVaccinationsArray = WhichTypeOfvaccinations.split(',').map(id => id.trim());
            } else if (Array.isArray(WhichTypeOfvaccinations)) {
                whichTypeOfVaccinationsArray = WhichTypeOfvaccinations;
            }
        }

        // Convert VaccinedInclueds to Array
        let vaccinedIncluedsArray = [];
        if (VaccinedInclueds) {
            if (typeof VaccinedInclueds === 'string') {
                vaccinedIncluedsArray = VaccinedInclueds.split(',').map(item => item.trim());
            } else if (Array.isArray(VaccinedInclueds)) {
                vaccinedIncluedsArray = VaccinedInclueds;
            }
        }

        let updateData = {
            ...otherFields,
            WhichTypeOfvaccinations: whichTypeOfVaccinationsArray,
            VaccinedInclueds: vaccinedIncluedsArray,
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

        const updatedVaccine = await Vaccination.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedVaccine) {
            return res.status(404).json({
                success: false,
                message: "Vaccine product not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Vaccine product updated successfully",
            data: updatedVaccine,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error updating vaccine product",
            error: error.message,
        });
    }
};

// Delete a vaccine product by ID
exports.deleteVaccineProduct = async (req, res) => {
    try {
        const deletedProduct = await Vaccination.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Vaccine product not found"
            });
        }

        // Delete associated images from cloud storage if any
        if (deletedProduct.image.length > 0) {
            await deleteMultipleFilesCloud(deletedProduct.image.map(img => img.public_id));
        }

        await redis.del('vaccine-products:all');  // Cache invalidation

        return res.status(200).json({
            success: true,
            message: "Vaccine product deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error deleting vaccine product",
            error: error.message
        });
    }
};
