import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format, addMinutes, parse, isWithinInterval, isBefore } from 'date-fns';

const TimeSlotSelector = ({
  bookingSettings,
  selectedDate,
  onSelectTime,
  selectedTime,
  existingBookings = []
}) => {
  // Ensure selectedDate is a Date object
  const validSelectedDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

  // Check if the selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    return validSelectedDate.getDate() === today.getDate() &&
      validSelectedDate.getMonth() === today.getMonth() &&
      validSelectedDate.getFullYear() === today.getFullYear();
  }, [validSelectedDate]);

  // Current time for comparing with slots if today is selected
  const currentTime = useMemo(() => new Date(), []);

  // Generate time slots based on settings
  const timeSlots = useMemo(() => {
    try {
      if (!bookingSettings || !validSelectedDate) {
        return [];
      }

      const { start, end, gapBetween, perGapLimitBooking, disabledTimeSlots = [] } = bookingSettings;

      // Parse start and end times
      const startTime = parse(start, 'HH:mm', new Date());
      const endTime = parse(end, 'HH:mm', new Date());

      // Set the date part of the times to the selected date
      startTime.setFullYear(validSelectedDate.getFullYear(), validSelectedDate.getMonth(), validSelectedDate.getDate());
      endTime.setFullYear(validSelectedDate.getFullYear(), validSelectedDate.getMonth(), validSelectedDate.getDate());

      const slots = [];
      let currentSlotTime = startTime;

      // Generate slots until we reach the end time
      while (currentSlotTime < endTime) {
        const slotTime = new Date(currentSlotTime);
        const formattedTime = format(slotTime, 'HH:mm');

        // Check if this time is in a disabled single time slot
        const isSingleTimeDisabled = disabledTimeSlots.some(
          slot => slot.type === 'single' && slot.time === formattedTime
        );

        // Check if this time is in a disabled time range
        const isInDisabledRange = disabledTimeSlots.some(slot => {
          if (slot.type !== 'range') return false;

          const rangeStart = parse(slot.start, 'HH:mm', new Date());
          const rangeEnd = parse(slot.end, 'HH:mm', new Date());

          // Set the date part to match the selected date
          rangeStart.setFullYear(validSelectedDate.getFullYear(), validSelectedDate.getMonth(), validSelectedDate.getDate());
          rangeEnd.setFullYear(validSelectedDate.getFullYear(), validSelectedDate.getMonth(), validSelectedDate.getDate());

          return isWithinInterval(slotTime, { start: rangeStart, end: rangeEnd });
        });

        // Count existing bookings for this time slot
        const bookingsForThisSlot = existingBookings.filter(booking => {
          const bookingTime = booking.selectedTime || booking.time;
          return bookingTime === formattedTime;
        }).length;


        // Check if this time slot is in the past (only relevant for today)
        const isPastTime = isToday && isBefore(slotTime, currentTime);

        const isNotDisabled = !isSingleTimeDisabled && !isInDisabledRange && !isPastTime;
        const hasAvailableBookings = bookingsForThisSlot < perGapLimitBooking;

        // Finally, check if the slot is available
        const isAvailable = isNotDisabled && hasAvailableBookings;

        slots.push({
          time: formattedTime,
          isAvailable,
          remainingSlots: perGapLimitBooking - bookingsForThisSlot,
          isPastTime
        });

        // Move to next time slot
        currentSlotTime = addMinutes(currentSlotTime, gapBetween);
      }

      return slots;

    } catch (error) {
      return [];
    }
  }, [bookingSettings, validSelectedDate, existingBookings, isToday, currentTime]);

  // Group time slots by morning, afternoon, evening
  const groupedTimeSlots = useMemo(() => {
    const morning = timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 0 && hour < 12;
    });

    const afternoon = timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 12 && hour < 17;
    });

    const evening = timeSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= 17 && hour < 24;
    });

    return { morning, afternoon, evening };
  }, [timeSlots]);

  // Format time for display (e.g., "09:30 AM")
  const formatTimeForDisplay = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Render a time slot group
  const renderTimeSlotGroup = (title, slots) => {
    if (!slots || slots.length === 0) return null;

    return (
      <View style={styles.timeSlotGroup}>
        <Text style={styles.timeSlotGroupTitle}>
          {title} ({slots.filter(s => s.isAvailable).length} available)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.timeSlotRow}>
            {slots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  !slot.isAvailable && styles.disabledTimeSlot,
                  selectedTime === slot.time && styles.selectedTimeSlot
                ]}
                onPress={() => slot.isAvailable && onSelectTime(slot.time)}
                disabled={!slot.isAvailable}
              >
                <Text style={[
                  styles.timeSlotText,
                  !slot.isAvailable && styles.disabledTimeSlotText,
                  selectedTime === slot.time && styles.selectedTimeSlotText
                ]}>
                  {formatTimeForDisplay(slot.time)}
                </Text>
                {slot.isAvailable ? (
                  <Text style={styles.slotsLeftText}>
                    {slot.remainingSlots} {slot.remainingSlots === 1 ? 'slot' : 'slots'} left
                  </Text>
                ) : (
                  <Text style={styles.disabledReasonText}>
                    {slot.isPastTime ? 'Past time' : slot.remainingSlots <= 0 ? 'Fully booked' : 'Not available'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderTimeSlotGroup('Morning', groupedTimeSlots.morning)}
      {renderTimeSlotGroup('Afternoon', groupedTimeSlots.afternoon)}
      {renderTimeSlotGroup('Evening', groupedTimeSlots.evening)}

      {timeSlots.length === 0 && (
        <Text style={styles.noSlotsText}>
          No time slots available for the selected date
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  timeSlotGroup: {
    marginBottom: 15,
  },
  timeSlotGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  timeSlotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlot: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#ff4d4d',
  },
  disabledTimeSlot: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedTimeSlotText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledTimeSlotText: {
    color: '#999',
  },
  slotsLeftText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  disabledReasonText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export default TimeSlotSelector;