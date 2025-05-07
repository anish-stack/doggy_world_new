const Pet = require("../../models/petAndAuth/petSchema");


exports.createPetType = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { petType, status } = req.body;

        if (!petType) {
            return res.status(400).json({
                success: false,
                message: 'Pet type is required. Please provide a pet type.'
            });
        }

        const existPet = await Pet.findOne({ petType });
        if (existPet) {
            return res.status(400).json({
                success: false,
                message: `The pet type "${petType}" already exists. Please choose a different name.`
            });
        }

        const newPet = new Pet({ petType, status });
        await newPet.save();
        const keys = await redis.keys('petTypes:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Home Banner cache keys.`);
        } else {
            console.log('No Home Banner cache keys to clear.');
        }

        return res.status(201).json({
            success: true,
            message: `Successfully created the pet type "${petType}".`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error creating pet type: ${error.message}. Please try again later.`
        });
    }
};

// Get all Pet Types
exports.getAllPetTypes = async (req, res) => {
    try {
        const { search = '' } = req.query;
        const redis = req.app.get('redis');

        const cacheKey = `petTypes:all:${search}`;
        const cachedData = await redis.get(cacheKey);

        // Return from cache if available
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Pet types retrieved from cache",
                data: JSON.parse(cachedData),
                fromCache: true
            });
        }

        // Fetch from DB if cache not found
        const petTypes = await Pet.find({
            petType: { $regex: search, $options: 'i' }
        });

        if (!petTypes || petTypes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pet types found.'
            });
        }

        // Set cache for future requests
        await redis.set(cacheKey, JSON.stringify(petTypes), 'EX', 3600); // Expires in 1 hour

        return res.status(200).json({
            success: true,
            message: 'Pet types fetched successfully.',
            data: petTypes,
            fromCache: false
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error fetching pet types: ${error.message}. Please try again later.`
        });
    }
};


// Update Pet Type
exports.updatePetType = async (req, res) => {
    try {
        const { id } = req.params;
        const { petType, status } = req.body;
        console.log(req.body)
        console.log(id)


        if (!petType) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both pet type and status to update.'
            });
        }

        const pet = await Pet.findById(id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet type not found.'
            });
        }

        pet.petType = petType;
        pet.status = status;

        await pet.save();
        const redis = req.app.get('redis');
        const keys = await redis.keys('petTypes:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Home Banner cache keys.`);
        } else {
            console.log('No Home Banner cache keys to clear.');
        }

        return res.status(200).json({
            success: true,
            message: `Successfully updated the pet type to "${petType}".`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error updating pet type: ${error.message}. Please try again later.`
        });
    }
};

// Delete Pet Type
exports.deletePetType = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await Pet.findById(id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet type not found.'
            });
        }

        await pet.deleteOne();
        const redis = req.app.get('redis');
        const keys = await redis.keys('petTypes:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Home Banner cache keys.`);
        } else {
            console.log('No Home Banner cache keys to clear.');
        }

        return res.status(200).json({
            success: true,
            message: `Successfully deleted the pet type "${pet.petType}".`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error deleting pet type: ${error.message}. Please try again later.`
        });
    }
};
