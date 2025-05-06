import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from "react-native";
import CalendarPicker from "react-native-calendar-picker";
import { useRoute } from "@react-navigation/native";
import UpperLayout from "../../layouts/UpperLayout";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings } from "../../redux/slice/Settings";

export default function Book_Test() {
    const route = useRoute();
    const dispatch = useDispatch();
    const { settings, loading, error } = useSelector((state) => state.settings);
    const { selectedTests, clinicId, type } = route.params || {};
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const onDateChange = (date) => {
        setSelectedDate(date);
    };
    const handleTimeSlotSelect = (time) => {
        setSelectedTimeSlot(time);
    };
    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        if (settings) {
            generateTimeSlots(type, selectedDate);
        }
    }, [settings, type, selectedDate]);

    const generateTimeSlots = (type, date) => {
        let startTime, endTime, gap;

        // Function to convert the gap into minutes
        const convertGapToMinutes = (gapString) => {
            console.log(gapString)
            const unit = gapString?.slice(-1); 
            console.log(unit)
            const gapValue = parseInt(gapString?.slice(0, -2), 10); 

            if (unit === 'H') {
                return gapValue * 60; // Convert hours to minutes
            } else if (unit === 'M') {
                return gapValue; // Already in minutes
            } else {
                return 0; // Invalid unit
            }
        };

        // Determine settings based on type
        if (type === "Sample Collection At Home") {
            startTime = settings?.Home_Collection_Start_time;
            endTime = settings?.Home_Collection_End_time;
            gap = convertGapToMinutes(settings?.Home_slots_gap);
        } else if (type === "Book Appoinment at The Clinic") {
            startTime = settings?.Clinic_booking_time_start;
            endTime = settings?.Clinic_booking_time_end;
            gap = convertGapToMinutes(settings?.Clinic_slots_gap);
        } else if (type === "Ultrasound") {
            startTime = settings?.ultrasound_booking_time_start;
            endTime = settings?.ultrasound_booking_end_time;
            gap = convertGapToMinutes(settings?.Clinic_slots_gap);
        }


        if (!startTime || !endTime || isNaN(gap)) {
            setTimeSlots([]);
            console.warn("Invalid settings or time slots configuration");
            return;
        }

        const formatTimeString = (timeString) => {
            const [hours, minutes, seconds] = timeString.split(":").map(Number);
            const dateObj = new Date(date); // Use the selected date
            dateObj.setHours(hours, minutes, seconds || 0, 0);
            return dateObj;
        };

        const start = formatTimeString(startTime);
        const end = formatTimeString(endTime);

        const slots = [];
        const current = new Date(start);

        while (current <= end) {
            slots.push(current.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
            current.setMinutes(current.getMinutes() + gap);
        }

        setTimeSlots(slots);
    };

    return (

        <>
            <UpperLayout title="Book a Sample" />
        <ScrollView>

            <View style={styles.container}>

                <Text style={styles.heading}>
                    Choose a Suitable <Text style={{ color: "#b32113" }}>Date for the Test</Text>
                </Text>

                <View style={styles.calendar}>
                    <View style={styles.calendarDiv}>
                        <CalendarPicker
                            onDateChange={onDateChange}
                            weekdays={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                            months={[
                                "January", "February", "March", "April", "May", "June", "July", "August",
                                "September", "October", "November", "December"
                            ]}
                            previousTitle="Prev"
                            nextTitle="Next"
                            todayBackgroundColor="#f44336"
                            selectedDayColor="#b32113"
                            selectedDayTextColor="#ffffff"
                            textStyle={{
                                color: "#111",
                            }}
                            minDate={new Date()}
                            initialDate={new Date()}
                        />
                    </View>
                </View>

                <Text style={styles.subtitle}>Available Time Slots</Text>
                {timeSlots.length > 0 ? (
                    <FlatList
                        data={timeSlots}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.timeSlot,
                                    selectedTimeSlot === item && styles.selectedTimeSlot, // Highlight selected time slot
                                ]}
                                onPress={() => handleTimeSlotSelect(item)}
                            >
                                <Text style={[styles.timeSlotText, selectedTimeSlot === item && styles.selectedTimeText]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        numColumns={3} // Display time slots in 3 columns
                    />
                ) : (
                    <Text style={styles.noSlotsText}>No time slots available.</Text>
                )}

                {loading && <Text style={styles.loadingText}>Loading settings...</Text>}
                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Show Book Now button if a time slot is selected */}
                {selectedTimeSlot && (
                    <TouchableOpacity style={styles.bookNowButton}>
                        <Text style={styles.bookNowText}>Book Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
        </>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        paddingHorizontal:12
    },
    heading: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
        textAlign: "center",
        marginVertical: 16,
    },
    calendar: {
        backgroundColor: "#ffffff",
    },
    calendarDiv: {
        paddingHorizontal: 12,
    },
    selectedDate: {
        fontSize: 16,
        fontWeight: "500",
        color: "#4377a2",
        textAlign: "center",
        marginTop: 20,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "600",
        marginVertical: 10,
        textAlign: "center",
    },
    timeSlot: {
        padding: 10, 
        marginVertical: 5,
        backgroundColor: "#c9472c", 
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        justifyContent: "center",
        alignItems: "center",
    },
    selectedTimeSlot: {
        borderColor: "#b32113",
        borderWidth: 2,
        color: '#000',
        backgroundColor: "#ffffff",
    },
    selectedTimeText: {
        color: '#000',
    },
    timeSlotText: {
        color: "#ffffff",
        textAlign: "center",
        fontSize: 14,
    },
    noSlotsText: {
        fontSize: 14,
        color: "#f44336",
        textAlign: "center",
    },
    loadingText: {
        fontSize: 14,
        color: "#003873",
        textAlign: "center",
    },
    errorText: {
        fontSize: 14,
        color: "#f44336",
        textAlign: "center",
    },
    bookNowButton: {
        marginTop: 20,
        backgroundColor: "#b32113",
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: "center",
    },
    bookNowText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
});