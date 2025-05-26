const BookingConsultations = require("../../models/Consultations/BookingConsultations");
const RazorpayUtils = require("../../utils/razorpayUtils");
const Consultation = require('../../models/Consultations/Consulations');
const ConsultationDoctors = require("../../models/Consultations/ConsultationDoctors");
const AppError = require("../../utils/ApiError");
const PetRegister = require("../../models/petAndAuth/petregister");
const PaymentSchema = require("../../models/PaymentSchema/PaymentSchema");
const LabtestProduct = require("../../models/LabsTest/LabSchema");
const LabTestBooking = require("../../models/LabsTest/LabBooking");
const BakeryAndShopBooking = require("../../models/commonBooking/BakeryAndShopBooking");

const sendNotification = require("../../utils/sendNotification");
const { sendCustomeConulationEmail, sendCustomePhysioEmail } = require("../../utils/sendEmail");
const sendConsultationComplete = require("../../utils/whatsapp/consultationMsg");
const VaccinationSchema = require("../../models/VaccinationSchema/VaccinationSchema");
const VaccinationBooking = require("../../models/VaccinationSchema/VaccinationBooking");
const ClinicRegister = require("../../models/ClinicRegister/ClinicRegister");
const dayjs = require('dayjs');
const SettingsModel = require("../../models/Settings/Settings.model");
const BookingPhysioModel = require("../../models/PhysioTherapy/BookingPhysio.model");
const sendPhysioComplete = require("../../utils/whatsapp/sendPhsiyoMessage");
const { sendEmail } = require("../../utils/emailUtility");
const CakeBooking = require("../../models/Cake Models/CakeBooking");
const { invalidateConsultationCache } = require("../Pet controller/PetOrdersControllers");
const EmailSendQueue = require("../../queues/EmailSendQueues");
const razorpayUtils = new RazorpayUtils(
  process.env.RAZORPAY_KEY_ID,
  process.env.RAZORPAY_KEY_SECRET
);

exports.makeBookings = async (req, res) => {
  try {
    const { type, id, user, doctorId, period, date, time, fcmToken } = req.body;

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
      amount: price * 100,
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
      fcmToken,
      status: 'Pending',

    });

    await newBooking.save();
    if (newBooking.pet) {
      const redis = req.app.get('redis');
      await invalidateConsultationCache(newBooking.pet, redis)

    }
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


exports.MakeABookingForlabTest = async (req, res) => {
  try {
    const user = req.user?.id;
    const {
      labTest,
      clinic,
      bookingType,
      selectedDate,
      selectedTime,
      bookingPart,
      address,
      couponCode,
      couponDiscount,
      totalPayableAmount,
      fcmToken
    } = req.body;
    console.log(req.body)

    // Validate required fields
    const requiredFields = [
      { field: 'labTest', message: 'Please select at least one test' },
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


    let labtestProduct = labTest;

    // Normalize to array if it's a string or comma-separated string
    if (typeof labtestProduct === 'string') {
      labtestProduct = labtestProduct.includes(',') ? labtestProduct.split(',') : [labtestProduct];
    }

    // Validate and collect active lab tests
    const selectedLabTests = [];

    for (const labId of labtestProduct) {
      const labTest = await LabtestProduct.findById(labId);

      if (!labTest) {
        return res.status(404).json({
          success: false,
          message: 'The selected lab test is not available. Please choose another lab test.',
          code: 'LAB_TEST_NOT_FOUND',
        });
      }

      if (!labTest.is_active) {
        return res.status(403).json({
          success: false,
          message: `${labTest.title} bookings are temporarily unavailable. Please try again later or contact support.`,
          code: 'LAB_TEST_INACTIVE',
        });
      }

      selectedLabTests.push(labTest._id); // Push only the ID
    }

    console.log(selectedLabTests)
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

    // Get admin settings for lab test bookings
    const AdminSettings = await SettingsModel.findOne();
    const labtTestSettings = AdminSettings.labTestBookingTimes;

    // Check if booking is allowed on the selected day
    const { name: dayName } = getIndiaDay(selectedDate);
    if (labtTestSettings?.whichDayBookingClosed.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Bookings are closed on ${dayName}. Please select another date.`,
        code: 'DAY_CLOSED'
      });
    }

    // Create time objects for validation
    const businessHoursStart = dayjs(`${selectedDate} ${labtTestSettings.start}`, 'YYYY-MM-DD HH:mm');
    const businessHoursEnd = dayjs(`${selectedDate} ${labtTestSettings.end}`, 'YYYY-MM-DD HH:mm');
    const bookingTime = dayjs(`${selectedDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm');

    // Check if selected time is within business hours
    if (bookingTime.isBefore(businessHoursStart) || bookingTime.isAfter(businessHoursEnd)) {
      return res.status(400).json({
        success: false,
        message: `The selected time is outside lab test hours (${labtTestSettings.start} - ${labtTestSettings.end}). Please select a time within operating hours.`,
        code: 'OUTSIDE_HOURS'
      });
    }

    // Check if selected time is in disabled time slots
    const isDisabledTime = labtTestSettings.disabledTimeSlots.some(slot => {
      if (slot.type === 'single' && slot.time === selectedTime) {
        return true;
      }

      if (slot.type === 'range') {
        const rangeStart = dayjs(`${selectedDate} ${slot.start}`, 'YYYY-MM-DD HH:mm');
        const rangeEnd = dayjs(`${selectedDate} ${slot.end}`, 'YYYY-MM-DD HH:mm');
        return bookingTime.isAfter(rangeStart) && bookingTime.isBefore(rangeEnd) ||
          bookingTime.isSame(rangeStart) ||
          bookingTime.isSame(rangeEnd);
      }

      return false;
    });

    if (isDisabledTime) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is not available for booking. Please select another time.',
        code: 'DISABLED_TIME_SLOT'
      });
    }

    // Validate time slot based on gap between and ensure it aligns with the gapBetween setting
    const minutesFromStart = bookingTime.diff(businessHoursStart, 'minute');
    if (minutesFromStart % labtTestSettings.gapBetween !== 0) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid time slot. Appointments are scheduled every ${labtTestSettings.gapBetween} minutes.`,
        code: 'INVALID_TIME_SLOT'
      });
    }

    // Find existing bookings for the selected time slot
    let existingBookings = await LabTestBooking.find({
      selectedDate,
      selectedTime,
      status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
    });

    // Check if time slot is fully booked
    if (existingBookings.length >= labtTestSettings.perGapLimitBooking) {
      return res.status(400).json({
        success: false,
        message: `This time slot is fully booked. Please select another time.`,
        code: 'SLOT_FULL'
      });
    }

    const bookingRef = `LAB-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Razorpay payment order with proper amount formatting
    try {
      const paymentData = {
        amount: Math.round(totalPayableAmount) * 100, // Convert to paise
        currency: 'INR',
        receipt: bookingRef,
        notes: {
          bookingType,
          userId: user,
          labtest: selectedLabTests.map(lab => lab.title).join(', '),
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
        forWhat: 'labtest',
        petid: user,
        razorpay_order_id: paymentResult?.order?.id,
        amount: paymentResult?.order?.amount,
        status: paymentResult?.order?.status
      });

      // Create booking record
      const newBooking = await LabTestBooking.create({
        labTests: selectedLabTests,
        clinic: bookingType === 'Clinic' ? clinic : null,
        bookingType,
        selectedDate,
        selectedTime,
        bookingPart,
        Address: address ? address : null,
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
        message: 'Your lab test appointment has been booked successfully!',
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
    console.error('Error in MakeABookingForlabTest:', error);

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

exports.MakeABookingForPhysio = async (req, res) => {
  try {
    const user = req.user?.id;
    const {
      physio,
      bookingType,
      selectedDate,
      selectedTime,
      couponCode,
      couponDiscount,
      totalPayableAmount,
      fcmToken
    } = req.body;


    // Validate required fields
    const requiredFields = [
      { field: 'physio', message: 'Please select at least one test' },
      { field: 'selectedDate', message: 'Please select an appointment date' },
      { field: 'selectedTime', message: 'Please select an appointment time' },
      { field: 'totalPayableAmount', message: 'Payment amount is required' }
    ];

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

    // Get admin settings for lab test bookings
    const AdminSettings = await SettingsModel.findOne();
    const physiotherapyBooking = AdminSettings.physiotherapyBookingTimes;

    const { name: dayName } = getIndiaDay(selectedDate);
    if (physiotherapyBooking?.whichDayBookingClosed.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Bookings are closed on ${dayName}. Please select another date.`,
        code: 'DAY_CLOSED'
      });
    }

    // Create time objects for validation
    const businessHoursStart = dayjs(`${selectedDate} ${physiotherapyBooking.start}`, 'YYYY-MM-DD HH:mm');
    const businessHoursEnd = dayjs(`${selectedDate} ${physiotherapyBooking.end}`, 'YYYY-MM-DD HH:mm');
    const bookingTime = dayjs(`${selectedDate} ${selectedTime}`, 'YYYY-MM-DD HH:mm');

    // Check if selected time is within business hours
    if (bookingTime.isBefore(businessHoursStart) || bookingTime.isAfter(businessHoursEnd)) {
      return res.status(400).json({
        success: false,
        message: `The selected time is outside lab test hours (${physiotherapyBooking.start} - ${physiotherapyBooking.end}). Please select a time within operating hours.`,
        code: 'OUTSIDE_HOURS'
      });
    }

    // Check if selected time is in disabled time slots
    const isDisabledTime = physiotherapyBooking.disabledTimeSlots.some(slot => {
      if (slot.type === 'single' && slot.time === selectedTime) {
        return true;
      }

      if (slot.type === 'range') {
        const rangeStart = dayjs(`${selectedDate} ${slot.start}`, 'YYYY-MM-DD HH:mm');
        const rangeEnd = dayjs(`${selectedDate} ${slot.end}`, 'YYYY-MM-DD HH:mm');
        return bookingTime.isAfter(rangeStart) && bookingTime.isBefore(rangeEnd) ||
          bookingTime.isSame(rangeStart) ||
          bookingTime.isSame(rangeEnd);
      }

      return false;
    });

    if (isDisabledTime) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is not available for booking. Please select another time.',
        code: 'DISABLED_TIME_SLOT'
      });
    }

    // Validate time slot based on gap between and ensure it aligns with the gapBetween setting
    const minutesFromStart = bookingTime.diff(businessHoursStart, 'minute');
    if (minutesFromStart % physiotherapyBooking.gapBetween !== 0) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid time slot. Appointments are scheduled every ${physiotherapyBooking.gapBetween} minutes.`,
        code: 'INVALID_TIME_SLOT'
      });
    }

    // Find existing bookings for the selected time slot
    let existingBookings = await BookingPhysioModel.find({
      date: selectedDate,  // Changed from selectedDate to match schema
      time: selectedTime,  // Changed from selectedTime to match schema
      status: { $nin: ['Cancelled', 'Rescheduled', 'Pending'] }
    });

    // Check if time slot is fully booked
    if (existingBookings.length >= physiotherapyBooking.perGapLimitBooking) {
      return res.status(400).json({
        success: false,
        message: `This time slot is fully booked. Please select another time.`,
        code: 'SLOT_FULL'
      });
    }

    const bookingRef = `PHYSIO-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Razorpay payment order with proper amount formatting
    try {
      const paymentData = {
        amount: Math.round(totalPayableAmount) * 100, // Convert to paise
        currency: 'INR',
        receipt: bookingRef,
        notes: {
          bookingType,
          userId: user,
          physio: physio,
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
        forWhat: 'physiothereapy',
        petid: user,
        razorpay_order_id: paymentResult?.order?.id,
        amount: paymentResult?.order?.amount,
        status: paymentResult?.order?.status
      });

      // Create booking record with the correct field names
      const newBooking = await BookingPhysioModel.create({
        physio: physio,
        date: selectedDate,
        time: selectedTime,
        couponCode,
        couponDiscount,
        totalPayableAmount,
        pet: user,
        bookingRef,
        paymentDetails: saveInPayment._id,
        status: 'Pending',
        fcmToken,
        bookingType
      });

      // Successful response
      return res.status(201).json({
        success: true,
        message: 'Your physiotherapy appointment has been booked successfully!', // Updated message
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
    console.error('Error in MakeABookingForPhysio:', error);  // Updated error log message

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
      case 'labtest':
        booking = await handlelabTestBooking(bookingId, razorpay_payment_id, booking?.fcmToken);
        break;
      case 'physiotherapy':
        booking = await handlePhysioBooking(bookingId, razorpay_payment_id, booking?.fcmToken);
        break;
      case 'petShopAndBakery':
        booking = await handleProductOrder(bookingId, razorpay_payment_id, booking?.fcmToken);
        break;
      case 'cakes':
        booking = await handleCakeOrder(bookingId, razorpay_payment_id, booking?.fcmToken);
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


  EmailSendQueue.add(
    {
      type: 'consultation',
      body: emailData
    },
    {
      delay: 50000 // 50 seconds
    }
  )
    .then(job => {
      console.log(`Job added with ID: ${job.id}`);
    })
    .catch(err => {
      console.error('Error adding job to queue:', err);
    });

  // await sendCustomeConulationEmail({ data: emailData });

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


async function handlePhysioBooking(bookingId, paymentId, fcm) {
  try {

    const booking = await BookingPhysioModel.findById(bookingId)
      .populate('paymentDetails physio pet');

    if (!booking) {
      throw new Error('Physiotherapy booking not found');
    }

    // Update booking status
    booking.status = 'Confirmed';
    booking.paymentComplete = true;
    booking.updatedAt = new Date();

    // Update payment details if available
    if (booking.paymentDetails) {
      booking.paymentDetails.razorpay_payment_id = paymentId;
      booking.paymentDetails.payment_status = "paid";
      await booking.paymentDetails.save();
    }

    // Save the updated booking
    await booking.save();

    // Prepare data for email notification
    const petName = booking.pet?.petname || 'your pet';
    const physioService = booking.physio?.title || 'physiotherapy session';
    const appointmentDate = booking.date ? new Date(booking.date).toLocaleDateString() : 'scheduled date';
    const appointmentTime = booking.time || 'scheduled time';

    const emailData = {
      PhysioType: physioService,
      date: appointmentDate,
      petname: petName,
      bookingId: booking.bookingRef,
      Payment: booking.paymentDetails?.amount / 100, // Convert from paise to rupees
      time: appointmentTime,
      whenBookingDone: booking.createdAt,
      ownerNumber: booking.pet?.petOwnertNumber
    };

    EmailSendQueue.add(
      {
        type: 'physio',
        body: emailData
      },
      {
        delay: 50000 // 50 seconds
      }
    )
      .then(job => {
        console.log(`Job added for physio with  ID: ${job.id}`);
      })
      .catch(err => {
        console.error('Error adding job to queue:', err);
      });
    // Send confirmation email
    // 

    // Send push notification if FCM token is available
    if (booking?.fcmToken) {
      const title = '🐾 Physiotherapy Appointment Confirmed';
      const body = `Great news! Your ${physioService} appointment for ${petName} on ${appointmentDate} at ${appointmentTime} has been confirmed. We look forward to helping your pet feel better!`;
      await safeSendNotification(booking?.fcmToken, title, body);
    }

    // Prepare and send SMS notification
    const smsContent = {
      name: petName,
      Date: appointmentDate,
      service: physioService,
      BookingId: booking.bookingRef,
      number: '91 9811299059'
    };

    await sendPhysioComplete(booking.pet?.petOwnertNumber, smsContent);

    return booking;
  } catch (error) {
    console.error('Error in handlePhysioBooking:', error);
    throw error; // Re-throw to let the caller handle it
  }
}
async function handleProductOrder(bookingId, paymentId, fcm) {
  try {
    // Find and populate the booking
    const booking = await BakeryAndShopBooking.findById(bookingId)
      .populate('paymentDetails')
      .populate('items.itemId')
      .populate('petId')
      .populate('deliveryInfo');

    if (!booking) {
      throw new Error('Shop booking not found');
    }

    // Update booking status
    booking.status = 'Confirmed';
    booking.paymentStatus = 'Completed';
    booking.isPaid = true;
    booking.fcmToken = fcm || booking.fcmToken; // Update FCM token if provided

    // Add to status history
    booking.statusHistory.push({
      status: 'Confirmed',
      timestamp: new Date(),
      note: `Order confirmed after payment ${paymentId}`
    });

    // Update payment details if available
    if (booking.paymentDetails) {
      booking.paymentDetails.razorpay_payment_id = paymentId;
      booking.paymentDetails.payment_status = "paid";
      await booking.paymentDetails.save();
    }

    // Save the updated booking
    await booking.save();

    // Generate email data
    const emailData = createOrderEmailData(booking);

    // Send email notification
    EmailSendQueue.add(
      {
        type: 'product',
        body: emailData
      },
      {
        delay: 50000 // 50 seconds
      }
    )
      .then(job => {
        console.log(`Job added for product with  ID: ${job.id}`);
      })
      .catch(err => {
        console.error('Error adding job to queue:', err);
      });


    // Send push notification if FCM token is available
    if (booking.fcmToken) {
      try {
        const notificationData = createNotificationData(booking);
        await safeSendNotification(
          booking.fcmToken,
          notificationData.title,
          notificationData.body
        );
        console.log(`Push notification sent for order: ${booking.orderNumber}`);
      } catch (notificationError) {
        console.error('Failed to send push notification:', notificationError);
        // Continue execution even if notification fails
      }
    }

    // Prepare and send SMS notification
    try {
      const smsContent = {
        name: booking.petId?.petname || 'your pet',
        Date: new Date(booking.deliveryDate).toLocaleDateString(),
        service: 'Product Order',
        BookingId: booking.orderNumber,
        number: '+91 9811299059'
      };

      await safeSendNotification(booking.fcmToken, 'Product Order', smsContent);
      console.log(`SMS notification sent for order: ${booking.orderNumber}`);
    } catch (smsError) {
      console.error('Failed to send SMS notification:', smsError);
      // Continue execution even if SMS fails
    }

    return booking;
  } catch (error) {
    console.error('Error in handleProductOrder:', error);
    throw new Error(`Failed to process product order: ${error.message}`);
  }
}
async function handleCakeOrder(bookingId, paymentId, fcm) {
  try {
    // Find and populate the booking
    const booking = await CakeBooking.findById(bookingId)
      .populate('paymentDetails')
      .populate('cakeDesign')
      .populate('cakeFlavor')
      .populate('clinic')
      .populate('size')
      .populate('pet')
      .populate('deliveryInfo');

    if (!booking) {
      throw new Error('Cake booking not found');
    }

    // Update booking status
    booking.bookingStatus = 'Confirmed';

    booking.isPaid = true;
    booking.fcmToken = fcm || booking.fcmToken;


    // Update payment details if available
    if (booking.paymentDetails) {
      booking.paymentDetails.razorpay_payment_id = paymentId;
      booking.paymentDetails.payment_status = "paid";
      await booking.paymentDetails.save();
    }


    await booking.save();

    // Generate email data
    const emailData = createCakeOrderEmailData(booking);

    // Send email notification
    EmailSendQueue.add(
      {
        type: 'product',
        body: emailData
      },
      {
        delay: 50000 // 50 seconds
      }
    )
      .then(job => {
        console.log(`Job added for product cake with  ID: ${job.id}`);
      })
      .catch(err => {
        console.error('Error adding job to queue:', err);
      });



    // Send push notification if FCM token is available
    if (booking.fcmToken) {
      try {
        const notificationData = createNotificationForCake(booking);
        await safeSendNotification(
          booking.fcmToken,
          notificationData.title,
          notificationData.body
        );
        console.log(`Push notification sent for order: ${booking._id}`);
      } catch (notificationError) {
        console.error('Failed to send push notification:', notificationError);
        // Continue execution even if notification fails
      }
    }


    return booking;
  } catch (error) {
    console.error('Error in handleProductOrder:', error);
    throw new Error(`Failed to process product order: ${error.message}`);
  }
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

  // Send email notification
  EmailSendQueue.add(
    {
      type: 'consultation',
      body: emailData
    },
    {
      delay: 50000 // 50 seconds
    }
  )
    .then(job => {
      console.log(`Job added for product cake with  ID: ${job.id}`);
    })
    .catch(err => {
      console.error('Error adding job to queue:', err);
    });
  // await sendCustomeConulationEmail({ data: emailData });

  if (booking?.fcmToken) {
    const title = 'Booking Confirmed 🎉';
    const body = `Your vaccination appointment for ${booking.vaccine?.title} has been confirmed. Thank you for your purchase! For any issues, please check the Booking section.`;
    await safeSendNotification(booking?.fcmToken, title, body);
  }

  return booking;
}


async function handlelabTestBooking(bookingId, paymentId, fcm) {

  const booking = await LabTestBooking.findById(bookingId)
    .populate('payment labTests clinic pet');

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

  // const emailData = {
  //   consulationtype: booking.vaccine?.title,
  //   date: new Date(booking.selectedDate).toLocaleDateString('en-us'),
  //   petname: booking.pet?.petname,
  //   bookingId: booking.bookingRef,
  //   Payment: booking.payment?.amount,
  //   time: booking.selectedTime,
  //   whenBookingDone: booking.createdAt,
  //   ownerNumber: booking.pet?.petOwnertNumber
  // };

  // await sendCustomeConulationEmail({ data: emailData });

  if (booking?.fcmToken) {
    const title = 'Booking Confirmed 🎉';
    const body = `Your lab test appointment has been confirmed. Thank you for your purchase! For any issues, please check the Booking section.`;
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

const createOrderEmailData = (booking) => {
  try {
    if (!booking) {
      throw new Error('Booking data is required for email creation');
    }

    // Extract pet information
    const petName = booking.petId?.petname || 'your pet';

    // Format delivery date
    const deliveryDate = booking.deliveryDate
      ? new Date(booking.deliveryDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : 'scheduled delivery date';

    // Format order items for email
    const itemsList = booking.items.map(item => {
      return {
        name: item.variantName || item.itemModel === 'petBakeryProduct' ? 'Bakery Item' : 'Shop Item',
        quantity: item.quantity,
        price: item.unitPrice.toFixed(2),
        subtotal: item.subtotal.toFixed(2)
      };
    });

    // Address formatting
    const deliveryAddress = booking.deliveryInfo ? `
      ${booking.deliveryInfo.addressLine1 || ''}
      ${booking.deliveryInfo.addressLine2 || ''}
      ${booking.deliveryInfo.city || ''}, ${booking.deliveryInfo.state || ''}, ${booking.deliveryInfo.pincode || ''}
    ` : 'Address information not available';

    // Compile email data
    const emailData = {
      to: 'anishjha896@gmail.com',
      subject: `Order Confirmation: ${booking.orderNumber}`,
      template: 'order-confirmation',
      data: {
        customerName: booking.petId?.petOwnerName || 'Valued Customer',
        petName: petName,
        orderNumber: booking.orderNumber,
        orderDate: new Date(booking.createdAt).toLocaleDateString(),
        deliveryDate: deliveryDate,
        items: itemsList,
        subtotal: booking.subtotal.toFixed(2),
        shippingFee: booking.shippingFee.toFixed(2),
        tax: booking.taxAmount.toFixed(2),
        discount: booking.discountAmount.toFixed(2),
        total: booking.totalAmount.toFixed(2),
        paymentMethod: booking.paymentMethod,
        deliveryAddress: deliveryAddress,
        specialInstructions: booking.specialInstructions || 'None provided',
        supportEmail: 'support@petstore.com',
        supportPhone: '+91 9811299059'
      }
    };

    return emailData;
  } catch (error) {
    console.error('Error creating email data:', error);
    // Return a basic email data object in case of error
    return {
      to: booking.petId?.petOwnerEmail,
      subject: `Order Confirmation: ${booking.orderNumber || 'New Order'}`,
      template: 'order-confirmation-basic',
      data: {
        orderNumber: booking.orderNumber || 'Not available',
        supportPhone: '+91 9811299059'
      }
    };
  }
};


const createCakeOrderEmailData = (booking) => {
  try {
    if (!booking) {
      throw new Error('Booking data is required for email creation');
    }

    // Determine event date based on type
    const isPickup = booking.type === 'Pickup At Store';
    const eventDateRaw = isPickup ? booking.pickupDate : booking.deliveredDate;

    const formattedEventDate = eventDateRaw
      ? new Date(eventDateRaw).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : 'scheduled date';

    // Address formatting
    const deliveryAddress = booking.deliveryInfo
      ? `
   
        ${booking?.deliveryInfo?.city || ''}, ${booking?.deliveryInfo?.street || ''}, ${booking?.deliveryInfo?.zipCode || ''}
      `
      : 'Address information not available';

    // Cake Details
    const cakeDetails = {
      design: booking.cakeDesign?.name || 'Custom Design',
      flavor: booking.cakeFlavor?.name || 'Selected Flavor',
      size: booking.size?.weight || 'Custom Size',
      quantity: booking.quantity || 1,
      pricePerCake: booking.size?.price?.toFixed(2) || '0.00',
      totalPrice: booking.totalAmount?.toFixed(2) || '0.00'
    };


    const emailData = {
      to: 'anishjha896@gmail.com' || 'customer@example.com',
      subject: `Cake Order Confirmation: ${booking.orderNumber}`,
      template: 'cake-order-confirmation',
      data: {
        customerName: 'Valued Customer',
        petName: booking.pet?.petname || 'your pet',
        orderNumber: booking.orderNumber,
        orderDate: new Date(booking.createdAt).toLocaleDateString('en-US'),
        type: booking.type,
        deliveryOrPickupDate: formattedEventDate,
        cakeDetails,
        subtotal: booking.subtotal?.toFixed(2) || '0.00',
        shippingFee: booking.shippingFee?.toFixed(2) || '0.00',
        tax: booking.taxAmount?.toFixed(2) || '0.00',
        discount: booking.discountAmount?.toFixed(2) || '0.00',
        total: booking.totalAmount?.toFixed(2) || '0.00',
        paymentMethod: 'Online' || 'N/A',
        deliveryAddress,
        specialInstructions: booking.petNameOnCake || 'None provided',
        supportEmail: 'support@petstore.com',
        supportPhone: '+91 9811299059'
      }
    };

    return emailData;
  } catch (error) {
    console.error('Error creating cake order email data:', error);
    return {
      to: booking?.petId?.petOwnerEmail || 'customer@example.com',
      subject: `Cake Order Confirmation: ${booking?.orderNumber || 'New Order'}`,
      template: 'cake-order-confirmation-basic',
      data: {
        orderNumber: booking?.orderNumber || 'Not available',
        supportPhone: '+91 9811299059'
      }
    };
  }
};



const createNotificationData = (booking) => {
  return {
    title: `Order Confirmed: ${booking.orderNumber}`,
    body: `Your order for ${booking.petId?.petname || 'your pet'} has been confirmed and will be delivered on ${new Date(booking.deliveryDate).toLocaleDateString()}.`
  };
};


const createNotificationForCake = (booking) => {
  const isPickup = booking.type === 'Pickup At Store';
  const date = isPickup ? booking.pickupDate : booking.deliveredDate;

  return {
    title: `Order Confirmed: ${booking.orderNumber}`,
    body: `Your order for ${booking.pet?.petname || 'your pet'} has been confirmed and will be ${isPickup ? 'ready for pickup' : 'delivered'
      } on ${new Date(date).toLocaleDateString()}.`
  };
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
    } else if (type === 'labtest') {
      booking = await LabTestBooking.findById(bookingId).populate('paymentDetails');
    } else if (type === 'physio') {
      booking = await BookingPhysioModel.findById(bookingId).populate('paymentDetails');
    } else if (type === 'petShopAndBakery') {
      booking = await BakeryAndShopBooking.findById(bookingId).populate('paymentDetails');
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





const getIndiaDay = (selectedDate) => {
  const date = new Date(selectedDate);

  // Get UTC time in milliseconds
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);

  // IST is UTC+5:30 => 5.5 hours * 60 * 60 * 1000 = 19800000 ms
  const istTime = new Date(utcTime + 19800000);

  const dayIndex = istTime.getDay(); // 0 (Sunday) to 6 (Saturday)
  const dayName = istTime.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });

  return { index: dayIndex, name: dayName };
};
