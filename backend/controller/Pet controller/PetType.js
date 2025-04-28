const Pet = require("../../models/petAndAuth/petSchema");


exports.createPetType = async (req, res) => {
    try {
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
        const petTypes = await Pet.find();
        if (!petTypes || petTypes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pet types found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Pet types fetched successfully.',
            data: petTypes
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
        console.log( req.body)
        console.log( id)
        

        if (!petType ) {
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

        await pet.remove();

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
