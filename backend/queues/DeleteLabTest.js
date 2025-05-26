const Bull = require('bull');
const nodemailer = require('nodemailer');
const { deleteFileCloud } = require('../utils/upload');
const LabBooking = require('../models/LabsTest/LabBooking');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Failure email sender
async function sendFailureNotificationEmail(job, err) {
    const adminEmail = 'happycoding41@gmail.com';
    const subject = `⚠️ Auto-Deletion Job Failed (User: ${job.data.userId || 'Unknown'})`;

    const htmlMessage = `
    <div style="font-family: Arial, sans-serif; color: #212529; max-width: 600px; margin: auto; padding: 20px; background-color: #f0fffe; border: 1px solid #b5e7e6; border-radius: 8px;">
      <h2 style="color: #d64444;">❌ Auto-Deletion Job Failed</h2>
      <p style="margin-bottom: 10px;">A background job failed while attempting to delete expired lab test report images older than <strong>7 days</strong>.</p>
      <p>Please review the error below and take necessary action if required:</p>

      <div style="margin-top: 20px;">
        <h3 style="color: #003873;">📄 Job Summary</h3>
        <ul style="list-style-type: none; padding: 0;">
          <li><strong>🆔 Job ID:</strong> ${job.id}</li>
         
          <li><strong>📅 Attempts:</strong> ${job.attemptsMade}</li>
          <li><strong>❗ Error:</strong> ${err.message}</li>
          <li><strong>🕒 Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <p style="margin-top: 20px; color: #4377a2; font-size: 14px;">
        This is an automated alert from the Doggy World Care.
      </p>
    </div>
  `;

    const textMessage = `
Auto-Deletion Job Failure Notice

A background job failed to delete expired lab test report images.

Job Details:
- Job ID: ${job.id}

- Attempts: ${job.attemptsMade}
- Error: ${err.message}
- Time: ${new Date().toLocaleString()}

Please review the logs for further information.
`;

    try {
        await transporter.sendMail({
            from: `"cYUGI Health System" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject,
            text: textMessage,
            html: htmlMessage,
        });
        console.log('🚨 Failure email sent to admin.');
    } catch (emailErr) {
        console.error('❌ Failed to send failure notification email:', emailErr);
    }
}

// Bull queue setup
const DeleteLabTest = new Bull('delete-labtest-queue', {
    redis: { host: '127.0.0.1', port: 6379 },
    settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
    },
    defaultJobOptions: {
        attempts: 1,
        backoff: { type: 'exponential', delay: 5000 },
    },
});

// Main job processor
DeleteLabTest.process(async (job) => {
    try {
        const { id } = job.data;
        const booking = await LabBooking.findById(id);

        if (!booking) {
            console.warn(`⚠️ LabBooking with ID ${id} not found.`);
            return;
        }

        const now = new Date();
        const threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        const remaining = [];
        const deleted = [];

        for (const img of booking.Report || []) {
            const uploadDate = new Date(img.date);
            if (uploadDate < threshold) {
                try {
                    await deleteFileCloud(img.public_id);
                    deleted.push(img.public_id);
                    console.log(`🗑️ Deleted expired image: ${img.public_id}`);
                } catch (delErr) {
                    console.error(`❌ Failed to delete image ${img.public_id}:`, delErr);
                    remaining.push(img); // keep if failed
                }
            } else {
                remaining.push(img);
            }
        }

        booking.Report = remaining;
        await booking.save();

        console.log(`✅ ${deleted.length} expired images deleted for Booking ID: ${id}`);
    } catch (error) {
        console.error(`🔥 Error in job for Booking ID ${job.data.id}:`, error);
        throw error; // triggers 'failed' listener
    }
});

// Event listeners
DeleteLabTest.on('completed', (job, result) => {
    console.log(`🎉 Job completed successfully for Booking ID: ${job.data.id}`);
});

DeleteLabTest.on('failed', async (job, err) => {
    console.error(`🚫 Job failed for Booking ID: ${job.data.id}`, err.message);
    await sendFailureNotificationEmail(job, err);
});

DeleteLabTest.on('error', (err) => {
    console.error('❗ Queue encountered an error:', err);
});

module.exports = DeleteLabTest;
