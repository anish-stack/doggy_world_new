import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format, addDays, isSameDay } from 'date-fns';

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const DateSelector = ({ 
  bookingSettings, 
  onSelectDate, 
  selectedDate,
  daysToShow = 14 
}) => {
  const dates = useMemo(() => {
    const { whichDayBookingClosed = [] } = bookingSettings || {};
    const dateArray = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToShow; i++) {
      const date = addDays(today, i);
      const dayName = format(date, 'EEEE'); 
      const isClosed = whichDayBookingClosed.includes(dayName);

      dateArray.push({
        date: normalizeDate(date),
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        month: format(date, 'MMM'),
        isToday: i === 0,
        isAvailable: !isClosed
      });
    }

    return dateArray;
  }, [bookingSettings, daysToShow]);

  // Auto-select today's date if no date is selected and today is available
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      const today = dates[0];
      if (today.isAvailable) {
        onSelectDate(today.date);
      } else {
        // If today is not available, find the first available date
        const firstAvailableDate = dates.find(date => date.isAvailable);
        if (firstAvailableDate) {
          onSelectDate(firstAvailableDate.date);
        }
      }
    }
  }, [dates, selectedDate, onSelectDate]);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((item, index) => {
          const isSelected = selectedDate && isSameDay(normalizeDate(selectedDate), item.date);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                item.isToday && styles.todayItem,
                !item.isAvailable && styles.disabledDateItem,
                isSelected && styles.selectedDateItem
              ]}
              onPress={() => item.isAvailable && onSelectDate(item.date)}
              disabled={!item.isAvailable}
            >
              <Text 
                style={[
                  styles.dayName,
                  item.isToday && styles.todayText,
                  !item.isAvailable && styles.disabledText,
                  isSelected && styles.selectedDateText
                ]}
              >
                {item.dayName}
              </Text>
              <Text 
                style={[
                  styles.dayNumber,
                  item.isToday && styles.todayText,
                  !item.isAvailable && styles.disabledText,
                  isSelected && styles.selectedDateText
                ]}
              >
                {item.dayNumber}
              </Text>
              <Text 
                style={[
                  styles.month,
                  item.isToday && styles.todayText,
                  !item.isAvailable && styles.disabledText,
                  isSelected && styles.selectedDateText
                ]}
              >
                {item.month}
              </Text>

              {item.isToday && (
                <Text style={styles.todayLabel}>Today</Text>
              )}
              {!item.isAvailable && (
                <Text style={styles.closedLabel}>Closed</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  dateItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    minWidth: 70,
    minHeight: 90,
    justifyContent: 'center',
  },
  todayItem: {
    backgroundColor: '#e6f7ff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDateItem: {
    backgroundColor: '#ff4d4d',
  },
  disabledDateItem: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  month: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  todayText: {
    color: '#1890ff',
  },
  selectedDateText: {
    color: '#fff',
  },
  disabledText: {
    color: '#999',
  },
  todayLabel: {
    fontSize: 10,
    color: '#fff',
    marginTop: 4,
    fontWeight: '500',
  },
  closedLabel: {
    fontSize: 10,
    color: '#ff4d4d',
    marginTop: 4,
    fontWeight: '500',
  }
});

export default DateSelector;