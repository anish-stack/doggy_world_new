const Address = require("../../models/AddressModel/AddressModel");

// Create Address
exports.createAddress = async (req, res) => {
    try {
        const petId = req.user.id;
        const { street, city, state, zipCode } = req.body;

        // Basic validation
        if (!street || !city || !state || !zipCode) {
            return res.status(400).json({
                success: false,
                message: 'All address fields (street, city, state, zipCode) are required.'
            });
        }

        const address = new Address({
            street,
            city,
            state,
            zipCode,
            petId,
        });

        await address.save();

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Addresses
exports.getAllAddressesByPetId = async (req, res) => {
    try {
        const petid = req.user.id || '';
        console.log("Fetching addresses for Pet ID:", petid);

        const addresses = await Address.find({ petId: petid });

        console.log("Addresses found:", addresses);

        res.status(200).json({ success: true, data: addresses });
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ success: false, message: "Failed to fetch addresses", error: error.message });
    }
};


// Get Single Address by ID
exports.getAddressById = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id).populate('petId');
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, data: address });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Address
exports.updateAddress = async (req, res) => {
    try {
        const address = await Address.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, data: address });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findByIdAndDelete(req.params.id);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
