const { deleteFile } = require("../../middleware/multer");
const CakeFlavours = require("../../models/Cake Models/CakeFlavours");
const { deleteFileCloud, uploadSingleFile } = require("../../utils/upload");

// CREATE
exports.createCakeFlavour = async (req, res) => {
    const redis = req.app.get('redis');
    let public_id;
    try {
        const { name, isActive } = req.body;
        const file = req.file;

        if (!name) {
            return res.status(402).json({
                success: false,
                message: 'Please provide a flavor name'
            });
        }

        const checkExist = await CakeFlavours.findOne({ name });
        if (checkExist) {
            if (file) deleteFile(file?.path);
            return res.status(403).json({
                success: false,
                message: 'Flavor already exists, please change the name'
            });
        }

        let imageUrl;
        if (file) {
            const url = await uploadSingleFile(file);
            console.log('url',url)
            imageUrl = url.url;
            public_id = url.public_id;
        }

        const newFlavor = await CakeFlavours.create({
            name,
            image: {
                url: imageUrl,
                publicId: public_id
            },
            isActive
        });

        if (redis) {
            await redis.del('cakeFlavours'); 
        }

        return res.status(201).json({
            success: true,
            message: 'Flavor created successfully',
            data: newFlavor
        });
    } catch (error) {
        console.error(error);
        if(public_id) await deleteFileCloud(public_id)
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// GET ALL 
 exports.getAllCakeFlavours = async (req, res) => {
    const redis = req.app.get('redis');
    try {
      
        const cacheData = await redis.get('cakeFlavours');
        if (cacheData) {
            return res.status(200).json({
                success: true,
                fromCache: true,
                data: JSON.parse(cacheData)
            });
        }

       
        const flavors = await CakeFlavours.find();

        // Save data to Redis cache for next time
        await redis.set('cakeFlavours', JSON.stringify(flavors), 'EX', 3600); // cache for 1 hour

        return res.status(200).json({
            success: true,
            fromCache: false,
            data: flavors
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


// GET SINGLE
exports.getSingleCakeFlavour = async (req, res) => {
    try {
        const { id } = req.params;
        const flavor = await CakeFlavours.findById(id);
        if (!flavor) {
            return res.status(404).json({
                success: false,
                message: 'Flavor not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: flavor
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// UPDATE
exports.updateCakeFlavour = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const file = req.file;

        const flavor = await CakeFlavours.findById(id);
        if (!flavor) {
            if (file) deleteFile(file?.path);
            return res.status(404).json({
                success: false,
                message: 'Flavor not found'
            });
        }

        if (file) {
            // Delete old image from cloud
            if (flavor.image.publicId) {
                await deleteFileCloud(flavor.image.publicId);
            }
            const uploaded = await uploadSingleFile(file);
            flavor.image.url = uploaded.url;
            flavor.image.publicId = uploaded.public_id;
        }

        if (name) flavor.name = name;
        if (typeof isActive !== 'undefined') flavor.isActive = isActive;

        await flavor.save();

        if (redis) {
            await redis.del('cakeFlavours');
        }

        return res.status(200).json({
            success: true,
            message: 'Flavor updated successfully',
            data: flavor
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// DELETE
exports.deleteCakeFlavour = async (req, res) => {
    const redis = req.app.get('redis');
    try {
        const { id } = req.params;
        const flavor = await CakeFlavours.findById(id);
        if (!flavor) {
            return res.status(404).json({
                success: false,
                message: 'Flavor not found'
            });
        }

        if (flavor.image.publicId) {
            await deleteFileCloud(flavor.image.publicId);
        }

        await CakeFlavours.findByIdAndDelete(id);

        if (redis) {
            await redis.del('cakeFlavours');
        }

        return res.status(200).json({
            success: true,
            message: 'Flavor deleted successfully'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
