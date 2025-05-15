const BakeryAndShopBooking = require("../../models/commonBooking/BakeryAndShopBooking");
const CakeBooking = require("../../models/Cake Models/CakeBooking");
const BookingConsultations = require("../../models/Consultations/BookingConsultations");
const LabTestBooking = require("../../models/LabsTest/LabBooking");
const VaccinationBooking = require("../../models/VaccinationSchema/VaccinationBooking");
const BookingPhysioModel = require("../../models/PhysioTherapy/BookingPhysio.model");
const AppError = require("../../utils/ApiError");
const { sendEmail } = require("../../utils/emailUtility");
const { sendCustomRescheduleMessageEmail } = require("../../utils/sendEmail");
const RazorpayUtils = require("../../utils/razorpayUtils");
const Razorpay = require('razorpay');
const sendNotification = require("../../utils/sendNotification");

const razorpayUtils = new Razorpay(
    {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    }
);

exports.getMyConsultationsBooking = async (req, res) => {
    try {


        const petId = req.user?.id || req.params.id;


        if (!petId) {
            return res.status(401).json({
                success: false,
                message: 'Please login to check your consultations'
            });
        }

        // const cacheKey = `user:${petId}:consultations`;

        // const cachedData = await redis.get(cacheKey);

        // if (cachedData) {

        //     const parsedData = JSON.parse(cachedData);
        //     return res.status(200).json({
        //         success: true,
        //         message: 'Consultations fetched from cache successfully',
        //         count: parsedData.length,
        //         data: parsedData,
        //         fromCache: true
        //     });
        // }


        const myConsultationsBooking = await BookingConsultations.find({ pet: petId })
            .populate('consultationType', 'name price discount_price description')
            .populate('paymentDetails')
            .populate('doctorId', 'name image discount price specializations')
            .populate('pet', 'petname petOwnertNumber petbreed petdob')
            .sort({ createdAt: -1 });


        if (!myConsultationsBooking || myConsultationsBooking.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No consultations found',
                data: []
            });
        }



        // await redis.set(cacheKey, JSON.stringify(myConsultationsBooking), 'EX', 3600); // cache for 1 hour

        return res.status(200).json({
            success: true,
            message: 'Consultations fetched successfully',
            count: myConsultationsBooking.length,
            data: myConsultationsBooking
        });

    } catch (error) {
        console.error('Error fetching consultations:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch consultations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


exports.getAllConsultationsBookings = async (req, res) => {
    try {
        const myConsultationsBooking = await BookingConsultations.find()
            .populate('consultationType', 'name price discount_price description')
            .populate('paymentDetails')
            .populate('doctorId', 'name image discount price specializations')
            .populate('pet', 'petname petOwnertNumber petbreed petdob')
            .sort({ createdAt: -1 });


        if (!myConsultationsBooking || myConsultationsBooking.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No consultations found',
                data: []
            });
        }


        return res.status(200).json({
            success: true,
            message: 'Consultations fetched successfully',
            count: myConsultationsBooking.length,
            data: myConsultationsBooking
        });

    } catch (error) {
        console.error('Error fetching consultations:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch consultations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

exports.getMyConsultationsBookingSingle = async (req, res) => {
    try {


        const id = req.params.id;


        if (!id) {
            return res.status(401).json({
                success: false,
                message: 'Please login to check your consultations'
            });
        }


        const myConsultationsBooking = await BookingConsultations.findById(id)
            .populate('consultationType', 'name price discount_price description')
            .populate('paymentDetails')
            .populate('doctorId', 'name image discount price specializations')
            .populate('pet', 'petname petOwnertNumber petbreed petdob')
            .sort({ createdAt: -1 });


        if (!myConsultationsBooking || myConsultationsBooking.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No consultations found',
                data: []
            });
        }





        return res.status(200).json({
            success: true,
            message: 'Consultations fetched successfully',

            data: myConsultationsBooking
        });

    } catch (error) {
        console.error('Error fetching consultations:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch consultations',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.resecheduleBooking = async (req, res) => {
    try {
        const { id, date, time } = req.query;

        console.log(req.query)

        if (!id || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: id, date, or time',
            });
        }

        const formattedDate = new Date(date).toISOString().split('T')[0];

        const booking = await BookingConsultations.findOne({
            _id: id,
            status: { $nin: ['Cancelled', 'Completed'] }, // Only allow if not Cancelled or Completed
        })
            .populate('paymentDetails', 'payment_status')
            .populate('consultationType', 'name price discount_price description')
            .populate('doctorId', 'name image discount price specializations')
            .populate('pet', 'petname petOwnertNumber petbreed petdob');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or not eligible for rescheduling.',
            });
        }

        if (booking?.paymentDetails?.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking is not valid. Please contact support.',
            });
        }

        const existingBookings = await BookingConsultations.find({
            date: formattedDate,
            time,
            status: { $nin: ['Cancelled'] },
        });

        if (existingBookings.length >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Selected time slot is fully booked. Please choose a different slot.',
            });
        }

        booking.date = formattedDate;
        booking.time = time;
        booking.status = 'Rescheduled';
        await booking.save();

        await sendCustomRescheduleMessageEmail({
            bookingId: booking._id,
            date: booking.date,
            time: booking.time,
            doctor: booking.doctorId?.name,
            petName: booking.pet?.petname,
            ownerContact: booking.pet?.petOwnertNumber,
        });

        return res.status(200).json({
            success: true,
            message: 'Booking rescheduled successfully.',
            data: booking,
        });
    } catch (error) {
        console.error("❌ Error in resecheduleBooking:", error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while rescheduling the booking. Please try again later.',
        });
    }
};

exports.CancelBooking = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: id',
            });
        }

        // Fetch booking details from the database
        const booking = await BookingConsultations.findOne({
            _id: id,
            status: { $nin: ['Completed', 'Cancelled'] },
        }).populate('paymentDetails');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or already cancelled/completed.',
            });
        }

        // Validate the payment status
        if (booking?.paymentDetails?.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Booking is not paid or is invalid. Please contact support.',
            });
        }

        // Extract payment details
        const { razorpay_payment_id, amount } = booking.paymentDetails;

        try {
            // Process refund
            const refund = await razorpayUtils.payments.refund(razorpay_payment_id, {
                amount: amount / 100,
                notes: {
                    booking_id: id,
                    reason: 'Customer requested cancellation'
                }
            });

            // Update booking status
            booking.status = 'Cancelled';
            if (booking.paymentDetails) {
                booking.paymentDetails.status = 'refunded';
                booking.refundDetails = refund

                await booking.paymentDetails.save()
            }
            await booking.save();

            return res.status(200).json({
                success: true,
                message: 'Booking successfully cancelled and refunded. A notification has been sent.',
                refundDetails: refund,

            });

        } catch (refundError) {
            console.log("refundError")
            return res.status(500).json({
                success: false,
                message: 'Refund or notification failed. Please contact support.',
                error: refundError
            });
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the booking. Please try again later.',
            error: error.message
        });
    }
};

exports.addRating = async (req, res) => {
    try {
        const { id, number, note } = req.body;

        // Validate input
        if (!id || number === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: id and rating number are required.',
            });
        }

        // Fetch booking details
        const booking = await BookingConsultations.findOne({
            _id: id,
            status: { $nin: ['Cancelled'] },
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or already cancelled.',
            });
        }

        // Set rating
        booking.Rating = {
            number,
            note,
        };

        // Save changes
        await booking.save();

        return res.status(200).json({
            success: true,
            message: 'Rating added successfully.',
            data: booking.Rating,
        });

    } catch (error) {
        console.error("❌ Error in addRating:", error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while adding rating.',
        });
    }
};

exports.addPrescriptions = async (req, res) => {
    try {
        const {
            id,
            description,
            medicenSuggest = [],
            nextDateForConsultation,
            consultationDone = true,
        } = req.body;

        // Validate input
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: id.',
            });
        }

        // Fetch booking details
        const booking = await BookingConsultations.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or already cancelled.',
            });
        }

        // Add prescription details
        booking.prescription = {
            description,
            medicenSuggest,
            nextDateForConsultation,
            consultationDone,
        };
        booking.status = 'Completed'
        // Save changes
        await booking.save();

        // Send FCM Notification if token exists
        if (booking.fcmToken) {
            const notificationData = {
                title: 'Prescription Updated',
                body: 'Your doctor has added a new prescription to your consultation.',
            };
            try {
                await sendNotification(booking.fcmToken, notificationData.title, notificationData?.body);
                console.log('✅ FCM notification sent successfully.');
            } catch (notificationError) {
                console.error('❌ Failed to send FCM notification:', notificationError);
            }
            await sendNotification(booking.fcmToken, notificationData.title, notificationData?.body);
        }

        return res.status(200).json({
            success: true,
            message: 'Prescription added successfully.',
            data: booking.prescription,
        });

    } catch (error) {
        console.error("❌ Error in addPrescriptions:", error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while adding prescription.',
        });
    }
};


exports.invalidateConsultationCache = async (petId, redisClient) => {
    try {
        if (petId && redisClient) {
            const cacheKey = `user:${petId}:consultations`;
            await redisClient.del(cacheKey);
            console.log(`Cache invalidated for user ${petId}`);
        }
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
};