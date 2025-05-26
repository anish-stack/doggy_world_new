const Bull = require('bull');
const nodemailer = require('nodemailer');
const { sendCustomeConulationEmail, sendCustomePhysioEmail } = require('../utils/sendEmail');
const { sendEmail } = require('../utils/emailUtility');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Improved HTML email with fallback plaintext and responsive styling
async function sendFailureNotificationEmail(job, err) {
  const adminEmail = 'happycoding41@gmail.com';
  const subject = `⚠️ Job Failed: ${job.data.type || 'Unknown Type'} (User: ${job.data.userId || 'N/A'})`;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; color: #212529; max-width: 600px; margin: auto; padding: 20px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px;">
      <h2 style="color: #d63333;">🚨 Job Failure Notification</h2>
      <p>A job in the email sending queue has <strong>failed</strong> after <strong>${job.attemptsMade}</strong> attempts.</p>
      <p>Please review the system dashboard and logs for more information and necessary actions.</p>

      <div style="margin-top: 20px;">
        <h3 style="color: #003873;">🔍 Job Details</h3>
        <ul style="list-style: none; padding-left: 0;">
          <li><strong>🆔 Job ID:</strong> ${job.id}</li>
          <li><strong>👤 User ID:</strong> ${job.data.userId || 'N/A'}</li>
          <li><strong>📧 Email Type:</strong> ${job.data.type || 'N/A'}</li>
          <li><strong>❌ Error Message:</strong> ${err.message}</li>
          <li><strong>📅 Timestamp:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
        This is an automated message from the Doggy Workd Care system. Please ensure all customer communication is completed successfully.
      </p>
    </div>
  `;

  const textMessage = `
    Job Failure Notification

    A job in the email sending queue has failed after ${job.attemptsMade} attempts.

    Job Details:
    - Job ID: ${job.id}
    - User ID: ${job.data.userId || 'N/A'}
    - Email Type: ${job.data.type || 'N/A'}
    - Error Message: ${err.message}
    - Timestamp: ${new Date().toLocaleString()}

    Please check the admin dashboard and logs to resolve the issue.
  `;

  try {
    await transporter.sendMail({
      from: `"Doggy Workd Care" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      text: textMessage,
      html: htmlMessage,
    });
    console.log('Failure notification email sent to admin.');
  } catch (emailErr) {
    console.error('Failed to send failure notification email:', emailErr);
  }
}

const EmailSendQueue = new Bull('email-send-queue', {
  redis: { host: '127.0.0.1', port: 6379 },
  settings: {
    lockDuration: 60000,
    stalledInterval: 30000,
  },
  defaultJobOptions: {
    attempts: 1,
    backoff: {
      type: 'exponential',
      delay: 36000,
    },
  },
});

EmailSendQueue.process(async (job) => {
  try {
    const { body, type } = job.data;

    switch (type) {
      case 'consultation':
        await sendCustomeConulationEmail({ data: body });
        break;

      case 'physio':
        await sendCustomePhysioEmail({ data: body });
        break;

      case 'product':
        await sendEmail(body);
        console.log(`Order confirmation email sent for order: ${body.orderNumber || 'Unknown'}`);
        break;

      case 'test-failure':
        throw new Error('This is a test failure for job failure notification email.');

      default:
        console.warn(`Unknown email type: ${type}`);
        throw new Error(`Unknown email type: ${type}`); // Optional fallback for unhandled types
    }

    return { success: true };
  } catch (error) {
    console.error('Job processing failed:', error);
    throw error;
  }
});

EmailSendQueue.on('completed', (job, result) => {
  console.log(`✅ Job completed for userId: ${job.data.userId || 'N/A'}`, result);
});

EmailSendQueue.on('failed', async (job, err) => {
  console.error(`❌ Job failed for userId: ${job.data.userId || 'N/A'}`, err.message);
  await sendFailureNotificationEmail(job, err);
});

EmailSendQueue.on('error', (err) => {
  console.error('Queue error:', err);
});

module.exports = EmailSendQueue;
