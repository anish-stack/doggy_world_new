const ConsultationDoctors = require("../../models/Consultations/ConsultationDoctors");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");


exports.createDoctorConsultation = async (req, res) => {
    let url = '';
    let public_id = '';

    try {
        const file = req.file;
        const { name, discount, price, status, position, availableTimeSlots, tags } = req.body;
        console.log(req.body)
        // Validate required fields
        if (!name || !price || !position) {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Please provide name, price, and position"
            });
        }

        // Check if position is already taken
        if (position) {
            const checkAvailablePosition = await ConsultationDoctors.findOne({ position });
            if (checkAvailablePosition) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }

        // Parse time slots if provided as string
        let parsedTimeSlots = [];
        if (availableTimeSlots) {
            try {
                parsedTimeSlots = typeof availableTimeSlots === 'string'
                    ? JSON.parse(availableTimeSlots)
                    : availableTimeSlots;
            } catch (error) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: "Invalid time slots format"
                });
            }
        }


        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string'
                    ? JSON.parse(tags)
                    : tags;
            } catch (error) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: "Invalid tags format"
                });
            }
        }


        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Please provide an image for the doctor"
            });
        }

        const uploadResult = await uploadSingleFile(file);
        url = uploadResult.url;
        public_id = uploadResult.public_id;

        // Create doctor consultation
        const newConsultation = await ConsultationDoctors.create({
            name,
            discount: discount || 0,
            price,
            status: status || 'active',
            position,
            tags: parsedTags,
            availableTimeSlots: parsedTimeSlots,
            image: {
                url,
                public_id
            }
        });

        // Clean up temp file
        if (file) await deleteFile(file.path);

        // Clear cache
        await clearDoctorConsultationCache(req);

        return res.status(201).json({
            success: true,
            message: "Doctor consultation created successfully",
            data: newConsultation
        });

    } catch (error) {
        console.error(error);
        if (req.file) await deleteFile(req.file.path);
        if (public_id) await deleteFileCloud(public_id);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.getAllDoctorConsultations = async (req, res) => {
    try {
        const redis = req.app.get('redis');
        const cacheKey = 'consultation-doctors:all';

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Doctor consultations retrieved from cache",
                count: JSON.parse(cachedData).length,
                data: JSON.parse(cachedData)
            });
        }

        // Query from database
        const doctorConsultations = await ConsultationDoctors.find()
            .sort({ position: 1 });

        // Set cache
        await redis.set(cacheKey, JSON.stringify(doctorConsultations), {
            EX: 3600 // Cache for 1 hour
        });

        return res.status(200).json({
            success: true,
            message: "Doctor consultations retrieved successfully",
            count: doctorConsultations.length,
            data: doctorConsultations
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


exports.getSingleDoctorConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const redis = req.app.get('redis');
        const cacheKey = `consultation-doctors:${id}`;

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Doctor consultation retrieved from cache",
                data: JSON.parse(cachedData)
            });
        }

        // Query from database
        const doctorConsultation = await ConsultationDoctors.findById(id);

        if (!doctorConsultation) {
            return res.status(404).json({
                success: false,
                message: "Doctor consultation not found"
            });
        }

        // Set cache
        await redis.set(cacheKey, JSON.stringify(doctorConsultation), {
            EX: 3600 // Cache for 1 hour
        });

        return res.status(200).json({
            success: true,
            message: "Doctor consultation retrieved successfully",
            data: doctorConsultation
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


exports.updateDoctorConsultation = async (req, res) => {
    let url = '';
    let public_id = '';

    try {
        const { id } = req.params;
        const file = req.file;
        const {
            name,
            discount,
            price,
            status,
            position,
            availableTimeSlots,
            tags,
            removeImage
        } = req.body;
        console.log(req.body)
        // Find consultation
        const doctorConsultation = await ConsultationDoctors.findById(id);

        if (!doctorConsultation) {
            if (file) await deleteFile(file.path);
            return res.status(404).json({
                success: false,
                message: "Doctor consultation not found"
            });
        }

        // Check if position is already taken by another consultation
        if (position && position !== doctorConsultation.position) {
            const checkAvailablePosition = await ConsultationDoctors.findOne({
                position,
                _id: { $ne: id }
            });

            if (checkAvailablePosition) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }

        // Parse time slots if provided as string
        let parsedTimeSlots = doctorConsultation.availableTimeSlots;
        if (availableTimeSlots) {
            try {
                parsedTimeSlots = typeof availableTimeSlots === 'string'
                    ? JSON.parse(availableTimeSlots)
                    : availableTimeSlots;
            } catch (error) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: "Invalid time slots format"
                });
            }
        }

        // Parse tags if provided as string
        let parsedTags = doctorConsultation.tags || [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string'
                    ? JSON.parse(tags)
                    : tags;
            } catch (error) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: "Invalid tags format"
                });
            }
        } else {
            parsedTags = []
        }

        // Update data object
        const updateData = {
            name: name || doctorConsultation.name,
            discount: discount !== undefined ? discount : doctorConsultation.discount,
            price: price || doctorConsultation.price,
            status: status || doctorConsultation.status,
            position: position !== undefined ? position : doctorConsultation.position,
            tags: parsedTags,
            availableTimeSlots: parsedTimeSlots
        };

        // Handle image
        if (file) {
            // Delete old image if exists
            if (doctorConsultation.image && doctorConsultation.image.public_id) {
                await deleteFileCloud(doctorConsultation.image.public_id);
            }

            // Upload new image
            const uploadResult = await uploadSingleFile(file);
            url = uploadResult.url;
            public_id = uploadResult.public_id;

            updateData.image = {
                url,
                public_id
            };

            // Clean up temp file
            await deleteFile(file.path);
        } else if (removeImage === 'true') {
            if (file) await deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Cannot remove image for doctor consultation. An image is required."
            });
        }

        // Update consultation
        const updatedDoctorConsultation = await ConsultationDoctors.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // Clear cache
        await clearDoctorConsultationCache(req);

        return res.status(200).json({
            success: true,
            message: "Doctor consultation updated successfully",
            data: updatedDoctorConsultation
        });

    } catch (error) {
        console.error(error);
        if (req.file) await deleteFile(req.file.path);
        if (public_id) await deleteFileCloud(public_id);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.deleteDoctorConsultation = async (req, res) => {
    try {
        const { id } = req.params;

        // Find consultation
        const doctorConsultation = await ConsultationDoctors.findById(id);

        if (!doctorConsultation) {
            return res.status(404).json({
                success: false,
                message: "Doctor consultation not found"
            });
        }

        // Delete image if exists
        if (doctorConsultation.image && doctorConsultation.image.public_id) {
            await deleteFileCloud(doctorConsultation.image.public_id);
        }

        // Delete consultation
        await ConsultationDoctors.findByIdAndDelete(id);

        // Clear cache
        await clearDoctorConsultationCache(req);

        return res.status(200).json({
            success: true,
            message: "Doctor consultation deleted successfully"
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

async function clearDoctorConsultationCache(req) {
    const redis = req.app.get('redis');

    const keys = await redis.keys('consultation-doctors:*');
    if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Cleared ${keys.length} doctor consultations cache keys.`);
    } else {
        console.log('No doctor consultations cache keys to clear.');
    }
}