const Bull = require('bull');
const BookingConsultations = require('../models/Consultations/BookingConsultations');
const { deleteFileCloud } = require('../utils/upload');

const DeletePresription = new Bull('delete-presription-queue', {
    redis: { host: '127.0.0.1', port: 6379 },
    settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
    },
    defaultJobOptions: {
        attempts: 1,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    },
});

DeletePresription.process(async (job) => {
    try {
        const { id } = job.data;
        const foundConsultation = await BookingConsultations.findById(id);

        if (!foundConsultation) {
            console.warn(`Consultation with ID ${id} not found.`);
            return;
        }

        const currentTime = new Date();
        const thresholdDate = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);

        const remainingImages = [];
        const deletedImages = [];

        for (const img of foundConsultation.prescriptionImages || []) {
            const uploadedDate = new Date(img.date);
            if (uploadedDate < thresholdDate) {
                try {
                    await deleteFileCloud(img.public_id);
                    deletedImages.push(img.public_id);
                    console.log(`Deleted old image: ${img.public_id}`);
                } catch (deleteErr) {
                    console.error(`Failed to delete image ${img.public_id}:`, deleteErr);
                    remainingImages.push(img); // preserve if failed to delete
                }
            } else {
                remainingImages.push(img);
            }
        }

        foundConsultation.prescriptionImages = remainingImages;
        await foundConsultation.save();

        console.log(`Deleted ${deletedImages.length} prescription images older than 7 days for consultation ID: ${id}`);

    } catch (error) {
        console.error(`Error processing delete-presription-queue job for ID ${job.data.id}:`, error);
        throw error;
    }
});


DeletePresription.on('completed', (job, result) => {
    console.log(`✅ Job completed for userId: ${job.data.userId || 'N/A'}`, result);
});

DeletePresription.on('failed', async (job, err) => {
    console.error(`❌ Job failed for userId: ${job.data.userId || 'N/A'}`, err.message);
   
});

DeletePresription.on('error', (err) => {
    console.error('Queue error:', err);
});

module.exports = DeletePresription;
