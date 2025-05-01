const DisplayDoctors = require("../../models/Doctors/DisplayDoctors");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");



exports.createDoctors = async (req, res) => {
    let imageUrl = '';
    let publicId = '';
    try {
        const { name, specialization, experience, description, is_best, position } = req.body
        const file = req.file;

        const checkAvailablePosition = await DisplayDoctors.findOne({ position });
        if (checkAvailablePosition) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: `Position ${position} is already taken. Please choose a different position.`,
            });
        }

        if (file) {
            const uploadResult = await uploadSingleFile(file);
            imageUrl = uploadResult.url;
            publicId = uploadResult.public_id;
        }


        const newDoctor = await DisplayDoctors.create({
            name, specialization, experience, description, is_best, position,
            imageUrl: {
                url: imageUrl,
                public_id: publicId
            }
        });

        if (file) await deleteFile(file.path);
        const redis = req.app.get('redis');

        const keys = await redis.keys('DisplayDoctors:*');
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} Display Doctors cache keys.`);
        } else {
            console.log('No Display Doctors cache keys to clear.');
        }

        return res.status(201).json({
            success: true,
            message: " Display Doctors created successfully",
            data: newDoctor
        });

    } catch (error) {
        console.error(error);
        if (req.file) await deleteFileCloud(publicId);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}


exports.editDoctor = async (req, res) => {
    let publicIdToDelete = '';
    try {
        const { id } = req.params;
        const { name, specialization, experience, description, is_best, position } = req.body;
        const file = req.file;

        const doctor = await DisplayDoctors.findById(id);
        if (!doctor) {
            if (file) await deleteFile(file.path);
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        let numPos = Number(position)

        if (numPos && numPos !== doctor.position) {
            const exists = await DisplayDoctors.findOne({ numPos });
            if (exists) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({ success: false, message: `Position ${position} is already taken.` });
            }
        }

        if (file) {
            const uploadResult = await uploadSingleFile(file);
            publicIdToDelete = doctor.image?.publicId;
            doctor.imageUrl = {
                url: uploadResult.url,
                public_id: uploadResult.public_id
            };
            await deleteFile(file.path);
        }

        doctor.name = name || doctor.name;
        doctor.specialization = specialization || doctor.specialization;
        doctor.experience = experience || doctor.experience;
        doctor.description = description || doctor.description;
        doctor.is_best = is_best !== undefined ? is_best : doctor.is_best;
        doctor.position = position || doctor.position;

        await doctor.save();

        if (publicIdToDelete) await deleteFileCloud(publicIdToDelete);

        const redis = req.app.get('redis');
        const keys = await redis.keys('DisplayDoctors:*');
        if (keys.length > 0) await redis.del(keys);

        res.json({ success: true, message: "Doctor updated successfully", data: doctor });

    } catch (error) {
        console.error(error);
        if (req.file && publicIdToDelete) await deleteFileCloud(publicIdToDelete);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};


exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await DisplayDoctors.findByIdAndDelete(id);

        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        if (doctor.image?.publicId) {
            await deleteFileCloud(doctor.image.publicId);
        }

        const redis = req.app.get('redis');
        const keys = await redis.keys('DisplayDoctors:*');
        if (keys.length > 0) await redis.del(keys);

        res.json({ success: true, message: "Doctor deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};


exports.getAllDoctors = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const cacheKey = 'DisplayDoctors:All';

        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.json({ success: true, fromCache: true, data: JSON.parse(cachedData) });
        }

        const doctors = await DisplayDoctors.find().sort({ position: 1 });
        await redis.set(cacheKey, JSON.stringify(doctors), 'EX', 3600); // cache for 1 hour

        res.json({ success: true, data: doctors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};


exports.getSingleDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await DisplayDoctors.findById(id);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        res.json({ success: true, data: doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
