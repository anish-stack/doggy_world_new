const Consultation = require("../../models/Consultations/Consulations");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");
const BookingConsultations = require("../../models/Consultations/BookingConsultations");
const { deleteMultipleFiles } = require("../../middleware/multer");

const {
    uploadMultipleFiles,
    deleteMultipleFilesCloud,
} = require("../../utils/upload");
const DeletePresription = require("../../queues/DeletePresription");
const { delay } = require("lodash");
const PrescriptionMessageReport = require("../../utils/whatsapp/sendPrescriptionUploadmessage");

exports.createConsultation = async (req, res) => {
    let url = "";
    let public_id = "";

    try {
        const {
            name,
            price,
            active = true,
            isAnyOffer = false,
            offer_valid_upto_text,
            offer_valid_upto_date,
            description,
            discount,
            discount_price,
            position,
        } = req.body;

        const file = req.file;

        // Check if position is already taken
        if (position) {
            const checkAvailablePosition = await Consultation.findOne({ position });
            if (checkAvailablePosition) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }

        // Upload file if provided
        if (file) {
            const uploadResult = await uploadSingleFile(file);
            url = uploadResult.url;
            public_id = uploadResult.public_id;
        }

        // Create new consultation
        const newConsultation = await Consultation.create({
            name,
            price,
            active,
            isAnyOffer,
            offer_valid_upto_text,
            offer_valid_upto_date,
            description,
            discount,
            discount_price,
            position,
            imageUrl: {
                url,
                public_id,
            },
        });

        // Clean up temp file
        if (file) await deleteFile(file.path);

        // Clear cache
        await clearConsultationCache(req);

        return res.status(201).json({
            success: true,
            message: "Consultation created successfully",
            data: newConsultation,
        });
    } catch (error) {
        console.error(error);
        if (req.file && public_id) await deleteFileCloud(public_id);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.getAllConsultations = async (req, res) => {
    try {
        const redis = req.app.get("redis");
        const cacheKey = "consultations:all";

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Consultations retrieved from cache",
                count: JSON.parse(cachedData).length,
                data: JSON.parse(cachedData),
            });
        }

        // Query from database
        const consultations = await Consultation.find().sort({ position: 1 });

        // Set cache
        await redis.set(cacheKey, JSON.stringify(consultations), {
            EX: 3600, // Cache for 1 hour
        });

        return res.status(200).json({
            success: true,
            message: "Consultations retrieved successfully",
            count: consultations.length,
            data: consultations,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.getSingleConsultation = async (req, res) => {
    try {
        const { id } = req.params;
        const redis = req.app.get("redis");
        const cacheKey = `consultations:${id}`;

        // Try to get from cache first
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Consultation retrieved from cache",
                data: JSON.parse(cachedData),
            });
        }

        // Query from database
        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: "Consultation not found",
            });
        }

        // Set cache
        await redis.set(cacheKey, JSON.stringify(consultation), {
            EX: 3600, // Cache for 1 hour
        });

        return res.status(200).json({
            success: true,
            message: "Consultation retrieved successfully",
            data: consultation,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.updateConsultation = async (req, res) => {
    let url = "";
    let public_id = "";

    try {
        const { id } = req.params;
        const {
            name,
            price,
            active,
            isAnyOffer,
            offer_valid_upto_text,
            offer_valid_upto_date,
            description,
            discount,
            discount_price,
            position,
            removeImage,
        } = req.body;

        const file = req.file;

        // Find consultation
        const consultation = await Consultation.findById(id);

        if (!consultation) {
            if (file) await deleteFile(file.path);
            return res.status(404).json({
                success: false,
                message: "Consultation not found",
            });
        }

        // Check if position is already taken by another consultation
        if (position && position !== consultation.position) {
            const checkAvailablePosition = await Consultation.findOne({
                position: Number(position),
                _id: { $ne: id },
            });

            if (checkAvailablePosition) {
                if (file) await deleteFile(file.path);
                return res.status(400).json({
                    success: false,
                    message: `Position ${position} is already taken. Please choose a different position.`,
                });
            }
        }

        // Update data object
        const updateData = {
            name: name || consultation.name,
            price: price || consultation.price,
            active: active !== undefined ? active : consultation.active,
            isAnyOffer:
                isAnyOffer !== undefined ? isAnyOffer : consultation.isAnyOffer,
            offer_valid_upto_text:
                offer_valid_upto_text !== undefined
                    ? offer_valid_upto_text
                    : consultation.offer_valid_upto_text,
            offer_valid_upto_date:
                offer_valid_upto_date !== undefined
                    ? offer_valid_upto_date
                    : consultation.offer_valid_upto_date,
            description:
                description !== undefined ? description : consultation.description,
            discount: discount !== undefined ? discount : consultation.discount,
            discount_price:
                discount_price !== undefined
                    ? discount_price
                    : consultation.discount_price,
            position: position !== undefined ? position : consultation.position,
        };

        // Handle image
        if (file) {
            // Delete old image if exists
            if (consultation.imageUrl && consultation.imageUrl.public_id) {
                await deleteFileCloud(consultation.imageUrl.public_id);
            }

            // Upload new image
            const uploadResult = await uploadSingleFile(file);
            url = uploadResult.url;
            public_id = uploadResult.public_id;

            updateData.imageUrl = {
                url,
                public_id,
            };

            // Clean up temp file
            await deleteFile(file.path);
        } else if (removeImage === "true" && consultation.imageUrl) {
            // Remove image if requested
            if (consultation.imageUrl.public_id) {
                await deleteFileCloud(consultation.imageUrl.public_id);
            }
            updateData.imageUrl = { url: "", public_id: "" };
        }

        // Update consultation
        const updatedConsultation = await Consultation.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // Clear cache
        await clearConsultationCache(req);

        return res.status(200).json({
            success: true,
            message: "Consultation updated successfully",
            data: updatedConsultation,
        });
    } catch (error) {
        console.error(error);
        if (req.file) await deleteFile(req.file.path);
        if (public_id) await deleteFileCloud(public_id);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.deleteConsultation = async (req, res) => {
    try {
        const { id } = req.params;

        // Find consultation
        const consultation = await Consultation.findById(id);

        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: "Consultation not found",
            });
        }

        // Delete image if exists
        if (consultation.imageUrl && consultation.imageUrl.public_id) {
            await deleteFileCloud(consultation.imageUrl.public_id);
        }

        // Delete consultation
        await Consultation.findByIdAndDelete(id);

        // Clear cache
        await clearConsultationCache(req);

        return res.status(200).json({
            success: true,
            message: "Consultation deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

async function clearConsultationCache(req) {
    const redis = req.app.get("redis");

    const keys = await redis.keys("consultations:*");
    if (keys.length > 0) {
        await redis.del(keys);
        console.log(`Cleared ${keys.length} consultations cache keys.`);
    } else {
        console.log("No consultations cache keys to clear.");
    }
}

exports.addPrescriptionImages = async (req, res) => {
    const images = [];
    const publicIds = [];
    let files = [];

    try {
        console.log("Starting addPrescriptionImages function");

        const { id } = req.params;
        const { nextDateForConsultation, consultationDone } = req.body
        files = req.files || [];
        console.log("Files received:", files.length);

        if (!id) {
            console.log("No booking ID provided");
            if (files.length > 0) await deleteMultipleFiles(files);
            return res.status(400).json({ success: false, message: "Booking ID is required" });
        }

        const foundBookingConsultations = await BookingConsultations.findById(id).populate("pet");
        console.log("Booking found:", foundBookingConsultations);

        if (!foundBookingConsultations) {
            console.log("Booking not found for ID:", id);
            if (files.length > 0) await deleteMultipleFiles(files);
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (files.length > 0) {
            console.log("Uploading files to cloud...");
            const uploadResult = await uploadMultipleFiles(files);
            console.log("Upload result:", uploadResult);

            uploadResult.forEach((img) => {
                images.push({
                    url: img.url,
                    public_id: img.public_id,
                    date: new Date(),
                });
                publicIds.push(img.public_id);
            });

            foundBookingConsultations.prescriptionImages = [
                ...(foundBookingConsultations.prescriptionImages || []),
                ...images,
            ];

            foundBookingConsultations.prescription.nextDateForConsultation = nextDateForConsultation
            foundBookingConsultations.prescription.consultationDone = consultationDone
            await foundBookingConsultations.save();
            console.log("Images saved to DB");

            const delayInMilliseconds = 7 * 24 * 60 * 60 * 1000;
            console.log("Scheduling deletion after 7 days...");

            await DeletePresription.add(
                { id: foundBookingConsultations?._id },
                { delay: delayInMilliseconds }
            ).then(() => {
                console.log("✅ Delete job successfully added to Bull queue");
            }).catch(error => {
                console.error("❌ Error adding delete job to Bull queue:", error);
            });

            console.log("Delete job added to Bull queue");
            await PrescriptionMessageReport(
                foundBookingConsultations?.pet?.petOwnertNumber,
                { name: foundBookingConsultations?.pet?.petname },
                images[0]?.url
            ).then(() => {
                console.log("Prescription message sent successfully");
            }).catch(error => {
                console.error("Error sending prescription message:", error);
            });
            return res.status(200).json({
                success: true,
                message: "Prescription images uploaded successfully",
                data: foundBookingConsultations.prescriptionImages,
            });
        } else {
            console.log("No files uploaded");
            await deleteMultipleFiles(files);
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }
    } catch (error) {
        await deleteMultipleFiles(files);
        console.error("Error in addPrescriptionImages:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
