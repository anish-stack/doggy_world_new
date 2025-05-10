const { deleteMultipleFiles } = require("../../middleware/multer");
const petShopProduct = require("../../models/PetShops/petShopProduct");
const PetShopSubCategoriesSchema = require("../../models/PetShops/PetShopSubCategories");

const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");

exports.createPetShopProduct = async (req, res) => {
    let publicIds = [];
    let Images = [];
    const redis = req.app.get('redis');

    console.log("Starting createPetShopProduct...");

    try {
        const {
            name,
            description,
            price,
            category,
            isCod,
            isReturn,
            freshStock,
            flavour,
            tag,
            isProductAvailable,
            freeDelivery,
            variants,
            discountPrice,
            offPercentage
        } = req.body;

        console.log("Received data:", req.body);

        if (!name || !category) {
            if (req.files) deleteMultipleFiles(req.files);
            console.log("Missing name or category");
            return res.status(400).json({
                success: false,
                message: 'Product name and category are required fields'
            });
        }

        if (price && (isNaN(price) || price < 0)) {
            if (req.files) deleteMultipleFiles(req.files);
            console.log("Invalid price");
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number'
            });
        }

        const checkSubcategory = await PetShopSubCategoriesSchema.findById(category);
        console.log("Category lookup result:", checkSubcategory);

        if (!checkSubcategory) {
            if (req.files) deleteMultipleFiles(req.files);
            console.log("Category not found");
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (!checkSubcategory.active) {
            if (req.files) deleteMultipleFiles(req.files);
            console.log("Category is inactive");
            return res.status(403).json({
                success: false,
                message: 'Category is disabled. You cannot create a product in this category. Please enable the category first.'
            });
        }

        const files = req.files || [];
        console.log("Files received:", files.length);

        if (files.length === 0) {
            console.log("No images uploaded");
            return res.status(400).json({
                success: false,
                message: 'At least one product image is required'
            });
        }

        try {
            console.log("Uploading images...");
            const uploadResult = await uploadMultipleFiles(files);
            console.log("Upload result:", uploadResult);

            uploadResult.forEach(img => {
                Images.push({
                    url: img.url,
                    public_id: img.public_id,
                    position: Images.length + 1
                });
                publicIds.push(img.public_id);
            });
        } catch (uploadError) {
            if (req.files) deleteMultipleFiles(req.files);
            console.log("Upload error:", uploadError);
            if (publicIds.length > 0) {
                await deleteMultipleFilesCloud(publicIds);
            }
            return res.status(500).json({
                success: false,
                message: `Error uploading images: ${uploadError.message}`
            });
        }

        if (Images.length === 0) {
            if (req.files) deleteMultipleFiles(req.files);
            console.log("Image upload failed");
            return res.status(400).json({
                success: false,
                message: 'Image upload failed. Please try again.'
            });
        }

        const mainImage = {
            url: Images[0].url,
            public_id: Images[0].public_id
        };

        let processedVariants = [];
        if (variants && typeof variants === 'string') {
            try {
                processedVariants = JSON.parse(variants);
                console.log("Parsed variants:", processedVariants);

                for (const variant of processedVariants) {
                    if (!variant.size || !variant.price || variant.price < 0) {
                        if (req.files) deleteMultipleFiles(req.files);
                        console.log("Invalid variant detected:", variant);
                        return res.status(400).json({
                            success: false,
                            message: 'Each variant must have a valid size and price'
                        });
                    }
                }
            } catch (error) {
                if (req.files) deleteMultipleFiles(req.files);
                console.log("Variant parsing error:", error);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid variants format. Expected JSON array.'
                });
            }
        }

        let calculatedOffPercentage = offPercentage;
        if (price && discountPrice && !offPercentage) {
            calculatedOffPercentage = Math.round(((price - discountPrice) / price) * 100);
        }

        const newProduct = new petShopProduct({
            name,
            description,
            price: price || 0,
            discountPrice: discountPrice || 0,
            offPercentage: calculatedOffPercentage || 0,
            category,
            mainImage,
            imageUrl: Images,
            isCod: isCod === 'true' || isCod === true,
            isReturn: isReturn === 'true' || isReturn === true,
            freshStock: freshStock === 'true' || freshStock === true,
            flavour,
            tag,
            freeDelivery: freeDelivery === 'true' || freeDelivery === true,
            isProductAvailable: isProductAvailable === 'true' || isProductAvailable === true,
            variants: processedVariants,
        });

        console.log("Saving product to DB...");
        const savedProduct = await newProduct.save();
        console.log("Product saved successfully");

        if (redis) {
            try {
                await redis.del('pet-shop-products');

                console.log("Redis cache cleared");
            } catch (redisError) {
                console.error("Redis error:", redisError);
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Pet bakery product created successfully',
            product: savedProduct
        });

    } catch (error) {
        if (req.files) deleteMultipleFiles(req.files);

        if (publicIds.length > 0) {
            try {
                await deleteMultipleFilesCloud(publicIds);
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded images:', cleanupError);
            }
        }

        console.error('Unhandled error in createBakeryProduct:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to create pet bakery product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


exports.getAllPetProducts = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        let products;

        // Try to get from Redis cache first
        if (redis) {
            const cachedProducts = await redis.get('pet-shop-products');
            if (cachedProducts) {
                return res.status(200).json({
                    success: true,
                    count: JSON.parse(cachedProducts).length,
                    products: JSON.parse(cachedProducts),
                    source: 'cache'
                });
            }
        }

        // Fetch from database if not in cache
        products = await petShopProduct.find()
            .populate('category', 'name tag')
            .sort({ createdAt: -1 });

        // Store in Redis cache
        if (redis) {
            await redis.set('pet-shop-products', JSON.stringify(products), 'EX', 3600); // 1 hour expiry
        }

        return res.status(200).json({
            success: true,
            count: products.length,
            products,
            source: 'database'
        });

    } catch (error) {
        console.error('Error fetching pet hop products:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pet shop products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};




exports.getPetShopProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await petShopProduct.findById(id)
            .populate('category', 'title tag');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Pet bakery product not found'
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Error fetching pet bakery product:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pet bakery product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.getPetShopProductByCategoryId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        const products = await petShopProduct.find({ category: id })
            .populate('category', 'name tag');

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pet shop products found for this category'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pet shop products fetched successfully',
            data: products
        });

    } catch (error) {
        console.error('Error fetching pet shop products:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pet shop products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};



exports.updatePetShopProduct = async (req, res) => {
    let publicIds = [];
    let newImages = [];
    const redis = req.app.get('redis');

    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            category,
            isCod,
            isReturn,
            freshStock,
            flavour,
            tag,
            isProductAvailable,
            freeDelivery,
            variants,
            discountPrice,
            offPercentage,
            removeImages
        } = req.body;

        // Find the product
        const product = await petShopProduct.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Pet bakery product not found'
            });
        }

        // Check category if changed
        if (category && category !== product.category.toString()) {
            const checkcategory = await PetShopSubCategoriesSchema.findById(category);
            if (!checkcategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            if (!checkcategory.active) {
                return res.status(403).json({
                    success: false,
                    message: 'Target category is disabled. You cannot move the product to this category.'
                });
            }
        }

        // Handle image removals if specified
        if (removeImages && removeImages.length > 0) {
            // Check if removeImages is a string and parse it, if needed
            const imagesToRemove = Array.isArray(removeImages) ? removeImages : JSON.parse(removeImages);

            // Map the images to their public_id based on the _id
            const publicIdsToRemove = imagesToRemove.map(img => img.public_id).filter(id => id !== null);

            // Proceed only if there are images to remove
            if (publicIdsToRemove.length > 0) {
                // Delete images from cloud storage
                // await deleteMultipleFilesCloud(publicIdsToRemove);

                // Filter out the removed images from the product's imageUrl array
                product.imageUrl = product.imageUrl.filter(img =>
                    !publicIdsToRemove.includes(img.public_id)
                );

                // Check if main image was removed
                const mainImageRemoved = !product.imageUrl.some(
                    img => img.public_id === product.mainImage.public_id
                );

                // Set new main image if needed
                if (mainImageRemoved && product.imageUrl.length > 0) {
                    // Assign the first image as the new main image
                    product.mainImage = {
                        url: product.imageUrl[0].url,
                        public_id: product.imageUrl[0].public_id
                    };
                } else if (mainImageRemoved) {
                    // If no images remain, set mainImage to null (or handle as per business logic)
                    product.mainImage = null;
                }
            }
        }


        // Handle new image uploads
        const files = req.files || [];

        if (files.length > 0) {
            try {
                const uploadResult = await uploadMultipleFiles(files);

                uploadResult.forEach(img => {
                    newImages.push({
                        url: img.url,
                        public_id: img.public_id,
                        position: product.imageUrl.length + newImages.length + 1
                    });
                    publicIds.push(img.public_id);
                });

                // Add new images to existing ones
                product.imageUrl = [...product.imageUrl, ...newImages];

                // Set main image if there wasn't one
                if (!product.mainImage.url && product.imageUrl.length > 0) {
                    product.mainImage = {
                        url: product.imageUrl[0].url,
                        public_id: product.imageUrl[0].public_id
                    };
                }

            } catch (uploadError) {
                // Clean up any new images that were successfully uploaded
                if (publicIds.length > 0) {
                    await deleteMultipleFilesCloud(publicIds);
                }

                return res.status(500).json({
                    success: false,
                    message: `Error uploading new images: ${uploadError.message}`
                });
            }
        }

        // Process variants if provided
        let processedVariants = product.variants;
        if (variants) {
            try {
                const parsedVariants = typeof variants === 'string'
                    ? JSON.parse(variants)
                    : variants;

                // Validate variants
                for (const variant of parsedVariants) {
                    if (!variant.size || !variant.price || variant.price < 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Each variant must have a valid size and price'
                        });
                    }
                }

                processedVariants = parsedVariants;

            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid variants format. Expected JSON array.'
                });
            }
        }

        // Calculate discount percentage if price and discount price are provided but not percentage
        let calculatedOffPercentage = offPercentage;
        const productPrice = price !== undefined ? price : product.price;
        const productDiscountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;

        if (productPrice && productDiscountPrice && (offPercentage === undefined)) {
            calculatedOffPercentage = Math.round(((productPrice - productDiscountPrice) / productPrice) * 100);
        }

        // Update product fields
        product.name = name || product.name;
        product.description = description !== undefined ? description : product.description;
        product.price = price !== undefined ? price : product.price;
        product.discountPrice = productDiscountPrice;
        product.offPercentage = calculatedOffPercentage !== undefined ? calculatedOffPercentage : product.offPercentage;
        product.category = category || product.category;
        product.isCod = isCod !== undefined ? (isCod === 'true' || isCod === true) : product.isCod;
        product.isReturn = isReturn !== undefined ? (isReturn === 'true' || isReturn === true) : product.isReturn;
        product.freshStock = freshStock !== undefined ? (freshStock === 'true' || freshStock === true) : product.freshStock;
        product.flavour = flavour !== undefined ? flavour : product.flavour;
        product.tag = tag !== undefined ? tag : product.tag;
        product.freeDelivery = freeDelivery !== undefined ? (freeDelivery === 'true' || freeDelivery === true) : product.freeDelivery;
        product.isProductAvailable = isProductAvailable !== undefined ? (isProductAvailable === 'true' || isProductAvailable === true) : product.isProductAvailable;
        product.variants = processedVariants;

        // Save updated product
        const updatedProduct = await product.save();

        // Update Redis cache if available
        if (redis) {
            try {
                await redis.del('pet-shop-products');
                await redis.del(`pet-shop-category:${updatedProduct.category}`);
            } catch (redisError) {
                console.error('Redis cache update error:', redisError);
                // Continue anyway - Redis error shouldn't stop the response
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Pet Shop product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        // Clean up any new uploaded images if there was an error
        if (publicIds.length > 0) {
            try {
                await deleteMultipleFilesCloud(publicIds);
            } catch (cleanupError) {
                console.error('Error cleaning up uploaded images:', cleanupError);
            }
        }

        console.error('Error updating pet Shop product:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update pet Shop product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


exports.deletePetShopProduct = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { id } = req.params;

        // Find the product
        const product = await petShopProduct.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Pet bakery product not found'
            });
        }

        // Get all image public IDs for deletion
        const publicIds = [
            ...product.imageUrl.map(img => img.public_id),
            product.mainImage.public_id
        ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

        // Delete images from cloud storage
        if (publicIds.length > 0) {
            try {
                await deleteMultipleFilesCloud(publicIds);
            } catch (deleteError) {
                console.error('Error deleting product images:', deleteError);
                // Continue with product deletion even if image deletion fails
            }
        }

        // Delete the product
        const categoryId = product.category;
        await petShopProduct.findByIdAndDelete(id);

        // Update Redis cache if available
        if (redis) {
            try {
                await redis.del('pet-shop-products');
                await redis.del(`pet-shop-category:${categoryId}`);
            } catch (redisError) {
                console.error('Redis cache update error:', redisError);
                // Continue anyway - Redis error shouldn't stop the response
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Pet Shop product deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting pet Shop product:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete pet shop product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};