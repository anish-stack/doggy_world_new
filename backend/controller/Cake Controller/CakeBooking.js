const CakeBooking = require("../../models/Cake Models/CakeBooking");
const CakeDesign = require("../../models/Cake Models/CakeDesign");
const CakeFlavours = require("../../models/Cake Models/CakeFlavours");
const CakeSize = require("../../models/Cake Models/CakeSizeSchema");
const AppError = require("../../utils/ApiError");
const Address = require("../../models/AddressModel/AddressModel");
const RazorpayUtils = require("../../utils/razorpayUtils");
const PaymentSchema = require("../../models/PaymentSchema/PaymentSchema");
const sendNotification = require("../../utils/sendNotification");


const mongoose = require('mongoose')
const razorpayUtils = new RazorpayUtils(
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET
);

exports.makeBookingForCake = async (req, res, next) => {
    try {
        const {
            Same_Day_delivery,
            address,
            couponCode,
            couponId,
            discount = 0,
            deliveryCharge = 0,
            deliveryDate,
            deliveryType,
            design,
            designId,
            fcmToken,
            flavour,
            flavourId,
            petName,
            pet_details,
            price,
            quantity,
            quantityId,
            storeId,
            tax = 0,
            totalAmount,
        } = req.body;

        const petUserFromToken = req.user?.id;
        if (!petUserFromToken || petUserFromToken !== pet_details) {
            return next(new AppError("Please login to book a cake order.", 401));
        }

        // ✅ Validate required fields
        if (
            !address ||
            !designId ||
            !flavourId ||
            !quantityId ||
            !pet_details ||
            !deliveryType ||
            !deliveryDate ||
            !totalAmount
        ) {
            return next(new AppError("Missing required booking fields.", 400));
        }

        // ✅ Validate cake flavour
        const checkFlavour = await CakeFlavours.findById(flavourId);
        if (!checkFlavour || !checkFlavour.isActive) {
            return next(
                new AppError(`Booking not accepted for selected flavour.`, 400)
            );
        }

        // ✅ Validate cake size
        const checkSize = await CakeSize.findById(quantityId);
        if (!checkSize || !checkSize.isActive) {
            return next(new AppError(`Booking not accepted for selected size.`, 400));
        }

        // ✅ Validate cake design
        const checkDesign = await CakeDesign.findById(designId);
        if (!checkDesign) {
            return next(new AppError("Selected design is not available.", 404));
        }

        // ✅ Validate address
        const deliveryAddress = await Address.findById(address);
        if (!deliveryAddress) {
            return next(new AppError("Delivery address not found.", 404));
        }

        // ✅ Create Razorpay order
        const orderOptions = {
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `order_rcpt_${Date.now()}`,
            payment_capture: 1,
        };

        const razorpayOrder = await razorpayUtils.createPayment(orderOptions);
        if (!razorpayOrder?.order?.id) {
            return next(new AppError("Failed to create Razorpay order.", 500));
        }

        // ✅ Save payment in DB
        const savedPayment = await PaymentSchema.create({
            forWhat: "CakeOrder",
            petid: petUserFromToken,
            razorpay_order_id: razorpayOrder.order.id,
            amount: razorpayOrder.order.amount,
            status: razorpayOrder.order.status,
        });

        // ✅ Save CakeBooking in DB
        const newBooking = await CakeBooking.create({
            cakeDesign: designId,
            cakeFlavor: flavourId,
            size: quantityId,
            type: deliveryType === "delivery" ? "Delivery" : "Pickup At Store",
            clinic: storeId || undefined,
            pet: pet_details,
            bookingStatus: "Pending",
            petNameOnCake: petName || undefined,
            pickupDate: deliveryType === "pickup" ? deliveryDate : null,
            isPaid: false,
            couponApplied: couponId ? true : false,
            couponCode: couponCode || undefined,
            discountAmount: discount,
            subtotal: price,
            fcmToken,
            deliveredDate: deliveryType === "delivery" ? deliveryDate : null,
            taxAmount: tax,
            Same_Day_delivery,
            shippingFee: deliveryCharge,
            totalAmount: totalAmount,
            deliveryInfo: address,
            paymentDetails: savedPayment._id,
        });

        return res.status(201).json({
            success: true,
            message: "Cake order booked successfully.",
            booking: newBooking,
            payment: {
                razorpayOrderId: razorpayOrder.order.id,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
                amount: orderOptions.amount,
                bookingId: newBooking._id,
                booking: newBooking?.orderNumber,
                currency: orderOptions.currency,
            },
        });
    } catch (error) {
        console.error("Cake booking error:", error);
        return next(
            new AppError("Something went wrong while booking the cake.", 500)
        );
    }
};

exports.getAllCakeBooking = async (req, res) => {
    try {
        const Bookings = await CakeBooking.find()
            .populate("cakeDesign", "name image")
            .populate("cakeFlavor", "name")
            .populate("size", "price weight")
            .populate("clinic", "clinicName address")
            .populate("pet", "petname petOwnertNumber petdob petbreed")
            .populate("paymentDetails")
            .populate("deliveryInfo").sort({ createdAt: -1 });

        if (!Bookings || Bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No cake bookings found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "All cake bookings retrieved successfully.",
            data: Bookings,
        });

    } catch (error) {
        console.error("Error fetching cake bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching cake bookings.",
            error: error.message,
        });
    }
};


exports.getSingleCakeBooking = async (req, res) => {
    try {
        const { id } = req.query
        const Bookings = await CakeBooking.findById(id)
            .populate("cakeDesign", "name image")
            .populate("cakeFlavor", "name")
            .populate("size", "price weight")
            .populate("clinic", "clinicName address")
            .populate("pet", "petname petOwnertNumber petdob petbreed")
            .populate("paymentDetails")
            .populate("deliveryInfo");

        if (!Bookings) {
            return res.status(404).json({
                success: false,
                message: "No cake bookings found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "cake bookings retrieved successfully.",
            data: Bookings,
        });

    } catch (error) {
        console.error("Error fetching cake bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching cake bookings.",
            error: error.message,
        });
    }
};


exports.changeOrderStatus = async (req, res) => {
    try {
        const { id, status } = req.body;


        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Both "id" and "status" are required.',
            });
        }

        const ValidStatus = ['Pending', 'Confirmed', 'Cancelled', 'Dispatched', 'Delivered'];


        if (!ValidStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses are: ${ValidStatus.join(', ')}`,
            });
        }


        const booking = await CakeBooking.findById(id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Cake booking not found.',
            });
        }

        booking.bookingStatus = status;

        await booking.save();
        if (booking.fcmToken) {
            const title = `🎂 Cake Order ${status}`;
            let body = '';

            switch (status) {
                case 'Confirmed':
                    body = `Sweet news! 🍰 Your cake order is confirmed and baking magic has begun. We can’t wait for you to enjoy it!`;
                    break;
                case 'Dispatched':
                    body = `Your cake has left the kitchen! 🚚💨 It’s on its way to deliver sweetness to your doorstep. Get ready to celebrate!`;
                    break;
                case 'Delivered':
                    body = `Delivery complete! 🎉 Your cake has arrived safe and sweet. We hope it brings a big smile and even bigger joy!`;
                    break;
                case 'Cancelled':
                    body = `Oh no! 😞 Your cake order has been cancelled. If this wasn’t intended or you need help, we’re here for you. 🍰`;
                    break;
                default:
                    body = `Heads up! 📦 Your cake order status is now "${status}". Stay tuned for more delicious updates!`;
                    break;
            }

            try {
                await sendNotification(booking.fcmToken, title, body);
            } catch (err) {
                console.error('Error sending notification:', err);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Order status updated to "${status}".`,
            updatedBooking: booking,
        });

    } catch (error) {
        console.error("Error in changeOrderStatus:", error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating order status.',
            error: error.message,
        });
    }
};


exports.deleteCakeOrder = async (req, res) => {
    try {
        const { id } = req.params;


        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing order ID.',
            });
        }


        const deletedBooking = await CakeBooking.findByIdAndDelete(id);

        if (!deletedBooking) {
            return res.status(404).json({
                success: false,
                message: 'Cake order not found.',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cake order deleted successfully.',
            deletedBooking,
        });
    } catch (error) {
        console.error('Error deleting cake order:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting cake order.',
        });
    }
};