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
const VaccinationSchema = require("../../models/VaccinationSchema/VaccinationSchema");
const VaccinationBooking = require("../../models/VaccinationSchema/VaccinationBooking");
const ClinicRegister = require("../../models/ClinicRegister/ClinicRegister");
const dayjs = require('dayjs');
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
      amount: price * 1000,
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




exports.MakeABookingForVaccines = async (req, res) => {
  try {
    // Extract user and request data
    const user = req.user?.id;
    const {
      vaccine,
      clinic,
      bookingType,
      selectedDate,
      selectedTime,
      bookingPart,
      Address,
      couponCode,
      couponDiscount,
      totalPayableAmount,
      fcmToken
    } = req.body;

    // Validate required fields
    const requiredFields = [
      { field: 'vaccine', message: 'Please select a vaccine' },
      { field: 'bookingType', message: 'Please select a booking type' },
      { field: 'selectedDate', message: 'Please select an appointment date' },
      { field: 'selectedTime', message: 'Please select an appointment time' },
      { field: 'totalPayableAmount', message: 'Payment amount is required' }
    ];

    // Check if clinic is required based on booking type
    if (bookingType === 'Clinic') {
      requiredFields.push({ field: 'clinic', message: 'Please select a clinic' });
    }

    // Validate all required fields are present
    for (const { field, message } of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message,
          field
        });
      }
    }

    // Validate user is logged in
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please login again to continue.',
        code: 'SESSION_EXPIRED'
      });
    }

    // Verify pet owner exists
    const petExisting = await PetRegister.findOne({ _id: user });
    if (!petExisting) {
      return res.status(404).json({
        success: false,
        message: 'Pet profile not found. Please create a pet profile before booking a service.',
        code: 'PET_NOT_FOUND'
      });
    }

    // Check if selected vaccine exists and is active
    const checkService = await VaccinationSchema.findOne({ _id: vaccine });
    if (!checkService) {
      return res.status(404).json({
        success: false,
        message: 'The selected vaccine is not available. Please choose another vaccine.',
        code: 'VACCINE_NOT_FOUND'
      });
    }

    if (!checkService.is_active) {
      return res.status(403).json({
        success: false,
        message: `${checkService.title} bookings are temporarily unavailable. Please try again later or contact support.`,
        code: 'VACCINE_INACTIVE'
      });
    }

    // Check clinic details if it's a clinic booking
    let clinicDetails;
    if (bookingType === 'Clinic') {
      if (!clinic) {
        return res.status(400).json({
          success: false,
          message: 'Please select a clinic for your appointment.',
          code: 'CLINIC_REQUIRED'
        });
      }

      clinicDetails = await ClinicRegister.findById(clinic);
      if (!clinicDetails) {
        return res.status(404).json({
          success: false,
          message: 'The selected clinic is not available. Please choose another clinic.',
          code: 'CLINIC_NOT_FOUND'
        });
      }

      // Check if clinic is closed on selected date
      if (clinicDetails.anyCloseDate) {
        return res.status(400).json({
          success: false,
          message: 'The selected clinic is closed on this date. Please select another date or clinic.',
          code: 'CLINIC_CLOSED'
        });
      }
    }

    // Validate date is not in the past
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book an appointment for a past date. Please select a future date.',
        code: 'PAST_DATE'
      });
    }

    // Check availability for the selected date
    let checkNumberOfBookingsOnTheDate = await VaccinationBooking.find({
      selectedDate,
      status: { $nin: ['Cancelled', 'Rescheduled', 'Pending'] },
    });

    // Filter bookings based on clinic hours if clinic booking
    if (clinicDetails) {
      try {
        const open = dayjs(`${selectedDate} ${clinicDetails.openTime}`, 'YYYY-MM-DD HH:mm');
        const close = dayjs(`${selectedDate} ${clinicDetails.closeTime}`, 'YYYY-MM-DD HH:mm');
        const bookingTime = dayjs(`${selectedDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm');

        // Check if selected time is within clinic hours
        if (bookingTime.isBefore(open) || bookingTime.isAfter(close)) {
          return res.status(400).json({
            success: false,
            message: `The selected time is outside clinic hours (${clinicDetails.openTime} - ${clinicDetails.closeTime}). Please select a time within operating hours.`,
            code: 'OUTSIDE_HOURS'
          });
        }

        checkNumberOfBookingsOnTheDate = checkNumberOfBookingsOnTheDate.filter((item) => {
          const existingBookingTime = dayjs(`${selectedDate} ${item.selectedTime}`, 'YYYY-MM-DD HH:mm');
          return existingBookingTime.isAfter(open) && existingBookingTime.isBefore(close);
        });
      } catch (error) {
        console.error('Error parsing clinic hours:', error);
        // Continue with booking process even if time validation fails
      }
    }

    // Check if time slot is fully booked
    const MAX_BOOKINGS_PER_SLOT = 10;
    if (checkNumberOfBookingsOnTheDate.length >= MAX_BOOKINGS_PER_SLOT) {
      return res.status(400).json({
        success: false,
        message: `This time slot is fully booked. Please select another time or date.`,
        code: 'SLOT_FULL'
      });
    }

    // Generate booking reference number
    const bookingRef = `VACC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Razorpay payment order with proper amount formatting
    try {
      const paymentData = {
        amount: Math.round(totalPayableAmount) * 100, // Convert to paise
        currency: 'INR',
        receipt: bookingRef,
        notes: {
          bookingType,
          userId: user,
          vaccine: checkService.title || 'Vaccination',
          petName: petExisting.name || 'Pet'
        }
      };

      const paymentResult = await razorpayUtils.createPayment(paymentData);

      if (!paymentResult.success) {
        console.error('Payment creation failed:', paymentResult.error);
        return res.status(500).json({
          success: false,
          message: 'Unable to initialize payment. Please try again later.',
          code: 'PAYMENT_INIT_FAILED'
        });
      }

      // Save payment record
      const saveInPayment = await PaymentSchema.create({
        forWhat: 'vaccine',
        petid: user,
        razorpay_order_id: paymentResult?.order?.id,
        amount: paymentResult?.order?.amount,
        status: paymentResult?.order?.status
      });

      // Create booking record
      const newBooking = await VaccinationBooking.create({
        vaccine,
        clinic: bookingType === 'Clinic' ? clinic : null,
        bookingType,
        selectedDate,
        selectedTime,
        bookingPart,
        Address,
        couponCode,
        couponDiscount,
        totalPayableAmount,
        pet: user,
        bookingRef,
        payment: saveInPayment._id,
        status: 'Pending',
        fcmToken
      });



      // Successful response
      return res.status(201).json({
        success: true,
        message: 'Your vaccination appointment has been booked successfully!',
        data: {
          booking: newBooking,
          payment: {
            orderId: paymentResult.order.id,
            amount: totalPayableAmount,
            key: paymentResult.key,
            bookingId: newBooking._id
          }
        }
      });

    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed. Please try again or contact support.',
        code: 'PAYMENT_PROCESSING_ERROR'
      });
    }

  } catch (error) {
    console.error('Error in MakeABookingForVaccines:', error);

    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Please check your input and try again.',
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
    }

    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This appointment has already been booked. Please try with different details.',
        code: 'DUPLICATE_BOOKING'
      });
    }

    // Default error response
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while booking your appointment. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}






exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      type,
      fcm
    } = req.body;

    console.log('[Payment] Verifying payment with details:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      type,
      fcm
    });

    // Step 1: Verify Razorpay Signature
    const verificationResult = await razorpayUtils.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verificationResult.success || !verificationResult.verified) {
      console.error('[Payment] Signature verification failed:', verificationResult.error);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.error
      });
    }

    let booking = null;

    switch (type) {
      case 'consultation':
        booking = await handleConsultationBooking(bookingId, razorpay_payment_id, fcm);
        break;

      case 'vaccine':
        booking = await handleVaccineBooking(bookingId, razorpay_payment_id, booking?.fcmToken);
        break;

      default:
        console.warn('[Payment] Unknown booking type:', type);
        return res.status(400).json({
          success: false,
          message: 'Invalid booking type'
        });
    }

    console.log('[Payment] Booking confirmed and payment processed for:', type);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: booking
    });

  } catch (error) {
    console.error('[Payment] Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong during payment verification',
      error: error?.message || 'Internal server error'
    });
  }
};

// ----------------------
// Helper Functions
// ----------------------

async function handleConsultationBooking(bookingId, paymentId, fcm) {
  const booking = await BookingConsultations.findById(bookingId)
    .populate('paymentDetails consultationType doctorId pet');

  if (!booking) throw new Error('Consultation booking not found');

  booking.status = 'Confirmed';
  booking.paymentComplete = true;
  booking.updatedAt = new Date();

  if (booking.paymentDetails) {
    booking.paymentDetails.razorpay_payment_id = paymentId;
    booking.paymentDetails.payment_status = "paid";
    await booking.paymentDetails.save();
  }

  await booking.save();

  // Email data
  const emailData = {
    consulationtype: booking.consultationType?.name,
    date: booking.date,
    petname: booking.pet?.petname,
    bookingId: booking.bookingRef,
    Payment: booking.paymentDetails?.amount,
    time: booking.time,
    whichDoctor: booking.doctorId?.name,
    whenBookingDone: booking.createdAt,
    ownerNumber: booking.pet?.petOwnertNumber
  };

  await sendCustomeConulationEmail({ data: emailData });

  if (fcm) {
    const title = 'Booking Confirmed 🎉';
    const body = `Your consultation for ${booking.consultationType?.name} with Dr. ${booking.doctorId?.name} has been confirmed.`;
    await safeSendNotification(fcm, title, body);
  }

  const smsContent = {
    name: booking.pet?.petname,
    Date: booking.date,
    time: booking.time,
    doctorName: booking.doctorId?.name,
    amount: booking.paymentDetails?.amount
  };

  await sendConsultationComplete(booking.pet?.petOwnertNumber, smsContent);

  return booking;
}

async function handleVaccineBooking(bookingId, paymentId, fcm) {

  const booking = await VaccinationBooking.findById(bookingId)
    .populate('payment vaccine clinic pet');

  if (!booking) throw new Error('Vaccine booking not found');

  booking.status = 'Confirmed';
  booking.paymentComplete = true;
  booking.updatedAt = new Date();

  if (booking.payment) {
    booking.payment.razorpay_payment_id = paymentId;
    booking.payment.payment_status = "paid";
    await booking.payment.save();
  }

  await booking.save();

  const emailData = {
    consulationtype: booking.vaccine?.title,
    date: new Date(booking.selectedDate).toLocaleDateString('en-us'),
    petname: booking.pet?.petname,
    bookingId: booking.bookingRef,
    Payment: booking.payment?.amount,
    time: booking.selectedTime,
    whenBookingDone: booking.createdAt,
    ownerNumber: booking.pet?.petOwnertNumber
  };

  await sendCustomeConulationEmail({ data: emailData });

  if (booking?.fcmToken) {
    const title = 'Booking Confirmed 🎉';
    const body = `Your vaccination appointment for ${booking.vaccine?.title} has been confirmed. Thank you for your purchase! For any issues, please check the Booking section.`;
    await safeSendNotification(booking?.fcmToken, title, body);
  }

  return booking;
}

async function safeSendNotification(fcmToken, title, body) {
  try {
    await sendNotification(fcmToken, title, body);
    console.log('[FCM] Notification sent successfully');
  } catch (error) {
    console.error('[FCM] Error sending notification:', error.message);
  }
}


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
    const { bookingId, type } = req.params;

    if (!bookingId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and type are required'
      });
    }

    let booking;

    if (type === 'Consultations') {
      booking = await BookingConsultations.findById(bookingId).populate('paymentDetails');
    } else if (type === 'vaccine') {
      booking = await VaccinationBooking.findById(bookingId).populate('paymentDetails');
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type'
      });
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      success: true,
      status: booking.status,
      paymentStatus: booking.paymentDetails?.status || 'Not Available',
      booking
    });

  } catch (error) {
    console.error('Error fetching booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking status',
      error: error.message
    });
  }
};
