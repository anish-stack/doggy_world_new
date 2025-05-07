const BookingConsultations = require("../../models/Consultations/BookingConsultations");
const RazorpayUtils = require("../../utils/razorpayUtils");
const Consultation = require('../../models/Consultations/Consulations');
const ConsultationDoctors = require("../../models/Consultations/ConsultationDoctors");
const AppError = require("../../utils/ApiError");
const PetRegister = require("../../models/petAndAuth/petregister");
const PaymentSchema = require("../../models/PaymentSchema/PaymentSchema");
const sendNotification = require("../../utils/sendNotification");
const { sendCustomeConulationEmail } = require("../../utils/sendEmail");
const sendConsultationComplete = require("../../utils/whatsapp/consultationMsg");

const razorpayUtils = new RazorpayUtils(
  process.env.RAZORPAY_KEY_ID,
  process.env.RAZORPAY_KEY_SECRET
);

exports.makeBookings = async (req, res) => {
  try {
    const { type, id, user, doctorId, period, date, time } = req.body;

    // Check if user exists
    const petExisting = await PetRegister.findOne({
      _id: user
    });

    if (!petExisting) {
      return res.status(401).json({
        success: false,
        message: 'Please login before booking any type of service'
      });
    }

    // Check if service is active
    const checkService = await Consultation.findOne({ _id: id });

    if (!checkService?.active) {
      return res.status(403).json({
        success: false,
        message: `We are not accepting ${checkService?.name} bookings at this time. Please try again shortly.`
      });
    }

    // Check if doctor is active
    const checkDoctor = await ConsultationDoctors.findOne({ _id: doctorId });

    if (checkDoctor?.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Doctor is not accepting any bookings at this time'
      });
    }

    const formattedDate = new Date(date).toISOString().split('T')[0];

    console.log(formattedDate);
    const checkNumberOfBookingsOnTheDate = await BookingConsultations.find({
      date: formattedDate,
      time,
      status: { $nin: ['Cancelled', 'Rescheduled'] },
    });
    console.log("checkNumberOfBookingsOnTheDate", checkNumberOfBookingsOnTheDate)

    if (checkNumberOfBookingsOnTheDate.length >= 5) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is fully booked. Please select another time.'
      });
    }

    // Calculate consultation price
    const price = checkDoctor.discount || 499;

    // Generate booking reference number
    const bookingRef = `CONS-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Razorpay payment order
    const paymentData = {
      amount: price,
      currency: 'INR',
      receipt: bookingRef,
      notes: {
        bookingType: type,
        userId: user,
        doctorId: doctorId,
        serviceId: id
      }
    };

    const paymentResult = await razorpayUtils.createPayment(paymentData);


    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: paymentResult.error
      });
    }
    const saveInPaymnet = await PaymentSchema.create({
      petid: user,
      razorpay_order_id: paymentResult?.order?.id,
      amount: paymentResult?.order?.amount,
      stauts: paymentResult?.order?.status
    })

    // Create booking record in pending state
    const newBooking = new BookingConsultations({
      consultationType: id,
      paymentDetails: saveInPaymnet?._id,
      pet: user,
      doctorId,
      period,
      date: formattedDate,
      time,
      bookingRef,
      status: 'Pending',

    });

    await newBooking.save();


    return res.status(201).json({
      success: true,
      message: 'Booking initiated successfully',
      data: {
        booking: newBooking,
        payment: {
          orderId: paymentResult.order.id,
          amount: price,
          key: paymentResult.key,
          bookingId: newBooking._id
        }
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while processing your booking',
      error: error.message
    });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      fcm
    } = req.body;

    console.log('Verifying payment:', req.body);

    // Step 1: Verify Razorpay signature
    const verificationResult = await razorpayUtils.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verificationResult.success || !verificationResult.verified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.error
      });
    }

    // Step 2: Find the booking
    const booking = await BookingConsultations.findById(bookingId)
      .populate('paymentDetails')
      .populate('consultationType')
      .populate('doctorId')
      .populate('pet');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Step 3: Update booking details
    booking.status = 'Confirmed';
    booking.paymentComplete = true;

    if (booking.paymentDetails) {
      booking.paymentDetails.razorpay_payment_id = razorpay_payment_id;
      booking.paymentDetails.payment_status = "paid";
      await booking?.paymentDetails.save();
    }

    booking.updatedAt = new Date();
    await booking.save();

    // Step 4: Send confirmation email
    const emailData = {
      consulationtype: booking?.consultationType?.name,
      date: booking?.date,
      petname: booking?.pet?.petname,
      bookingId: booking?.bookingRef,
      Payment: booking?.paymentDetails?.amount,
      time: booking?.time,
      whichDoctor: booking?.doctorId?.name,
      whenBookingDone: booking?.createdAt,
      ownerNumber: booking?.pet?.petOwnertNumber
    };

    await sendCustomeConulationEmail({ data: emailData });

    // Step 5: Send FCM notification to the user
    if (fcm) {
      const title = 'Booking Confirmed 🎉';
      const body = `Your consultation for ${booking?.consultationType?.name} with Dr. ${booking?.doctorId?.name} has been confirmed.`;


      try {
        await sendNotification(fcm, title, body);
        console.log('Notification sent successfully!');
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    } else {
      console.log('No FCM token found, skipping notification.');
    }

    const content = {
      name: booking?.pet?.petname,
      Date: booking?.date,
      time: booking?.time,
      doctorName: booking?.doctorId?.name,
      amount: booking?.paymentDetails?.amount
    }
    await sendConsultationComplete(booking?.pet?.petOwnertNumber, content)
    // Final response
    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: booking
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong during payment verification',
      error: error?.message || 'Internal server error'
    });
  }
};


// Webhook handler for Razorpay events
exports.handleWebhook = async (req, res) => {
  try {
    console.log("🔔 Webhook endpoint hit");

    const signature = req.headers['x-razorpay-signature'];
    console.log("📬 Received Signature:", signature);

    razorpayUtils.setWebhookSecret(process.env.RAZORPAY_WEBHOOK_SECRET);
    console.log("🔐 Webhook secret set");

    const isValid = await razorpayUtils.verifyWebhook(req.body, signature);
    console.log("✅ Webhook verification result:", isValid);

    if (!isValid) {
      console.warn("❌ Invalid webhook signature detected");
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    const razorpay_payment_id = payload.payment?.entity?.id;

    console.log("📦 Webhook Event:", event);
    console.log("💳 Razorpay Payment ID:", razorpay_payment_id);

    if (!razorpay_payment_id) {
      console.warn("⚠️ No payment ID found in payload");
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    // Step 1: Find the booking using razorpay_payment_id
    const allBookings = await BookingConsultations.find()
      .populate('paymentDetails')
      .populate('consultationType')
      .populate('doctorId')
      .populate('pet');

    const booking = allBookings.find(
      (item) => item?.paymentDetails?.razorpay_payment_id === razorpay_payment_id
    );

    if (!booking) {
      console.warn(`📭 No matching booking found for payment ID: ${razorpay_payment_id}`);
      return res.status(200).json({ success: true, message: 'Webhook received' }); // Don't retry
    }

    console.log(`✅ Booking found with ID: ${booking._id}`);

    // Step 2: Handle webhook event
    switch (event) {
      case 'payment.authorized':
        // Step 3: Update booking details
        booking.status = 'Confirmed';
        booking.paymentStatus = 'Paid';
        booking.paymentVerified = true;
        booking.paymentComplete = true;

        if (booking.paymentDetails) {
          booking.paymentDetails.razorpay_payment_id = razorpay_payment_id;
          booking.paymentDetails.payment_status = 'paid';
          await booking.paymentDetails.save();
          console.log("💰 Payment details updated");
        }

        booking.updatedAt = new Date();
        await booking.save();
        console.log("📘 Booking confirmed and saved");

        // Step 4: Send confirmation email
        const emailData = {
          consulationtype: booking?.consultationType?.name,
          date: booking?.date,
          petname: booking?.pet?.petname,
          bookingId: booking?.bookingRef,
          Payment: booking?.paymentDetails?.amount,
          time: booking?.time,
          whichDoctor: booking?.doctorId?.name,
          whenBookingDone: booking?.createdAt,
          ownerNumber: booking?.pet?.petOwnertNumber,
        };

        await sendCustomeConulationEmail({ data: emailData });
        console.log("📧 Confirmation email sent");

        // Step 5: Send FCM Notification
        const fcm = booking?.pet?.ownerFcmToken;
        if (fcm) {
          const title = 'Booking Confirmed 🎉';
          const body = `Your consultation for ${booking?.consultationType?.name} with Dr. ${booking?.doctorId?.name} has been confirmed.`;

          try {
            await sendNotification(fcm, title, body);
            console.log("📲 FCM notification sent successfully!");
          } catch (error) {
            console.error("⚠️ Error sending FCM notification:", error);
          }
        } else {
          console.log("🔕 No FCM token found, skipping notification.");
        }

        break;

      case 'payment.failed':
        booking.paymentStatus = 'Failed';
        booking.status = 'Payment Failed';
        booking.updatedAt = new Date();
        await booking.save();
        console.log("❌ Payment failed, booking updated.");
        break;

      case 'refund.processed':
        booking.paymentStatus = 'Refunded';
        booking.status = 'Cancelled';
        booking.updatedAt = new Date();
        await booking.save();
        console.log("🔁 Refund processed, booking cancelled.");
        break;

      default:
        console.log(`📌 Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('🚨 Webhook handling error:', error);
    return res.status(200).json({ success: true, message: 'Webhook received (error handled)' });
  }
};



// Get booking details
exports.getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await BookingConsultations.findById(bookingId)
      .populate('consultationId', 'name description price')
      .populate('doctorId', 'name specialization experience')
      .populate('petOwnerId', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving booking details',
      error: error.message
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await BookingConsultations.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (['Completed', 'Cancelled', 'Rescheduled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled as it is already ${booking.status.toLowerCase()}`
      });
    }

    // If payment was made, initiate refund
    if (booking.paymentStatus === 'Paid' && booking.paymentId) {
      const refundResult = await razorpayUtils.refundPayment(booking.paymentId);

      if (!refundResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund',
          error: refundResult.error
        });
      }

      booking.paymentStatus = 'Refund Initiated';
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    booking.updatedAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};




exports.getBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const booking = await BookingConsultations.findById(bookingId).populate('paymentDetails');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      status: booking.status,
      paymentStatus: booking.paymentDetails?.status,
      booking: booking
    });

  } catch (error) {
    console.error('Error fetching booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking status'
    });
  }
};