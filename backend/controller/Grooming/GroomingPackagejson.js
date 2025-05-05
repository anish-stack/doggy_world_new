const GroomingPackageJson = require("../../models/Grooming/GroomingPackageJson");

// Create a new grooming package
exports.createGroomingPackagejson = async (req, res) => {
    try {
        const { data } = req.body;
        const newPackage = new GroomingPackageJson({ data });
        await newPackage.save();
        res.status(201).json({ success: true, message: "Grooming package created", package: newPackage });
    } catch (error) {
        console.error("Error creating package:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all grooming packages
exports.getAllGroomingPackagesjson = async (req, res) => {
    try {
        const packages = await GroomingPackageJson.find();
        res.status(200).json({ success: true, packages });
    } catch (error) {
        console.error("Error fetching packages:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get a single grooming package by ID
exports.getGroomingPackageByIdjson = async (req, res) => {
    try {
        const package = await GroomingPackageJson.findById(req.params.id);
        if (!package) return res.status(404).json({ success: false, message: "Package not found" });
        res.status(200).json({ success: true, package });
    } catch (error) {
        console.error("Error fetching package:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update a grooming package
exports.updateGroomingPackagejson = async (req, res) => {
    try {
        const { data } = req.body;
        const updated = await GroomingPackageJson.findByIdAndUpdate(
            req.params.id,
            { data },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Package not found" });
        res.status(200).json({ success: true, message: "Package updated", package: updated });
    } catch (error) {
        console.error("Error updating package:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete a grooming package
exports.deleteGroomingPackagejson = async (req, res) => {
    try {
        const deleted = await GroomingPackageJson.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Package not found" });
        res.status(200).json({ success: true, message: "Package deleted" });
    } catch (error) {
        console.error("Error deleting package:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
