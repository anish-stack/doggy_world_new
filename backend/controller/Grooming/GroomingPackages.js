const GroomingPackage = require("../../models/Grooming/GroomingPackage");
const GroomingService = require("../../models/Grooming/GroomingService");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");

// Create a new grooming package
exports.CreateGroomingPackage = async (req, res) => {

    
    try {
        const {
            groomingService:groomingServiceId,  
            title,
            priceStart,
            priceEnd,
            includes = [],
            discount,
            isActive,
        } = req.body;

        // Check if the referenced grooming service exists
        const checkAvailableGroomingService = await GroomingService.findById(groomingServiceId);
        if (!checkAvailableGroomingService) { // Logic was inverted in original code
         
            return res.status(400).json({
                success: false,
                message: `Grooming Service with ID ${groomingServiceId} is not available`,
            });
        }
        
      

        const newServicePackage = await GroomingPackage.create({
            groomingService: groomingServiceId, 
            title,
            priceStart,
            priceEnd,
            includes: typeof includes === 'string' ? JSON.parse(includes) : includes,
            discount,
            isActive,
           
        });

        // Clear cache
        const redis = req.app.get("redis");
        const keys = await redis.keys("GroomingServicesPackage:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Grooming Services package cache keys.`);
        } else {
            console.log("No Grooming Services package cache keys to clear.");
        }
        
        return res.status(201).json({
            success: true,
            message: "Grooming Services package created successfully",
            data: newServicePackage,
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

// Get all grooming packages
exports.GetAllGroomingPackages = async (req, res) => {
    try {
        const redis = req.app.get("redis");
        const cacheKey = "GroomingServicesPackage:all";
        
        // Try to get data from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log('Returning grooming packages from cache');
            return res.status(200).json({
                success: true,
                message: "Grooming packages retrieved successfully",
                data: JSON.parse(cachedData)
            });
        }
        
        // If not in cache, fetch from database with populated service details
        const packages = await GroomingPackage.find()
            .populate('groomingService', 'type description')
            .sort({ createdAt: -1 });
        
        // Store in cache for future requests
        await redis.set(cacheKey, JSON.stringify(packages), { EX: 3600 }); // Cache for 1 hour
        
        return res.status(200).json({
            success: true,
            message: "Grooming packages retrieved successfully",
            data: packages
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

// Get a single grooming package by ID
exports.GetSingleGroomingPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const redis = req.app.get("redis");
        const cacheKey = `GroomingServicesPackage:${id}`;
        
        // Try to get data from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log(`Returning grooming package ${id} from cache`);
            return res.status(200).json({
                success: true,
                message: "Grooming package retrieved successfully",
                data: JSON.parse(cachedData)
            });
        }
        
        // If not in cache, fetch from database with populated service details
        const packageData = await GroomingPackage.findById(id)
            .populate('groomingService', 'type description imageUrl');
        
        if (!packageData) {
            return res.status(404).json({
                success: false,
                message: "Grooming package not found"
            });
        }
        
        // Store in cache for future requests
        await redis.set(cacheKey, JSON.stringify(packageData), { EX: 3600 }); // Cache for 1 hour
        
        return res.status(200).json({
            success: true,
            message: "Grooming package retrieved successfully",
            data: packageData
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

// Update a grooming package
exports.UpdateGroomingPackage = async (req, res) => {
  
    
    try {
        const { id } = req.params;
        const {
            groomingService:groomingServiceId,
            title,
            priceStart,
            priceEnd,
            includes,
            discount,
            isActive,
        } = req.body;
        console.log(req.body)

        // Find the package to update
        const existingPackage = await GroomingPackage.findById(id);
        if (!existingPackage) {
          
            return res.status(404).json({
                success: false,
                message: "Grooming package not found"
            });
        }
        
        // Check if the new grooming service exists (if provided)
        if (groomingServiceId) {
            const checkAvailableGroomingService = await GroomingService.findById(groomingServiceId);
            if (!checkAvailableGroomingService) {
              
                return res.status(400).json({
                    success: false,
                    message: `Grooming Service with ID ${groomingServiceId} is not available`,
                });
            }
        }
        
    
        
     
        let processedIncludes = existingPackage.includes;
        if (includes) {
            processedIncludes = typeof includes === 'string' ? JSON.parse(includes) : includes;
        }
        
        // Update the package with new data
        const updatedPackage = await GroomingPackage.findByIdAndUpdate(
            id,
            {
                groomingService: groomingServiceId || existingPackage.groomingService,
                title: title || existingPackage.title,
                priceStart: priceStart !== undefined ? priceStart : existingPackage.priceStart,
                priceEnd: priceEnd !== undefined ? priceEnd : existingPackage.priceEnd,
                includes: processedIncludes,
                discount: discount !== undefined ? discount : existingPackage.discount,
                isActive: isActive !== undefined ? isActive : existingPackage.isActive,
              
            },
            { new: true }
        );
        
       
        const redis = req.app.get("redis");
        const keys = await redis.keys("GroomingServicesPackage:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Grooming Services package cache keys.`);
        }
        
        return res.status(200).json({
            success: true,
            message: "Grooming package updated successfully",
            data: updatedPackage
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

// Delete a grooming package
exports.DeleteGroomingPackage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the package to delete
        const packageToDelete = await GroomingPackage.findById(id);
        if (!packageToDelete) {
            return res.status(404).json({
                success: false,
                message: "Grooming package not found"
            });
        }
        
      
        await GroomingPackage.findByIdAndDelete(id);
        
      
        const redis = req.app.get("redis");
        const keys = await redis.keys("GroomingServicesPackage:*");
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Grooming Services package cache keys.`);
        }
        
        return res.status(200).json({
            success: true,
            message: "Grooming package deleted successfully"
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