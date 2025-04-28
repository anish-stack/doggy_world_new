const PetRegister = require("../../models/petAndAuth/petregister");
const sendOtp = require("../../utils/whatsapp/Sendotp");
const generateOtp = require("../../utils/otp");
const sendToken = require("../../utils/sendToken");


exports.registerPet = async (req, res) => {
    try {
        const {
            petType,
            petname,
            petOwnertNumber,
            petdob,
            petbreed,
            isGivePermisoonToSendNotification,
        } = req.body;

        // Check if required fields are provided
        if (!petType || !petname || !petOwnertNumber) {
            return res.status(400).json({
                success: false,
                message: "Pet type, name and owner number are required",
            });
        }

        // Check if pet owner already exists
        const existingPet = await PetRegister.findOne({ petOwnertNumber });
        if (existingPet) {
            if (existingPet.is_verify_pet) {
                return res.status(400).json({
                    success: false,
                    message: "Pet owner with this number already registered",
                });
            } else {
                const otp = generateOtp();
                const otpExpiry = new Date();
                otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);
                existingPet.otp = otp;
                existingPet.otp_expired_time = otpExpiry;
                existingPet.otp_how_many_send += 1;
                existingPet.isGivePermisoonToSendNotification = isGivePermisoonToSendNotification
                await existingPet.save();

                await sendOtp(petOwnertNumber, otp);

                return res.status(201).json({
                    success: true,
                    message: "Pet Already registered. Please verify OTP sent to your WhatsApp.",
                    data: {
                        _id: existingPet._id,
                        petname: existingPet.petname,
                        petOwnertNumber: existingPet.petOwnertNumber,
                    },
                });
            }
        }


        // Generate OTP
        const otp = generateOtp();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 2);

        // Create new pet
        const newPet = new PetRegister({
            petType,
            petname,
            petOwnertNumber,
            petdob: petdob || null,
            petbreed: petbreed || "",
            isGivePermisoonToSendNotification:
                isGivePermisoonToSendNotification || false,
            otp,
            otp_how_many_send: 1,
            otp_expired_time: otpExpiry,
        });

        await newPet.save();

        // Send OTP via WhatsApp
        await sendOtp(petOwnertNumber, otp);

        return res.status(201).json({
            success: true,
            message: "Pet registered successfully. OTP sent to your WhatsApp.",
            data: {
                _id: newPet._id,
                petname: newPet.petname,
                petOwnertNumber: newPet.petOwnertNumber,
            },
        });


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again.",
            error: error.message,
        });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { petOwnertNumber, otp } = req.body;

        if (!petOwnertNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Owner number and OTP are required",
            });
        }

        const pet = await PetRegister.findOne({ petOwnertNumber });
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found with this number",
            });
        }

        if (pet.isBlockForOtp) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is temporarily blocked due to multiple OTP requests. Please try after some time.",
            });
        }

        if (pet.is_verify_pet) {
            return res.status(400).json({
                success: false,
                message: "Pet is already verified",
            });
        }

        // Check if OTP is expired
        const currentTime = new Date();
        if (currentTime > pet.otp_expired_time) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        // Verify OTP
        if (pet.otp !== parseInt(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again.",
            });
        }

        // Update pet to verified status
        pet.is_verify_pet = true;
        pet.otp = null;
        pet.isBlockForOtp = false;
        pet.otp_how_many_send = 0
        pet.otp_expired_time = null

        await pet.save();

        await sendToken(pet, 200, res, 'OTP verified successfully.');

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "OTP verification failed. Please try again.",
            error: error.message,
        });
    }
};


exports.resendOtp = async (req, res) => {
    try {
        const { petOwnertNumber } = req.body;

        if (!petOwnertNumber) {
            return res.status(400).json({
                success: false,
                message: "Owner number is required",
            });
        }

        const pet = await PetRegister.findOne({ petOwnertNumber });
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found with this number",
            });
        }

        if (pet.is_verify_pet) {
            return res.status(400).json({
                success: false,
                message: "Pet is already verified",
            });
        }

        if (pet.isBlockForOtp) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is temporarily blocked due to multiple OTP requests. Please try after some time.",
            });
        }

        // Check if OTP requests exceed limit (max 5 times)
        if (pet.otp_how_many_send >= 5) {
            pet.isBlockForOtp = true;
            await pet.save();

            return res.status(403).json({
                success: false,
                message:
                    "Too many OTP requests. Your account has been temporarily blocked. Please try again later.",
            });
        }

        // Generate new OTP
        const otp = generateOtp();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 2); // OTP valid for 2 minutes

        // Update pet with new OTP
        pet.otp = otp;
        pet.otp_expired_time = otpExpiry;
        pet.otp_how_many_send += 1;
        await pet.save();

        // Send OTP via WhatsApp
        await sendOtp(petOwnertNumber, otp);

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully to your WhatsApp",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP. Please try again.",
            error: error.message,
        });
    }
};


exports.loginPet = async (req, res) => {
    try {
        const { petOwnertNumber } = req.body;

        if (!petOwnertNumber) {
            return res.status(400).json({
                success: false,
                message: "Owner number is required",
            });
        }

        const pet = await PetRegister.findOne({ petOwnertNumber }).populate(
            "petType"
        );
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "No pet found with this owner number. Please register first.",
            });
        }

        if (!pet.is_verify_pet) {
            return res.status(403).json({
                success: false,
                message:
                    "Your pet is not verified. Please complete verification process.",
            });
        }

        if (pet.isBlockForOtp) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is temporarily blocked. Please try after some time.",
            });
        }

        // Generate new OTP for login
        const otp = generateOtp();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 2); // OTP valid for 2 minutes

        // Update pet with login OTP
        pet.otp = otp;
        pet.otp_expired_time = otpExpiry;
        pet.otp_how_many_send += 1;
        await pet.save();

        // Send OTP via WhatsApp
        await sendOtp(petOwnertNumber, otp);

        return res.status(200).json({
            success: true,
            message: "Login OTP sent to your WhatsApp",
            data: {
                _id: pet._id,
                petname: pet.petname,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again.",
            error: error.message,
        });
    }
};

exports.loginPetverifyOtp = async (req, res) => {
    try {
        const { petOwnertNumber, otp } = req.body;

        if (!petOwnertNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: "Owner number and OTP are required",
            });
        }

        const pet = await PetRegister.findOne({ petOwnertNumber });
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found with this number",
            });
        }

        if (pet.isBlockForOtp) {
            return res.status(403).json({
                success: false,
                message:
                    "Your account is temporarily blocked due to multiple OTP requests. Please try after some time.",
            });
        }




        const currentTime = new Date();
        if (currentTime > pet.otp_expired_time) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        // Verify OTP
        if (pet.otp !== parseInt(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again.",
            });
        }


        pet.otp_how_many_send = 0
        pet.otp_expired_time = null

        await pet.save();

        await sendToken(pet, 200, res, 'OTP verified successfully.');

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "OTP verification failed. Please try again.",
            error: error.message,
        });
    }
};


exports.getPetProfile = async (req, res) => {
    try {
        const { petId } = req.params;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: "Pet ID is required",
            });
        }

        const pet = await PetRegister.findById(petId).populate("petType");
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pet profile fetched successfully",
            data: {
                _id: pet._id,
                petname: pet.petname,
                petOwnertNumber: pet.petOwnertNumber,
                petdob: pet.petdob,
                petbreed: pet.petbreed,
                petType: pet.petType,
                isGivePermisoonToSendNotification:
                    pet.isGivePermisoonToSendNotification,
                createdAt: pet.createdAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pet profile",
            error: error.message,
        });
    }
};


exports.updatePetProfile = async (req, res) => {
    try {
        const { petId } = req.params;
        const { petname, petdob, petbreed, isGivePermisoonToSendNotification } =
            req.body;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: "Pet ID is required",
            });
        }

        const pet = await PetRegister.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        // Update pet details
        if (petname) pet.petname = petname;
        if (petdob) pet.petdob = petdob;
        if (petbreed) pet.petbreed = petbreed;
        if (isGivePermisoonToSendNotification !== undefined) {
            pet.isGivePermisoonToSendNotification = isGivePermisoonToSendNotification;
        }

        await pet.save();

        return res.status(200).json({
            success: true,
            message: "Pet profile updated successfully",
            data: {
                _id: pet._id,
                petname: pet.petname,
                petOwnertNumber: pet.petOwnertNumber,
                petdob: pet.petdob,
                petbreed: pet.petbreed,
                isGivePermisoonToSendNotification:
                    pet.isGivePermisoonToSendNotification,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update pet profile",
            error: error.message,
        });
    }
};


exports.deletePetProfile = async (req, res) => {
    try {
        const { petId } = req.params;

        if (!petId) {
            return res.status(400).json({
                success: false,
                message: "Pet ID is required",
            });
        }

        const pet = await PetRegister.findByIdAndDelete(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pet profile deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete pet profile",
            error: error.message,
        });
    }
};


exports.changePetOwnerNumber = async (req, res) => {
    try {
        const { petId } = req.params;
        const { currentNumber, newNumber } = req.body;

        if (!petId || !currentNumber || !newNumber) {
            return res.status(400).json({
                success: false,
                message: "Pet ID, current number and new number are required",
            });
        }

        // Check if pet exists with current number
        const pet = await PetRegister.findOne({
            _id: petId,
            petOwnertNumber: currentNumber,
        });
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found with this ID and owner number",
            });
        }

        // Check if new number is already in use
        const existingNumber = await PetRegister.findOne({
            petOwnertNumber: newNumber,
        });
        if (existingNumber) {
            return res.status(400).json({
                success: false,
                message: "This number is already registered with another pet",
            });
        }

        // Generate OTP for verification
        const otp = generateOtp();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

        // Update pet with verification details
        pet.otp = otp;
        pet.otp_expired_time = otpExpiry;
        pet.otp_how_many_send = 1;
        pet.is_verify_pet = false; // Require re-verification with new number

        // Save new number temporarily (will be confirmed after OTP verification)
        pet._newPetOwnerNumber = newNumber;
        console.log(pet)
        await pet.save();

        // Send OTP to new number
        await sendOtp(newNumber, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your new number for verification",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to process number change request",
            error: error.message,
        });
    }
};


exports.verifyNumberChangeOtp = async (req, res) => {
    try {
        const { petId } = req.params;
        const { otp, newNumber } = req.body;

        if (!petId || !otp || !newNumber) {
            return res.status(400).json({
                success: false,
                message: "Pet ID, OTP and new number are required",
            });
        }

        const pet = await PetRegister.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: "Pet not found",
            });
        }

        if (pet._newPetOwnerNumber !== newNumber) {
            return res.status(400).json({
                success: false,
                message: "Number mismatch. Please try again.",
            });
        }

        // Check if OTP is expired
        const currentTime = new Date();
        if (currentTime > pet.otp_expired_time) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        // Verify OTP
        if (pet.otp !== parseInt(otp)) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again.",
            });
        }

        // Update pet with new number
        pet.petOwnertNumber =  pet._newPetOwnerNumber;
        pet.is_verify_pet = true;
        pet.otp = null;
        pet._newPetOwnerNumber = undefined;
        await pet.save();

        return res.status(200).json({
            success: true,
            message: "Phone number updated successfully",
            data: {
                _id: pet._id,
                petname: pet.petname,
                petOwnertNumber: pet.petOwnertNumber,
            },
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP",
            error: error.message,
        });
    }
};


exports.getAllPets = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', petType = '', is_verify_pet = '' } = req.query;
        console.log(req.query)

        const queryOptions = {};

        if (search) {
            queryOptions.$or = [
                { petname: { $regex: search, $options: 'i' } },
                { petOwnertNumber: { $regex: search, $options: 'i' } },
                { petbreed: { $regex: search, $options: 'i' } },
             
            ];
        }

        if (petType) {
            queryOptions.petType = petType;
        }
        if (is_verify_pet !== null && is_verify_pet !== '') {
            queryOptions.is_verify_pet = is_verify_pet === 'true';
        } else {
         
            queryOptions.is_verify_pet = true;
        }
        

        const totalPets = await PetRegister.countDocuments(queryOptions);

        const pets = await PetRegister.find(queryOptions)
            .populate('petType')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            message: 'Pets fetched successfully',
            data: {
                pets,
                totalPets,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalPets / limit),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pets',
            error: error.message,
        });
    }
};
