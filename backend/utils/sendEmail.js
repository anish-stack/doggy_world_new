const nodemailer = require("nodemailer");

// Create transporter object
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // secure: process.env.EMAIL_SECURE === "true", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

exports.sendOtpEmail = async (email, otp, clinicName) => {
  try {
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"Doggy World Veterinary Hospital" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a90e2; text-align: center;">Email Verification</h2>
          <p>Hello ${clinicName},</p>
          <p>Thank you for registering with our Doggy World Veterinary Hospital Platform. To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
          <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes. If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br>Doggy World Veterinary Hospital Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #888;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

exports.sendPasswordResetEmail = async (email, resetToken, clinicName) => {
  try {
    const transporter = createTransporter();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email options
    const mailOptions = {
      from: `"Doggy World Veterinary Hospital" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a90e2; text-align: center;">Password Reset Request</h2>
          <p>Hello ${clinicName},</p>
          <p>You requested a password reset for your Doggy World Veterinary Hospital account. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>This link is valid for 10 minutes.</p>
          <p>Best regards,<br>Doggy World Veterinary Hospital Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #888;">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If the button above doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
          </div>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};


exports.sendWelcomeEmail = async (email, clinicName) => {
  try {
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"Doggy World Veterinary Hospital" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Welcome to Doggy World!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a90e2; text-align: center;">Welcome to Doggy World Veterinary Hospital!</h2>
          <p>Hello ${clinicName},</p>
          <p>Thank you for completing your registration with Doggy World Veterinary Hospital. We're excited to have you on board!</p>
          <p>With your account, you can now:</p>
          <ul style="padding-left: 20px;">
            <li>Update your clinic profile</li>
            <li>Manage appointments</li>
            <li>Manage Bookings</li>
            <li>Connect with Pets</li>
            <li>Access health resources</li>
          </ul>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>Doggy World Veterinary Hospital Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #888;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};


exports.sendCustomeConulationEmail = async ({ data }) => {
  const {
    consulationtype,
    date,
    petname,
    bookingId,
    Payment,
    time,
    whichDoctor,
    whenBookingDone,
    ownerNumber = 'Customer'
  } = data;

  try {
    const transporter = createTransporter();

    let mailOptions
  
    if(whichDoctor){
      mailOptions = {
        from: `"Doggy World Veterinary Hospital" <${process.env.EMAIL_FROM}>`,
        to: "anishjha896@gmail.com", // Admin email
        subject: `New Consultation Booking Received - ID: ${bookingId}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #e74c3c;">New Booking Notification</h2>
            <p>A new consultation booking has been successfully made on the Doggy World platform.</p>
  
            <h3>📋 Booking Details:</h3>
            <ul>
              <li><strong>Booking ID:</strong> ${bookingId}</li>
              <li><strong>Consultation Type:</strong> ${consulationtype}</li>
              <li><strong>Pet Name:</strong> ${petname}</li>
              <li><strong>Owner Number:</strong> ${ownerNumber}</li>
              <li><strong>Doctor Assigned:</strong> ${whichDoctor}</li>
              <li><strong>Date:</strong> ${date}</li>
              <li><strong>Time:</strong> ${time}</li>
              <li><strong>Payment Amount:</strong> ₹${Payment}</li>
              <li><strong>Booking Timestamp:</strong> ${whenBookingDone}</li>
            </ul>
  
            <p>Please log in to the admin panel for more details or to take further action if required.</p>
  
            <p style="margin-top: 20px;">Regards,<br/>
            <strong>Doggy World System</strong></p>
          </div>
        `,
      };
    }else{
      mailOptions = {
        from: `"Doggy World Veterinary Hospital" <${process.env.EMAIL_FROM}>`,
        to: "anishjha896@gmail.com", // Admin email
        subject: `New Vaccination Booking Received - ID: ${bookingId}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #e74c3c;">New Booking Notification</h2>
            <p>A new Vaccination booking has been successfully made on the Doggy World platform.</p>
  
            <h3>📋 Booking Details:</h3>
            <ul>
              <li><strong>Booking ID:</strong> ${bookingId}</li>
              <li><strong>Vaccination:</strong> ${consulationtype}</li>
              <li><strong>Pet Name:</strong> ${petname}</li>
              <li><strong>Owner Number:</strong> ${ownerNumber}</li>
              
              <li><strong>Date:</strong> ${date}</li>
              <li><strong>Time:</strong> ${time}</li>
              <li><strong>Payment Amount:</strong> ₹${Payment}</li>
              <li><strong>Booking Timestamp:</strong> ${whenBookingDone}</li>
            </ul>
  
            <p>Please log in to the admin panel for more details or to take further action if required.</p>
  
            <p style="margin-top: 20px;">Regards,<br/>
            <strong>Doggy World System</strong></p>
          </div>
        `,
      };
    }
 

    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Admin booking email sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("❌ Error sending admin consultation email:", error);
    throw new Error("Failed to send admin consultation email");
  }
};
