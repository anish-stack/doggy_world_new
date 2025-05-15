const LabBooking = require("../../models/LabsTest/LabBooking");
const mongoose = require('mongoose');
const sendNotification = require("../../utils/sendNotification");
const SettingsModel = require("../../models/Settings/Settings.model");
const dayjs = require('dayjs');
const { getIndiaDay } = require("../../utils/GetIndiaDay");

exports.BookingOfLabTest = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      date,
      search,
      status,
      bookingType,
      clinic,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;


    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);


    const query = {};

    // Date filter
    if (date) {
      query.selectedDate = date;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Booking type filter
    if (bookingType) {
      query.bookingType = bookingType;
    }

    // Clinic filter
    if (clinic) {
      query.clinic = clinic;
    }


    if (search) {
      query.$or = [
        { bookingRef: { $regex: search, $options: 'i' } },

      ];

      // If search might be an ObjectId (for pet or other relations)
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ pet: search });
        query.$or.push({ _id: search });
      }
    }


    const skip = (pageNum - 1) * limitNum;

    const totalBookings = await LabBooking.countDocuments(query);

    const bookings = await LabBooking.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limitNum)
      .populate('pet', 'petname petOwnertNumber')
      .populate('Address')
      .populate('labTests', 'mainImage title price discount_price home_price_of_package home_price_of_package_discount') // Populate lab test details
      .populate('clinic', 'clinicName address')
      .populate('payment', 'forWhat amount  razorpay_payment_id payment_status'); // Populate payment info

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalBookings / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;


    return res.status(200).json({
      success: true,
      message: 'Lab test bookings fetched successfully',
      data: {
        bookings,
        pagination: {
          totalBookings,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          date,
          status,
          bookingType,
          clinic,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error fetching lab test bookings:', error);

    // Check if error is validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if error is cast error (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path} format`,
        code: 'INVALID_ID_FORMAT'
      });
    }

    // Default error response
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch lab test bookings',
      error: error.message,
      code: 'SERVER_ERROR'
    });
  }
};



exports.SingleBookingOfLabTest = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate `id`
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing booking ID.',
        code: 'INVALID_ID',
      });
    }

    // Fetch booking by ID
    const booking = await LabBooking.findById(id)
      .populate('pet', 'petname petOwnertNumber')
      .populate('Address')
      .populate('labTests', 'mainImage title price discount_price home_price_of_package home_price_of_package_discount')
      .populate('clinic', 'clinicName address')
      .populate('payment', 'forWhat amount razorpay_payment_id payment_status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Lab test booking not found.',
        code: 'NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lab test booking fetched successfully.',
      data: {
        booking,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching lab test booking:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error occurred.',
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid format for ${error.path}.`,
        code: 'CAST_ERROR',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
      code: 'SERVER_ERROR',
    });
  }
};



exports.CancelBookingOfLabTest = async (req, res) => {
  try {
    const { id, status = 'Cancelled' } = req.query;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing booking ID.',
        code: 'INVALID_ID',
      });
    }

    // Fetch booking by ID
    const booking = await LabBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Lab test booking not found.',
        code: 'NOT_FOUND',
      });
    }

    // Check if already in a final state
    const finalStatuses = ['Cancelled', 'Completed', 'Rescheduled'];
    if (finalStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking already marked as '${booking.status}'. Cannot update.`,
        code: 'ALREADY_FINALIZED',
      });
    }

    // Update the status
    booking.status = status;
    await booking.save();


    if (booking.fcmToken) {
      const notificationData = {
        title: 'Lab Test Booking Cancelled',
        body: 'Your booking has been cancelled. Refund will be processed within 2-3 working days.',
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
      message: `Booking status updated to '${status}' successfully.`,
      data: booking,
    });

  } catch (error) {
    console.error('❌ Error cancelling lab test booking:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error occurred.',
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid format for ${error.path}.`,
        code: 'CAST_ERROR',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
      code: 'SERVER_ERROR',
    });
  }
};
exports.RescheduleOfLabTest = async (req, res) => {
  try {
    const { id } = req.query;
    const { rescheduledDate, rescheduledTime, status, Address } = req.body;

    console.log("Reschedule Request Body:", req.body);

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing booking ID.',
        code: 'INVALID_ID',
      });
    }

    // Validate required fields
    if (!rescheduledDate || !rescheduledTime || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing reschedule date, time, or status.',
        code: 'MISSING_FIELDS',
      });
    }

    // Fetch booking by ID
    const booking = await LabBooking.findById(id).populate('Address');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Lab test booking not found.',
        code: 'NOT_FOUND',
      });
    }

    // Prevent rescheduling if already finalized
    const finalStatuses = ['Cancelled', 'Completed'];
    if (finalStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Booking is already marked as '${booking.status}' and cannot be rescheduled.`,
        code: 'ALREADY_FINALIZED',
      });
    }

    // Validate date is not in the past
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const rescheduleDateObj = new Date(rescheduledDate);
    rescheduleDateObj.setHours(0, 0, 0, 0);

    if (rescheduleDateObj < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book an appointment for a past date. Please select a future date.',
        code: 'PAST_DATE'
      });
    }

    // Get admin settings
    const AdminSettings = await SettingsModel.findOne();
    const labTestSettings = AdminSettings.labTestBookingTimes;

    // Check if booking is allowed on selected day
    const { name: dayName } = getIndiaDay(rescheduledDate);
    if (labTestSettings?.whichDayBookingClosed.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Bookings are closed on ${dayName}. Please select another date.`,
        code: 'DAY_CLOSED'
      });
    }

    // Construct time objects
    const businessHoursStart = dayjs(`${rescheduledDate} ${labTestSettings.start}`, 'YYYY-MM-DD HH:mm');
    const businessHoursEnd = dayjs(`${rescheduledDate} ${labTestSettings.end}`, 'YYYY-MM-DD HH:mm');
    const bookingTime = dayjs(`${rescheduledDate} ${rescheduledTime}`, 'YYYY-MM-DD HH:mm');

    // Check if time is within business hours
    if (bookingTime.isBefore(businessHoursStart) || bookingTime.isAfter(businessHoursEnd)) {
      return res.status(400).json({
        success: false,
        message: `The selected time is outside lab test hours (${labTestSettings.start} - ${labTestSettings.end}).`,
        code: 'OUTSIDE_HOURS'
      });
    }

    // Check if time is in disabled slots
    const isDisabledTime = labTestSettings.disabledTimeSlots.some(slot => {
      if (slot.type === 'single' && slot.time === rescheduledTime) {
        return true;
      }
      if (slot.type === 'range') {
        const rangeStart = dayjs(`${rescheduledDate} ${slot.start}`, 'YYYY-MM-DD HH:mm');
        const rangeEnd = dayjs(`${rescheduledDate} ${slot.end}`, 'YYYY-MM-DD HH:mm');
        return (
          bookingTime.isAfter(rangeStart) && bookingTime.isBefore(rangeEnd) ||
          bookingTime.isSame(rangeStart) || bookingTime.isSame(rangeEnd)
        );
      }
      return false;
    });

    if (isDisabledTime) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is not available for booking.',
        code: 'DISABLED_TIME_SLOT'
      });
    }

    // Validate time slot gap
    const minutesFromStart = bookingTime.diff(businessHoursStart, 'minute');
    if (minutesFromStart % labTestSettings.gapBetween !== 0) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid time slot. Appointments are scheduled every ${labTestSettings.gapBetween} minutes.`,
        code: 'INVALID_TIME_SLOT'
      });
    }

    // Check if slot is already full
    let existingBookings = await LabBooking.find({
      selectedDate: rescheduledDate,
      selectedTime: rescheduledTime,
      status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
    });

    // If no bookings found using selectedDate/selectedTime, check with rescheduledDate/rescheduledTime
    if (existingBookings.length === 0) {
      existingBookings = await LabBooking.find({
        rescheduledDate,
        rescheduledTime,
        status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
      });
    }


    if (existingBookings.length >= labTestSettings.perGapLimitBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is fully booked. Please select another time.',
        code: 'SLOT_FULL'
      });
    }

    // Update booking
    booking.rescheduledDate = rescheduledDate;
    booking.rescheduledTime = rescheduledTime;
    booking.status = status;

    if (Address) {
      booking.Address.street = Address.street
      booking.Address.city = Address.city
      booking.Address.state = Address.state
      booking.Address.zipCode = Address.zipCode
      await booking.Address.save()
    }

    await booking.save();

    // Send FCM notification if available
    if (booking.fcmToken) {
      const notificationData = {
        title: 'Lab Test Rescheduled',
        body: `Your lab test has been rescheduled to ${rescheduledDate} at ${rescheduledTime}.`,
      };

      try {
        await sendNotification(booking.fcmToken, notificationData.title, notificationData.body);
        console.log('✅ FCM reschedule notification sent successfully.');
      } catch (notificationError) {
        console.error('❌ Failed to send FCM notification:', notificationError);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Lab test booking rescheduled successfully.',
      data: booking,
    });

  } catch (error) {
    console.error('❌ Error during lab test reschedule:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error occurred.',
        errors: Object.values(error.errors).map(err => err.message),
        code: 'VALIDATION_ERROR',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid format for ${error.path}.`,
        code: 'CAST_ERROR',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      error: error.message,
      code: 'SERVER_ERROR',
    });
  }
};



exports.deleteBookingoflab = async (req, res) => {
  try {
    const { id } = req.params; // ✅ Corrected typo

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing booking ID.",
        code: "INVALID_ID",
      });
    }

    // Find and delete the booking
    const deletedBooking = await LabBooking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        message: "Lab booking not found.",
        code: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lab booking deleted successfully.",
      data: deletedBooking,
    });

  } catch (error) {
    console.error("❌ Error deleting lab booking:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
      code: "SERVER_ERROR",
    });
  }
};