const VaccinationBooking = require("../../models/VaccinationSchema/VaccinationBooking");
const Schedule = require("../../models/VaccinationSchema/VaccinedSchedule");
const mongoose = require('mongoose');
const sendNotification = require("../../utils/sendNotification");
const SettingsModel = require("../../models/Settings/Settings.model");
const dayjs = require('dayjs');
const { getIndiaDay } = require("../../utils/GetIndiaDay");

exports.getAllBookingsVaccination = async (req, res) => {
    try {
        const bookings = await VaccinationBooking.find()
            .populate({
                path: 'pet',
                select: 'petType petname petOwnertNumber petdob petbreed',
                populate: {
                    path: 'petType',
                    select: 'petType',
                }
            })
            .populate('vaccine', '-image -small_desc -desc -WhichTypeOfvaccinations')
            .populate('clinic', 'clinicName address')

            .populate('nextScheduledVaccination')
            .populate('Address')
            .populate('payment', 'razorpay_order_id razorpay_payment_id amount payment_status')
            .sort({ createdAt: -1 });

        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No vaccination bookings found',
                data: [],
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vaccination bookings fetched successfully',
            data: bookings,
        });

    } catch (error) {
        console.error('Error fetching vaccination bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vaccination bookings',
            error: error.message,
        });
    }
};

exports.SingleBookingOfVaccination = async (req, res) => {
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

        // Fetch booking by ID - Fixed to correctly filter by ID
        const booking = await VaccinationBooking.findById(id)
            .populate({
                path: 'pet',
                select: 'petType petname petOwnertNumber petdob petbreed',
                populate: {
                    path: 'petType',
                    select: 'petType',
                }
            })
            .populate('vaccine',)
            .populate('nextScheduledVaccination')
            .populate('Address')
            .populate('payment');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination booking not found.',
                code: 'NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Vaccination booking fetched successfully.',
            data: booking
        });

    } catch (error) {
        console.error('❌ Error fetching Vaccination booking:', error);

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
exports.deleteBookingOfVaccination = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing booking ID.",
                code: "INVALID_ID",
            });
        }

        // Find and delete the booking
        const deletedBooking = await VaccinationBooking.findByIdAndDelete(id);

        if (!deletedBooking) {
            return res.status(404).json({
                success: false,
                message: "Vaccination Booking not found.",
                code: "NOT_FOUND",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Vaccination Booking deleted successfully.",
            data: deletedBooking,
        });

    } catch (error) {
        console.error("❌ Error deleting Vaccination booking:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
            code: "SERVER_ERROR",
        });
    }
};

exports.CancelBookingOfVaccination = async (req, res) => {
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
        const booking = await VaccinationBooking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination booking not found.',
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
                title: 'Vaccination Session Booking Cancelled',
                body: 'Your booking has been cancelled. Refund will be processed within 2-3 working days.',
            };

            try {
                await sendNotification(booking.fcmToken, notificationData.title, notificationData?.body);
                console.log('✅ FCM notification sent successfully.');
            } catch (notificationError) {
                console.error('❌ Failed to send FCM notification:', notificationError);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Booking status updated to '${status}' successfully.`,
            data: booking,
        });

    } catch (error) {
        console.error('❌ Error cancelling Vaccination booking:', error);

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

exports.addNextScheduled = async (req, res) => {
    try {
        const { schedule = [], whichOrderId, scheduleId, action = 'add', scheduleItemId, updatedScheduleItem } = req.body;

        // Basic validation - just check if order ID exists
        if (!whichOrderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        // Find booking
        const findBooking = await VaccinationBooking.findById(whichOrderId);
        if (!findBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
            });
        }

        let scheduleDoc;

        // Handle ADD action
        if (action === 'add') {
            // Check if schedule already exists for this order
            if (findBooking.nextScheduledVaccination) {
                // Schedule exists, append to it
                scheduleDoc = await Schedule.findById(findBooking.nextScheduledVaccination);
                
                if (scheduleDoc) {
                    // Add new items to existing schedule
                    schedule.forEach(newItem => {
                        // Check if this is a duplicate entry
                        const isDuplicate = scheduleDoc.schedule.some(existingItem => 
                            existingItem.date === newItem.date && 
                            existingItem.vaccines === newItem.vaccines
                        );
                        
                        // Only add if not a duplicate
                        if (!isDuplicate) {
                            scheduleDoc.schedule.push({
                                date: newItem.date,
                                time: newItem.time || '',
                                vaccines: newItem.vaccines,
                                status: newItem.status || 'Pending',
                                notes: newItem.notes || ''
                            });
                        }
                    });
                    
                    await scheduleDoc.save();
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Schedule updated successfully',
                        data: scheduleDoc,
                    });
                }
            }
            
            // If no existing schedule, check if there's another schedule with the same whichOrderId
            scheduleDoc = await Schedule.findOne({ whichOrderId });
            
            if (scheduleDoc) {
                // Found existing schedule document with this whichOrderId
                // Add new items to it
                schedule.forEach(newItem => {
                    // Check if this is a duplicate entry
                    const isDuplicate = scheduleDoc.schedule.some(existingItem => 
                        existingItem.date === newItem.date && 
                        existingItem.vaccines === newItem.vaccines
                    );
                    
                    // Only add if not a duplicate
                    if (!isDuplicate) {
                        scheduleDoc.schedule.push({
                            date: newItem.date,
                            time: newItem.time || '',
                            vaccines: newItem.vaccines,
                            status: newItem.status || 'Pending',
                            notes: newItem.notes || ''
                        });
                    }
                });
                
                await scheduleDoc.save();
                
                // Make sure booking is linked to this schedule
                if (!findBooking.nextScheduledVaccination) {
                    findBooking.nextScheduledVaccination = scheduleDoc._id;
                    await findBooking.save();
                }
                
                return res.status(200).json({
                    success: true,
                    message: 'Schedule updated successfully',
                    data: scheduleDoc,
                });
            }
            
            // If still no existing schedule, create new one
            scheduleDoc = new Schedule({ 
                schedule: schedule.map(item => ({
                    date: item.date,
                    time: item.time || '',
                    vaccines: item.vaccines,
                    status: item.status || 'Pending',
                    notes: item.notes || ''
                })),
                whichOrderId 
            });
            
            await scheduleDoc.save();
            
            // Link schedule to booking
            findBooking.nextScheduledVaccination = scheduleDoc._id;
            await findBooking.save();

        // Handle UPDATE action
        } else if (action === 'update') {
            // Find existing schedule document
            if (!scheduleId) {
                scheduleId = findBooking.nextScheduledVaccination;
            }
            
            scheduleDoc = await Schedule.findById(scheduleId);
            if (!scheduleDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found',
                });
            }

            // Find and update the specific item
            if (scheduleItemId && updatedScheduleItem) {
                const itemIndex = scheduleDoc.schedule.findIndex(item => 
                    item._id.toString() === scheduleItemId
                );
                
                if (itemIndex === -1) {
                    return res.status(404).json({
                        success: false,
                        message: 'Schedule item not found',
                    });
                }

                // Update the item with all provided fields
                scheduleDoc.schedule[itemIndex] = {
                    ...scheduleDoc.schedule[itemIndex]._doc,
                    ...updatedScheduleItem,
                    // Ensure these fields are saved correctly
                    time: updatedScheduleItem.time || scheduleDoc.schedule[itemIndex].time || '',
                    notes: updatedScheduleItem.notes || scheduleDoc.schedule[itemIndex].notes || ''
                };
            }

            await scheduleDoc.save();
            
            return res.status(200).json({
                success: true,
                message: 'Schedule updated successfully',
                data: scheduleDoc,
            });

        // Handle DELETE action
        } else if (action === 'delete') {
            // Find existing schedule document
            if (!scheduleId) {
                scheduleId = findBooking.nextScheduledVaccination;
            }
            
            scheduleDoc = await Schedule.findById(scheduleId);
            if (!scheduleDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Schedule not found',
                });
            }

            // Delete specific item if scheduleItemId is provided
            if (scheduleItemId) {
                const originalLength = scheduleDoc.schedule.length;
                scheduleDoc.schedule = scheduleDoc.schedule.filter(item => 
                    item._id.toString() !== scheduleItemId
                );

                // If no items were removed
                if (scheduleDoc.schedule.length === originalLength) {
                    return res.status(404).json({
                        success: false,
                        message: 'Schedule item not found',
                    });
                }

                // If no schedule items left, delete the whole schedule
                if (scheduleDoc.schedule.length === 0) {
                    await Schedule.findByIdAndDelete(scheduleId);
                    
                    // Unlink from booking
                    findBooking.nextScheduledVaccination = null;
                    await findBooking.save();
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Schedule deleted (now empty)',
                        data: null,
                    });
                }

                await scheduleDoc.save();
                
                return res.status(200).json({
                    success: true,
                    message: 'Schedule item deleted successfully',
                    data: scheduleDoc,
                });
            } else {
                // Delete entire schedule
                await Schedule.findByIdAndDelete(scheduleId);
                
                // Unlink from booking
                findBooking.nextScheduledVaccination = null;
                await findBooking.save();
                
                return res.status(200).json({
                    success: true,
                    message: 'Entire schedule deleted',
                    data: null,
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be add, update, or delete',
            });
        }

        // Return the created schedule for 'add' action
        return res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            data: scheduleDoc,
        });

    } catch (error) {
        console.error('Error in addNextScheduled:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Error managing vaccination schedule',
            error: error.message
        });
    }
};

exports.AddAreviewToVaccination = async (req, res) => {
    try {
        const { rating, id, review } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Valid booking ID is required',
                code: 'INVALID_ID',
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating is required and must be between 1 and 5',
                code: 'INVALID_RATING',
            });
        }

        const updatedBooking = await VaccinationBooking.findByIdAndUpdate(
            id,
            { bookingRating: rating, review, hasRated: true },
            { new: true }
        );


        if (!updatedBooking) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination booking not found',
                code: 'BOOKING_NOT_FOUND',
            });
        }

        const user = updatedBooking.fcmToken;

        if (user) {
            const notificationData = {
                title: 'Thank You for Your Feedback!',
                body: 'We appreciate your review of your recent vaccination appointment.',
            };

            try {
                await sendNotification(user, notificationData.title, notificationData.body);
                console.log('✅ FCM notification sent successfully');
            } catch (fcmError) {
                console.error('❌ FCM notification error:', fcmError);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Review added successfully',
            data: updatedBooking,
        });

    } catch (error) {
        console.error('❌ Update error:', error);

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
            message: 'Something went wrong while adding review',
            error: error.message,
            code: 'SERVER_ERROR',
        });
    }
};

exports.RescheduleOfVaccinationBooking = async (req, res) => {
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
        if (!rescheduledDate || !rescheduledTime || !status) {
            return res.status(400).json({
                success: false,
                message: 'Missing reschedule date, time, or status.',
                code: 'MISSING_FIELDS',
            });
        }

        // Fetch booking by ID
        const booking = await VaccinationBooking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Vaccination booking not found.',
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

        // Fallback handling if settings not found
        if (!AdminSettings || !AdminSettings.vaccinationBookingTimes) {
            return res.status(500).json({
                success: false,
                message: 'Vaccination settings not found. Please contact administrator.',
                code: 'SETTINGS_NOT_FOUND'
            });
        }

        const VaccinationSettings = AdminSettings.vaccinationBookingTimes;

        // Check if booking is allowed on selected day
        const { name: dayName } = getIndiaDay(rescheduledDate);
        if (VaccinationSettings?.whichDayBookingClosed?.includes(dayName)) {
            return res.status(400).json({
                success: false,
                message: `Bookings are closed on ${dayName}. Please select another date.`,
                code: 'DAY_CLOSED'
            });
        }

        // Construct time objects
        const businessHoursStart = dayjs(`${rescheduledDate} ${VaccinationSettings.start}`, 'YYYY-MM-DD HH:mm');
        const businessHoursEnd = dayjs(`${rescheduledDate} ${VaccinationSettings.end}`, 'YYYY-MM-DD HH:mm');
        const bookingTime = dayjs(`${rescheduledDate} ${rescheduledTime}`, 'YYYY-MM-DD HH:mm');

        // Check if time is within business hours
        if (bookingTime.isBefore(businessHoursStart) || bookingTime.isAfter(businessHoursEnd)) {
            return res.status(400).json({
                success: false,
                message: `The selected time is outside vaccination hours (${VaccinationSettings.start} - ${VaccinationSettings.end}).`,
                code: 'OUTSIDE_HOURS'
            });
        }

        // Check if time is in disabled slots
        if (Array.isArray(VaccinationSettings.disabledTimeSlots)) {
            const isDisabledTime = VaccinationSettings.disabledTimeSlots.some(slot => {
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
        }

        // Validate time slot gap
        const minutesFromStart = bookingTime.diff(businessHoursStart, 'minute');
        if (minutesFromStart % VaccinationSettings.gapBetween !== 0) {
            return res.status(400).json({
                success: false,
                message: `Please select a valid time slot. Appointments are scheduled every ${VaccinationSettings.gapBetween} minutes.`,
                code: 'INVALID_TIME_SLOT'
            });
        }

        // Check if slot is already full
        let existingBookings = await VaccinationBooking.find({
            selectedDate: rescheduledDate,
            selectedTime: rescheduledTime,
            status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
        });

        // If no bookings found using selectedDate/selectedTime, check with rescheduledDate/rescheduledTime
        if (existingBookings.length === 0) {
            existingBookings = await VaccinationBooking.find({
                rescheduledDate,
                rescheduledTime,
                status: { $nin: ['Cancelled', 'Completed', 'Pending'] }
            });
        }

        // Exclude the current booking from count if it's being rescheduled
        const currentBookingInResults = existingBookings.findIndex(b => b._id.toString() === id);
        if (currentBookingInResults !== -1) {
            existingBookings.splice(currentBookingInResults, 1);
        }

        if (existingBookings.length >= VaccinationSettings.perGapLimitBooking) {
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
                title: 'Vaccination Rescheduled',
                body: `Your vaccination appointment has been rescheduled to ${rescheduledDate} at ${rescheduledTime}.`,
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
            message: 'Vaccination booking rescheduled successfully.',
            data: booking,
        });

    } catch (error) {
        console.error('❌ Error during vaccination reschedule:', error);

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


exports.updatefVaccinationBookingStatus = async (req, res) => {
    try {
        const { status, id } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID and status are required',
            });
        }

        const updatedBooking = await VaccinationBooking.findByIdAndUpdate(
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
                    body: `Your vaccines booking status has been updated to: ${status}`,
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


exports.getScheduleOfVaccination = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing booking ID.',
                code: 'INVALID_ID',
            });
        }

        const foundData = await Schedule.findOne({ whichOrderId: id })
            .populate({
                path: 'whichOrderId',
                populate: [
                    {
                        path: 'pet',
                        select: 'petType petname petOwnertNumber petdob petbreed',
                        populate: {
                            path: 'petType',
                            select: 'petType',
                        },
                    },
                    {
                        path: 'vaccine',
                        select: '-image -small_desc -desc -WhichTypeOfvaccinations',
                    },
                    {
                        path: 'clinic',
                        select: 'clinicName address',
                    },
                    {
                        path: 'nextScheduledVaccination',
                    },
                    {
                        path: 'Address',
                    },
                    {
                        path: 'payment',
                        select: 'razorpay_order_id razorpay_payment_id amount payment_status',
                    },
                ],
            });

        if (!foundData) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found for the given booking ID.',
                code: 'NOT_FOUND',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Schedule fetched successfully.',
            data: foundData,
        });

    } catch (error) {
        console.error('Error in getScheduleOfVaccination:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching schedule.',
            error: error.message,
        });
    }
};
