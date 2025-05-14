const { deleteFile } = require("../../middleware/multer");
const CakeDesign = require("../../models/Cake Models/CakeDesign");
const { deleteFileCloud, uploadSingleFile } = require("../../utils/upload");


exports.createCakeDesign = async (req, res) => {
    let public_id;
    let file 
    try {
        const { name, is_active, position, whichFlavoredCake } = req.body;
        file = req.file;

        const existingDesign = await CakeDesign.findOne({ position });
        if (existingDesign) {
            deleteFile(file.path)
            return res.status(400).json({ message: "Position already taken" });
        }

        let uploadedImage;
        if (file) {
            uploadedImage = await uploadSingleFile(file);
            public_id = uploadedImage?.public_id
        }

        const newDesign = await CakeDesign.create({
            name,
            is_active,
            position,
            whichFlavoredCake,
            image: {
                public_id: uploadedImage?.public_id || "",
                url: uploadedImage?.url || "",
            }
        });

        const redis = req.app.get('redis');
        await redis.del('cakeDesigns');
       
        res.status(201).json({ message: "Design created", data: newDesign });
    } catch (error) {
        deleteFile(file.path)
        if (public_id) await deleteFileCloud(public_id)
        res.status(500).json({ message: "Error creating design", error: error.message });
    }
};

// GET ALL with Redis Cache
exports.getAllCakeDesigns = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const cachedData = await redis.get('cakeDesigns');
        if (cachedData) {
            return res.status(200).json({ fromCache: true, data: JSON.parse(cachedData) });
        }

        const designs = await CakeDesign.find().sort({ position: 1 }).populate('whichFlavoredCake','name');
        await redis.set('cakeDesigns', JSON.stringify(designs), 'EX', 3600); // cache for 1 hour

        res.status(200).json({ fromCache: false, data: designs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching designs", error: error.message });
    }
};

// GET SINGLE with Redis Cache
exports.getCakeDesignById = async (req, res) => {
    const redis = req.app.get('redis');
    const id = req.params.id;

    try {
        const cachedDesign = await redis.get(`cakeDesign:${id}`);
        if (cachedDesign) {
            return res.status(200).json({ fromCache: true, data: JSON.parse(cachedDesign) });
        }

        const design = await CakeDesign.findById(id);
        if (!design) return res.status(404).json({ message: "Design not found" });

        await redis.set(`cakeDesign:${id}`, JSON.stringify(design), 'EX', 3600);

        res.status(200).json({ fromCache: false, data: design });
    } catch (error) {
        res.status(500).json({ message: "Error fetching design", error: error.message });
    }
};

// UPDATE
exports.updateCakeDesign = async (req, res) => {
    try {
        const { name, is_active, position, whichFlavoredCake } = req.body;
        const file = req.file;
        console.log(file)

        const design = await CakeDesign.findById(req.params.id);
        if (!design) return res.status(404).json({ message: "Design not found" });

        if (file) {
            if (design.image?.public_id) {
                await deleteFileCloud(design.image.publicId);
            }
            const uploaded = await uploadSingleFile(file);
            design.image = {
                publicId: uploaded.public_id,
                url: uploaded.url
            };
        }

        design.name = name || design.name;
        design.is_active = is_active;
        design.position = position || design.position;
        design.whichFlavoredCake = whichFlavoredCake || design.whichFlavoredCake;
        console.log("design",design)
        await design.save();

        const redis = req.app.get('redis');
        await redis.del('cakeDesigns');
        await redis.del(`cakeDesign:${req.params.id}`);

        res.status(200).json({ message: "Design updated", data: design });
    } catch (error) {
        res.status(500).json({ message: "Error updating design", error: error.message });
    }
};

// DELETE
exports.deleteCakeDesign = async (req, res) => {
    try {
        const design = await CakeDesign.findById(req.params.id);
        if (!design) return res.status(404).json({ message: "Design not found" });

        if (design.image?.public_id) {
            await deleteFileCloud(design.image.public_id);
        }

        await CakeDesign.findByIdAndDelete(req.params.id);

        const redis = req.app.get('redis');
        await redis.del('cakeDesigns');
        await redis.del(`cakeDesign:${req.params.id}`);

        res.status(200).json({ message: "Design deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting design", error: error.message });
    }
};
