const CakeSize = require("../../models/Cake Models/CakeSizeSchema");

exports.createSizeForCake = async (req, res) => {
    try {
        const { price, weight, description, isActive, position } = req.body;
        if (!price || !weight) {
            return res.status(400).json({ success: false, message: "Price and weight are required." });
        }
        const existingSize = await CakeSize.findOne({ position });
        if (existingSize) {

            return res.status(400).json({ message: "Position already taken" });
        }

        const newSize = await CakeSize.create({ price, weight, description, isActive ,position});
        const redis = req.app.get("redis");
        await redis.del("cakeSizes");
        res.status(201).json({ success: true, data: newSize });
    } catch {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

exports.getAllCakeSizes = async (req, res) => {
    try {
        const redis = req.app.get("redis");
        const cached = await redis.get("cakeSizes");
        if (cached) {
            return res.status(200).json({ success: true, fromCache: true, data: JSON.parse(cached) });
        }

        const sizes = await CakeSize.find().sort({ position: 1 });
        await redis.set("cakeSizes", JSON.stringify(sizes), "EX", 3600);
        res.status(200).json({ success: true, data: sizes });
    } catch {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

exports.getCakeSizeById = async (req, res) => {
    try {
        const { id } = req.params;
        const redis = req.app.get("redis");
        const cached = await redis.get(`cakeSize:${id}`);
        if (cached) {
            return res.status(200).json({ success: true, fromCache: true, data: JSON.parse(cached) });
        }

        const size = await CakeSize.findById(id);
        if (!size) {
            return res.status(404).json({ success: false, message: "Cake size not found." });
        }

        await redis.set(`cakeSize:${id}`, JSON.stringify(size), "EX", 3600);
        res.status(200).json({ success: true, data: size });
    } catch {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

exports.updateCakeSize = async (req, res) => {
    const redis = req.app.get("redis");

    try {
        const { id } = req.params;
        const { price, weight, description, isActive, position } = req.body;

        // Check if the position is already taken by another cake size
        if (position) {
            const existingSize = await CakeSize.findOne({ position });
            if (existingSize && existingSize._id.toString() !== id) {
                return res.status(400).json({ success: false, message: "Position already taken" });
            }
        }


        const updated = await CakeSize.findByIdAndUpdate(
            id,
            { price, weight, description, isActive, position },
            { new: true }
        );


        if (!updated) {
            return res.status(404).json({ success: false, message: "Cake size not found" });
        }


        await redis.del("cakeSizes");
        await redis.del(`cakeSize:${id}`);


        return res.status(200).json({ success: true, data: updated });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Update failed", error: error.message });
    }
};


exports.deleteCakeSize = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CakeSize.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        const redis = req.app.get("redis");
        await redis.del("cakeSizes");
        await redis.del(`cakeSize:${id}`);
        res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch {
        res.status(500).json({ success: false, message: "Delete failed." });
    }
};
