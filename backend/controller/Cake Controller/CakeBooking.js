const CakeBooking = require("../../models/Cake Models/CakeBooking");
const CakeDesign = require("../../models/Cake Models/CakeDesign");
const CakeFlavours = require("../../models/Cake Models/CakeFlavours");
const CakeSize = require("../../models/Cake Models/CakeSizeSchema");
const AppError = require("../../utils/ApiError");
const Address = require("../../models/AddressModel/AddressModel");
const RazorpayUtils = require("../../utils/razorpayUtils");
const PaymentSchema = require("../../models/PaymentSchema/PaymentSchema");

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
        if (!address || !designId || !flavourId || !quantityId || !pet_details || !deliveryType || !deliveryDate || !totalAmount) {
            return next(new AppError("Missing required booking fields.", 400));
        }

        // ✅ Validate cake flavour
        const checkFlavour = await CakeFlavours.findById(flavourId);
        if (!checkFlavour || !checkFlavour.isActive) {
            return next(new AppError(`Booking not accepted for selected flavour.`, 400));
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
            pickupDate: deliveryType === 'pickup' ? deliveryDate : null,
            isPaid: false,
            couponApplied: couponId ? true : false,
            couponCode: couponCode || undefined,
            discountAmount: discount,
            subtotal: price,
            fcmToken,
            deliveredDate: deliveryType === 'delivery' ? deliveryDate : null,
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
                booking:newBooking?.orderNumber,
                currency: orderOptions.currency
            }

        });
    } catch (error) {
        console.error("Cake booking error:", error);
        return next(new AppError("Something went wrong while booking the cake.", 500));
    }
};
