const errorHandler = require("../../middleware/errorHandler");
const { deleteMultipleFiles } = require("../../middleware/multer");
const ClinicRegister = require("../../models/ClinicRegister/ClinicRegister");
const generateOtp = require("../../utils/otp");
const { sendOtpEmail, sendWelcomeEmail } = require("../../utils/sendEmail");
const { sendToken, createToken, verifyRefreshToken } = require("../../utils/sendToken");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");




// Register a new clinic
exports.clinicRegister = async (req, res) => {
    const redis = req.app.get('redis');
    const files = req.files || [];
    let Images = [];
    try {
        const {
            clinicName,
            attendentName,
            address,
            position,
            email,
            phone,
            password,
            openTime,
            GMBPRofileLink,
            closeTime,
            offDay,
            rating,
            mapLocation,
            scanTestAvailableStatus,
            role
        } = req.body;

        console.log("Files received:", files.length);


        const existingClinic = await ClinicRegister.findOne({ email });
        if (existingClinic) {

            if (files.length > 0) {
                deleteMultipleFiles(files);
            }
            return res.status(400).json({ success: false, message: "Email already registered" });
        }


        let uploadedFiles = [];
        if (files.length > 0) {
            uploadedFiles = await uploadMultipleFiles(files);

            uploadedFiles.forEach(img => {
                Images.push({
                    url: img.url,
                    public_id: img.public_id,
                    position: Images.length + 1
                });
                publicIds.push(img.public_id);
            });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);


        const newClinic = new ClinicRegister({
            clinicName,
            attendentName,
            address,
            position,
            GMBPRofileLink,
            offDay,
            email,
            phone,
            password,
            openTime,
            closeTime,
            rating: rating || 0,
            mapLocation,
            scanTestAvailableStatus: scanTestAvailableStatus || false,
            role: role || "clinic",
            imageUrl: uploadedFiles,
            otp,
            otpExpiry,
            isVerified: false
        });

        await newClinic.save();

        // Store OTP in Redis for 10 minutes
        if (redis) {
            await redis.set(`clinic:otp:${email}`, otp, 'EX', 600);
        }

        // Send OTP to email
        await sendOtpEmail(email, otp, clinicName);

        res.status(201).json({
            success: true,
            message: "Clinic registered successfully. Please verify your email with the OTP sent.",
            clinicId: newClinic._id
        });

    } catch (error) {
        console.error("Error in clinic registration:", error);

        // Delete uploaded files in case of error
        if (files.length > 0) {
            deleteMultipleFiles(files);
        }

        res.status(500).json({
            success: false,
            message: "Error registering clinic",
            error: error.message
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        // Find clinic by email
        const clinic = await ClinicRegister.findOne({ email });
        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }

        // Check if already verified
        if (clinic.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            });
        }

        // Check OTP expiry
        if (clinic.otpExpiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Verify OTP from Redis if available
        let isOtpValid = false;
        if (redis) {
            const storedOTP = await redis.get(`clinic:otp:${email}`);
            isOtpValid = storedOTP === otp;
        } else {
            // Fallback to database OTP check
            isOtpValid = clinic.otp === otp;
        }

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }


        clinic.isVerified = true;
        clinic.otp = undefined;
        clinic.otpExpiry = undefined;
        await clinic.save();


        if (redis) {
            await redis.del(`clinic:otp:${email}`);
        }

        await sendWelcomeEmail(email, clinic?.clinicName)

        res.status(200).json({
            success: true,
            message: "Email verified successfully",

        });

    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying OTP",
            error: error.message
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    const redis = req.app.get('redis');

    try {
        const { email } = req.query ? req.query : req.body;
        console.log(req.query)

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find clinic by email
        const clinic = await ClinicRegister.findOne({ email });
        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }

        // Check if already verified
        if (clinic.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update clinic with new OTP
        clinic.otp = otp;
        clinic.otpExpiry = otpExpiry;
        await clinic.save();

        // Store OTP in Redis for 10 minutes
        if (redis) {
            await redis.set(`clinic:otp:${email}`, otp, 'EX', 600);
        }

        // Send OTP to email
        await sendOtpEmail(email, otp, clinic.clinicName);

        res.status(200).json({
            success: true,
            message: "OTP resent successfully"
        });

    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({
            success: false,
            message: "Error resending OTP",
            error: error.message
        });
    }
};

// Get all clinics
exports.getAllClinics = async (req, res) => {
    try {
        const clinics = await ClinicRegister.find().select("-password -otp -otpExpiry");

        res.status(200).json({
            success: true,
            count: clinics.length,
            data: clinics
        });

    } catch (error) {
        console.error("Error fetching clinics:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching clinics",
            error: error.message
        });
    }
};

// Get clinic by ID
exports.getClinicById = async (req, res) => {
    try {
        const clinic = await ClinicRegister.findById(req.params.id).select("-password -otp -otpExpiry");

        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }

        res.status(200).json({
            success: true,
            data: clinic
        });

    } catch (error) {
        console.error("Error fetching clinic:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching clinic",
            error: error.message
        });
    }
};

// Update clinic
exports.updateClinic = async (req, res) => {
    const files = req.files || [];
    const clinicId = req.params.id;
    let publicIds = []
    console.log(files)
    let Images = []
    try {
        const {
            clinicName,
            address,
            position,
            phone,
            openTime,
            closeTime,
            mapLocation,
            scanTestAvailableStatus
        } = req.body;

        // Find clinic by ID
        const clinic = await ClinicRegister.findById(clinicId);
        if (!clinic) {
            // Delete uploaded files since update failed
            if (files.length > 0) {
                deleteMultipleFiles(files);
            }
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }


        if (files) {
            // Delete uploaded files since update failed
            if (files.length > 0) {
                deleteMultipleFiles(files);
            }

        }

        // Upload new files if provided
        let uploadedFiles = [];
        if (files.length > 0) {
            uploadedFiles = await uploadMultipleFiles(files);
            uploadedFiles.forEach(img => {
                Images.push({
                    url: img.url,
                    public_id: img.public_id,

                });
                publicIds.push(img.public_id);
            });
            // Delete previous files from cloud if new files are uploaded
            if (clinic.images && clinic.images.length > 0) {
                await deleteMultipleFilesCloud(clinic.images);
            }
        }

        // Update clinic data
        const updatedClinic = await ClinicRegister.findByIdAndUpdate(
            req.params.id,
            {
                clinicName: clinicName || clinic.clinicName,
                address: address || clinic.address,
                position: position || clinic.position,
                phone: phone || clinic.phone,
                openTime: openTime || clinic.openTime,
                closeTime: closeTime || clinic.closeTime,
                mapLocation: mapLocation || clinic.mapLocation,
                scanTestAvailableStatus: scanTestAvailableStatus !== undefined ? scanTestAvailableStatus : clinic.scanTestAvailableStatus,
                imageUrl: files.length > 0 ? Images : clinic.imageUrl
            },
            { new: true }
        ).select("-password -otp -otpExpiry");

        res.status(200).json({
            success: true,
            message: "Clinic updated successfully",
            data: updatedClinic
        });

    } catch (error) {
        console.error("Error updating clinic:", error);

        // Delete uploaded files in case of error
        if (files.length > 0) {
            deleteMultipleFiles(files);
        }

        res.status(500).json({
            success: false,
            message: "Error updating clinic",
            error: error.message
        });
    }
};

// Delete clinic
exports.deleteClinic = async (req, res) => {
    try {
        // Find clinic by ID
        const clinic = await ClinicRegister.findById(req.params.id);
        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }


        if (req.user.id !== clinic._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to delete this clinic"
            });
        }

        // Delete clinic images from cloud storage
        if (clinic.images && clinic.images.length > 0) {
            await deleteMultipleFilesCloud(clinic.images);
        }

        // Delete clinic from database
        await ClinicRegister.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Clinic deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting clinic:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting clinic",
            error: error.message
        });
    }
};

// Clinic login
exports.clinicLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body)

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find clinic by email
        const clinic = await ClinicRegister.findOne({ email });
        if (!clinic) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check if clinic is verified
        if (!clinic.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Please verify your email first"
            });
        }

        // Check password
        const isMatch = await clinic.comparePassword(password, clinic.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        sendToken(clinic, 200, res, 'Login successful')
        // res.status(200).json({
        //     success: true,
        //     message: "Login successful",
        //     token,
        //     data: {
        //         id: clinic._id,
        //         clinicName: clinic.clinicName,
        //         email: clinic.email,
        //         role: clinic.role
        //     }
        // });

    } catch (error) {
        console.error("Error in clinic login:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
};



exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        // Check if refresh token exists
        if (!refreshToken) {
            return next(new errorHandler('Refresh token is required', 400));
        }

        // Verify refresh token
        const decoded = verifyRefreshToken00000(refreshToken);

        // Find user with the given refresh token
        const user = await ClinicRegister.findById(decoded.id);

        if (!user) {
            return next(new errorHandler('Invalid refresh token', 401));
        }

        // Validate that the refresh token exists in the user's refreshTokens array
        if (!user.hasValidRefreshToken(refreshToken)) {
            return next(new errorHandler('Invalid or expired refresh token', 401));
        }

        // Create new access token
        const payload = {
            id: user._id,
            role: user.role,
            email: user.email
        };

        const token = createToken(payload);

        // Set cookie options
        const cookieOptions = {
            expires: new Date(
                Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        // Set new token in cookie
        res.cookie('_usertoken', token, cookieOptions);

        // Send response
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            token
        });

    } catch (error) {
        console.error("Error in refresh token:", error);
        next(new errorHandler('Error refreshing token', 500));
    }
};

// Logout
exports.logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies._refreshtoken;

        // If refresh token exists, remove it from the user's refreshTokens array
        if (refreshToken && req.user) {
            await req.user.removeRefreshToken(refreshToken);
        }

        // Clear cookies
        res.cookie('_usertoken', '', {
            expires: new Date(0),
            httpOnly: true
        });

        res.cookie('_refreshtoken', '', {
            expires: new Date(0),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error("Error in logout:", error);
        next(new errorHandler('Error logging out', 500));
    }
};

// Validate token
exports.validateToken = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token is valid',
        user: {
            id: req.user._id,
            clinicName: req.user.clinicName,
            email: req.user.email,
            role: req.user.role
        }
    });
};

// Logout from all devices
exports.logoutAllDevices = async (req, res, next) => {
    try {
        await req.user.removeAllRefreshTokens();

        // Clear cookies
        res.cookie('_usertoken', '', {
            expires: new Date(0),
            httpOnly: true
        });

        res.cookie('_refreshtoken', '', {
            expires: new Date(0),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully'
        });

    } catch (error) {
        console.error("Error in logout from all devices:", error);
        next(new errorHandler('Error logging out from all devices', 500));
    }
};


exports.clinicUser = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const clinic = await ClinicRegister.findById(userId);

        if (!clinic) {
            return next(new ErrorResponse('Clinic not found', 404));
        }

        res.status(200).json({
            success: true,
            data: clinic
        });

    } catch (error) {
        next(error); // Send to error middleware
    }
};