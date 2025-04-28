const TypeOfVaccinatin = require("../../models/VaccinationSchema/TypeOfVaccinatinCollection");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");


exports.createTypeOfVaccine = async (req, res) => {
    let public_id = ''; // <-- declare outside try-catch
    try {
        const redis = req.app.get('redis');
        const file = req.file;
        const { title, description, is_active = true, position } = req.body
        console.log('req.body;',req.body)

        if (!title || !position) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Title and Position are required."
            });
        }
        if(!description){
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "description  are required."
            });
        }

        const positionTaken = await TypeOfVaccinatin.findOne({ position });
        if (positionTaken) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: `Position ${position} already exists.`
            });
        }

        let imageUrl = '';
        if (file) {
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            public_id = uploadResult.public_id;
        }

        const newType = await TypeOfVaccinatin.create({
            title,
            description,
            is_active,
            position,
            image: { url: imageUrl, public_id }
        });

        if (file) await deleteFile(file.path);
        await redis.del('type-of-vaccine:all');

        return res.status(201).json({
            success: true,
            message: "Type of Vaccine created successfully",
            data: newType
        });
    } catch (error) {
        console.error(error);
        if (req.file?.path) await deleteFile(req.file.path);
        if (public_id) await deleteFileCloud(public_id);
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Get All with Search & Pagination
exports.getAllTypeOfVaccines = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { search = '', page = 1, limit = 10 } = req.query;
        console.log(req.query)

        const cached = await redis.get('type-of-vaccine:all');
        if (cached) {
            return res.status(200).json({
                success: true,
                message: "Fetched from Redis Cache",
                data: JSON.parse(cached)
            });
        }

        const query = {
            title: { $regex: search, $options: 'i' }
        };

        const total = await TypeOfVaccinatin.countDocuments(query);
        const types = await TypeOfVaccinatin.find(query)
            .sort({ position: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        await redis.set('type-of-vaccine:all', JSON.stringify(types));

        return res.status(200).json({
            success: true,
            message: "Fetched from Database",
            data: types,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single
exports.getSingleTypeOfVaccine = async (req, res) => {
    try {
        const { id } = req.params;
        const type = await TypeOfVaccinatin.findById(id);

        if (!type) {
            return res.status(404).json({ success: false, message: "Type not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Type fetched successfully",
            data: type
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update
exports.updateTypeOfVaccine = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { id } = req.params;
        const file = req.file;
        const { title, description, is_active, position } = req.body;

        const type = await TypeOfVaccinatin.findById(id);
        if (!type) {
            if (file) await deleteFile(file.path);
            return res.status(404).json({ success: false, message: "Type not found" });
        }

        if (Number(position) && Number(position) !== type.position) {
            let pos = Number(position)
            const positionTaken = await TypeOfVaccinatin.findOne({ position:pos });
            if (positionTaken) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken.`
                });
            }
        }

        if (file) {
            if (type.image?.public_id) {
                await deleteFileCloud(type.image.public_id);
            }
            const uploadResult = await uploadSingleFile(file);
            type.image.url = uploadResult.url;
            type.image.public_id = uploadResult.public_id;
            await deleteFile(file.path);
        }

        type.title = title || type.title;
        type.description = description || type.description;
        type.is_active = is_active !== undefined ? is_active : type.is_active;
        type.position = position || type.position;

        await type.save();
        await redis.del('type-of-vaccine:all');

        return res.status(200).json({
            success: true,
            message: "Type updated successfully",
            data: type
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete
exports.deleteTypeOfVaccine = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const { id } = req.params;

        const type = await TypeOfVaccinatin.findById(id);
        if (!type) {
            return res.status(404).json({ success: false, message: "Type not found" });
        }

        if (type.image?.public_id) {
            await deleteFileCloud(type.image.public_id);
        }

        await TypeOfVaccinatin.findByIdAndDelete(id);
        await redis.del('type-of-vaccine:all');

        return res.status(200).json({
            success: true,
            message: "Type deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
