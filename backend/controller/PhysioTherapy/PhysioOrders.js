const BookingPhysioModel = require("../../models/PhysioTherapy/BookingPhysio.model");
const SettingsModel = require("../../models/Settings/Settings.model");
const { getIndiaDay } = require("../../utils/GetIndiaDay");
const dayjs = require('dayjs');
const sendNotification = require("../../utils/sendNotification");
const mongoose = require('mongoose');


exports.AllBookingsOfPhysio = async (req, res) => {
    try {
        const { date } = req.params;
        const dateForm = new Date(date).toISOString().split('T')[0];

        const BookingOfPhsyio = await BookingPhysioModel.find({
            date: dateForm
        });

        console.log('Booking of Phsyio', BookingOfPhsyio.length)


        res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: BookingOfPhsyio,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message,
        });
    }
};

exports.BookingsOfPhysio = async (req, res) => {
    try {
        const BookingOfPhsyio = await BookingPhysioModel.find()
            .populate({
                path: 'pet',
                select: 'petType petname petOwnertNumber petdob petbreed',
                populate: {
                    path: 'petType', // assuming petType is a reference inside Pet model
                    select: 'petType',  // choose fields from PetType model (optional)
                }
            })
            .populate('physio')
            .populate('paymentDetails')
            .sort({ createdAt: -1 });

        console.log('Booking of Physio:', BookingOfPhsyio.length);

        res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: BookingOfPhsyio,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message,
        });
    }
};


exports.BookingsMyOfPhysio = async (req, res) => {
    try {
        const petId = req.user.id
        const BookingOfPhsyio = await BookingPhysioModel.find({pet:petId})
            .populate({
                path: 'pet',
                select: 'petType petname petOwnertNumber petdob petbreed',
                populate: {
                    path: 'petType', // assuming petType is a reference inside Pet model
                    select: 'petType',  // choose fields from PetType model (optional)
                }
            })
            .populate('physio')
            .populate('paymentDetails')
            .sort({ createdAt: -1 });

        console.log('Booking of Physio:', BookingOfPhsyio.length);

        res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            data: BookingOfPhsyio,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message,
        });
    }
};


exports.SingleBookingOfPhysio = async (req, res) => {
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

        const BookingOfPhsyio = await BookingPhysioModel.findById(id)
            .populate({
                path: 'pet',
                select: 'petType petname petOwnertNumber petdob petbreed',
                populate: {
                    path: 'petType', // assuming petType is a reference inside Pet model
                    select: 'petType',  // choose fields from PetType model (optional)
                }
            })
            .populate('physio')
            .populate('paymentDetails')

        if (!BookingOfPhsyio) {
            return res.status(404).json({
                success: false,
                message: 'Physio booking not found.',
                code: 'NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Physio booking fetched successfully.',
            data: BookingOfPhsyio
        });

    } catch (error) {
        console.error('❌ Error fetching Physiotherapy  booking:', error);

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

exports.CancelBookingOfPhysio = async (req, res) => {
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
        const booking = await BookingPhysioModel.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Physio booking not found.',
                code: 'NOT_FOUND',
            });
        }

        // Check if already in a final state
        const finalStatuses = ['Cancelled', 'Completed'];
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
                title: 'Phyio Session Booking Cancelled',
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
        console.error('❌ Error cancelling Physiotherapy  booking:', error);

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

exports.deleteBookingofPhysio = async (req, res) => {
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
        const deletedBooking = await BookingPhysioModel.findByIdAndDelete(id);

        if (!deletedBooking) {
            return res.status(404).json({
                success: false,
                message: "Physio Booking not found.",
                code: "NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Physio Booking deleted successfully.",
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


exports.RescheduleOfPhysio = async (req, res) => {
    try {

        const { id, rescheduledDate, rescheduledTime, status } = req.body;

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
        if (!rescheduledDate || !rescheduledTime ) {
            return res.status(400).json({
                success: false,
                message: 'Missing reschedule date, time, or status.',
                code: 'MISSING_FIELDS',
            });
        }

        // Fetch booking by ID
        const booking = await BookingPhysioModel.findById(id)

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Physiotherapy  booking not found.',
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
        const physioTherapySettings = AdminSettings.physiotherapyBookingTimes;

        // Check if booking is allowed on selected day
        const { name: dayName } = getIndiaDay(rescheduledDate);
        if (physioTherapySettings?.whichDayBookingClosed.includes(dayName)) {
            return res.status(400).json({
                success: false,
                message: `Bookings are closed on ${dayName}. Please select another date.`,
                code: 'DAY_CLOSED'
            });
        }

        // Construct time objects
        const businessHoursStart = dayjs(`${rescheduledDate} ${physioTherapySettings.start}`, 'YYYY-MM-DD HH:mm');
        const businessHoursEnd = dayjs(`${rescheduledDate} ${physioTherapySettings.end}`, 'YYYY-MM-DD HH:mm');
        const bookingTime = dayjs(`${rescheduledDate} ${rescheduledTime}`, 'YYYY-MM-DD HH:mm');

        // Check if time is within business hours
        if (bookingTime.isBefore(businessHoursStart) || bookingTime.isAfter(businessHoursEnd)) {
            return res.status(400).json({
                success: false,
                message: `The selected time is outside Physiotherapy  hours (${physioTherapySettings.start} - ${physioTherapySettings.end}).`,
                code: 'OUTSIDE_HOURS'
            });
        }

        // Check if time is in disabled slots
        const isDisabledTime = physioTherapySettings.disabledTimeSlots.some(slot => {
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
        if (minutesFromStart % physioTherapySettings.gapBetween !== 0) {
            return res.status(400).json({
                success: false,
                message: `Please select a valid time slot. Appointments are scheduled every ${physioTherapySettings.gapBetween} minutes.`,
                code: 'INVALID_TIME_SLOT'
            });
        }

        // Check if slot is already full
        let existingBookings = await BookingPhysioModel.find({
            selectedDate: rescheduledDate,
            selectedTime: rescheduledTime,
            status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
        });

        // If no bookings found using selectedDate/selectedTime, check with rescheduledDate/rescheduledTime
        if (existingBookings.length === 0) {
            existingBookings = await BookingPhysioModel.find({
                rescheduledDate,
                rescheduledTime,
                status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
            });
        }


        if (existingBookings.length >= physioTherapySettings.perGapLimitBooking) {
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


        await booking.save();

        // Send FCM notification if available
        if (booking.fcmToken) {
            const notificationData = {
                title: 'Physio Rescheduled',
                body: `Your Physiotherapy  has been rescheduled to ${rescheduledDate} at ${rescheduledTime}.`,
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
            message: 'Physiotherapy  booking rescheduled successfully.',
            data: booking,
        });

    } catch (error) {
        console.error('❌ Error during Physiotherapy  reschedule:', error);

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


exports.updatePhyioStatus = async (req, res) => {
    try {
        const { status, id } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID and status are required',
            });
        }

        const updatedBooking = await BookingPhysioModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        )

        if (!updatedBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        const user = updatedBooking.fcmToken;

        if (user) {
            const message = {
                token: user,
                notification: {
                    title: 'Booking Status Updated',
                    body: `Your physio booking status has been updated to: ${status}`,
                },
                data: {
                    bookingId: id,
                    status,
                },
            };

            try {
                await sendNotification(message.token, message.notification.title, message.notification.body);
                console.log('FCM notification sent successfully');
            } catch (fcmError) {
                console.error('FCM notification error:', fcmError);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: updatedBooking,
        });

    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};


exports.AddAreviewToPhysio = async (req, res) => {
    try {
        const { rating, id, review } = req.body;

        console.log(req.body)

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID and status are required',
            });
        }

        const updatedBooking = await BookingPhysioModel.findByIdAndUpdate(
            id,
            { rating, review },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        const user = updatedBooking.fcmToken;

        if (user) {
            const message = {
                token: user,
                notification: {
                    title: 'Thank You for Your Feedback!',
                    body: 'We appreciate your review of your recent physio appointment.',
                },

            };

            try {
                await sendNotification(message.token, message.notification.title, message.notification.body);
                console.log('FCM notification sent successfully');
            } catch (fcmError) {
                console.error('FCM notification error:', fcmError);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: updatedBooking,
        });

    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message,
        });
    }
};