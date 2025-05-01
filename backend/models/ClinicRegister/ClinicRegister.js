const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ClinicSchema = new mongoose.Schema({
    clinicName: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
    },
    attendentName: {
        type: String,
        trim: true,
    },
    GMBPRofileLink: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    openTime: {
        type: String,
        required: true,
    },
    closeTime: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    mapLocation: {
        type: String,
    },
    scanTestAvailableStatus: {
        type: Boolean,
        default: false,
    },
    imageUrl: [
        {
            url: {
                type: String,
                trim: true,
            },
            public_id: {
                type: String,
                trim: true,
            },
        }
    ],
    offDay: {
        type: String,
    },
    anyCloseDate: {
        type: Boolean,
        default: false,
    },
    closeDate: {
        type: Date,
    },
    role: {
        type: String,
        enum: ["clinic", "admin"],
        default: "clinic",
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    refreshTokens: [{
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: '7d'
        }
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, { timestamps: true });

ClinicSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

ClinicSchema.pre("save", function (next) {
    if (!this.isModified("resetPasswordToken")) {
        return next();
    }

    if (this.resetPasswordToken) {
        this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    }

    next();
});

ClinicSchema.methods.removeRefreshToken = function (token) {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
    return this.save({ validateBeforeSave: false });
};

// Remove all refresh tokens (logout from all devices)
ClinicSchema.methods.removeAllRefreshTokens = function () {
    this.refreshTokens = [];
    return this.save({ validateBeforeSave: false });
};
ClinicSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Clinic', ClinicSchema);
