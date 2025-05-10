
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native"
import { useEffect, useState, useMemo } from "react"
import { useNavigation, useRoute } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"
import Icon from "react-native-vector-icons/MaterialCommunityIcons"
import UpperLayout from '../../../layouts/UpperLayout';
import { getUser } from "../../../hooks/getUserHook"
import { useToken } from "../../../hooks/useToken"

export default function BookingStep() {
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedTime, setSelectedTime] = useState(null)
    const [timeData, setTimeData] = useState(null)
    const [loading, setLoading] = useState(true)
    const { isLoggedIn } = useToken()
    const { user } = getUser()

    const [error, setError] = useState(null)
    const navigation = useNavigation()
    const route = useRoute()
    const { clinic, data_of_g, type, customizedData, Package } = route.params || {};


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/time-managements?filters[For_What][$eq]=Grooming&populate=*`)
                if (res.data && res.data.data.length > 0) {
                    setTimeData(res.data.data[0])
                } else {
                    setError("No booking configuration found")
                }
            } catch (error) {
                console.log(error)
                setError("Failed to load booking information")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])


    const dates = useMemo(() => {
        if (!timeData) return []

        const dateList = []
        const today = new Date()
        const isSundayOff = timeData.Is_Sunday_off

        for (let i = 0; i < 10; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)

            // Skip Sundays if they are marked as off
            if (isSundayOff && date.getDay() === 0) continue

            dateList.push(date)
        }

        return dateList
    }, [timeData])

    // Generate time slots based on start and end times
    const timeSlots = useMemo(() => {
        if (!timeData) return []

        const slots = []
        const blockedTimes = timeData.Times_Block.map((block) => block.Time.substring(0, 5))

        // Parse start and end times
        const startTime = timeData.Start_Time.substring(0, 5)
        const endTime = timeData.End_Time.substring(0, 5)

        // Handle overnight schedules (when end time is earlier than start time)
        const isOvernight = Number.parseInt(startTime.split(":")[0]) > Number.parseInt(endTime.split(":")[0])

        // Convert start time to minutes since midnight
        let currentHour = Number.parseInt(startTime.split(":")[0])
        const currentMinute = Number.parseInt(startTime.split(":")[1])

        // Generate slots with 1-hour intervals
        while (true) {
            const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

            // Calculate end time for this slot (1 hour later)
            let endHour = currentHour + 1
            if (endHour >= 24) endHour -= 24

            const endTimeStr = `${endHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

            // Check if this time slot is blocked
            const isBlocked = blockedTimes.includes(currentTimeStr)

            // Add the time slot
            slots.push({
                start: currentTimeStr,
                end: endTimeStr,
                isBlocked,
                availableSlots: timeData.Max_Booking_Allowed_in_per_slots,
            })

            // Move to next hour
            currentHour++
            if (currentHour >= 24) currentHour -= 24

            // Check if we've reached the end time
            if (!isOvernight && currentTimeStr === endTime) break
            if (
                isOvernight &&
                currentHour === Number.parseInt(endTime.split(":")[0]) &&
                currentMinute === Number.parseInt(endTime.split(":")[1])
            )
                break

            // Safety check to prevent infinite loops
            if (slots.length >= 24) break
        }

        return slots
    }, [timeData])

    // Check if selected date is closed for booking
    const isDateClosed = useMemo(() => {
        try {
            // Check if selectedDate and timeData are present
            if (!selectedDate || !timeData) {
                console.log('Error: selectedDate or timeData is missing');
                return false;
            }

            // Ensure selectedDate is a Date object
            const selectedDateObj = new Date(selectedDate);

            // Check if the selectedDate is valid
            if (isNaN(selectedDateObj)) {
                console.log('Error: Invalid selectedDate', selectedDate);
                return false;
            }

            console.log('Selected Date:', selectedDateObj);
            console.log('Booking Closed Date:', timeData.Which_Date_booking_Closed);

            // Convert booking closed date to Date object
            const closedDate = new Date(timeData.Which_Date_booking_Closed);

            // Check if the selected date matches the closed date
            const isClosed = selectedDateObj.getDate() === closedDate.getDate() &&
                selectedDateObj.getMonth() === closedDate.getMonth() &&
                selectedDateObj.getFullYear() === closedDate.getFullYear();

            console.log('Is Date Closed:', isClosed);

            return isClosed;

        } catch (error) {
            console.error('Error in date comparison:', error);
            return false;
        }
    }, [selectedDate, timeData]);

    const handleDateSelection = (date) => {
        console.log(date)
        setSelectedDate(date)
        setSelectedTime(null)
    }
    useEffect(() => {
        const currentDate = new Date()
        setSelectedDate(currentDate)
    }, [])

    const handleTimeSelection = (time) => {
        if (time.isBlocked) return
        setSelectedTime(time)
    }

    const handleBooking = async () => {


        if (!isLoggedIn) {
            alert("Please log in to make a booking.");
            navigation.navigate("login");
            return;
        }

        if (!selectedDate || !selectedTime) {
            alert("Please select a date and time for your booking.");
            return;
        }

        // Format date for display
        const formattedDate = selectedDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const data_to_be_send = {
            clinic_id: clinic,
            data_of_g: data_of_g,
            pet: user,
            type: type,
            customizedData: customizedData,
            Package: Package,
            date: selectedDate,
            time: `${selectedTime.start} - ${selectedTime.end}`,
            status: "pending",
        };
        setLoading(true)
        try {
            const response = await axios.post(
                "https://admindoggy.adsdigitalmedia.com/api/make_a_grooming_Booking",
                data_to_be_send
            );

            if (response.sucess || response.status === 200) {
                alert("✅ Booking successful! You will receive a confirmation soon.");


                navigation.navigate("thankyou", {
                    bookingDetails: {
                        date: formattedDate,
                        time: `${selectedTime.start} - ${selectedTime.end}`,
                        service: "Grooming",
                    },
                });
            } else {
                alert("⚠️ Booking successful, but something seems off. Please check your details.");
            }
            setLoading(false)
        } catch (error) {
            console.error("Booking Error:", error?.response?.data?.error?.message);
            alert(
                `❌ Booking failed! ${error?.response?.data?.error?.message || "Please try again later."
                }`
            );
            setLoading(false)

        }
    };


    // Format date for display
    const formatDate = (date) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        return {
            day: days[date.getDay()],
            date: date.getDate(),
            month: months[date.getMonth()],
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B32113" />
                <Text style={styles.loadingText}>Loading available slots...</Text>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={60} color="#B32113" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <UpperLayout isSearchShow={false} isBellShow={false} title={"Choose a Date and Time"} />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContainer}>
                    <Text style={styles.instructionText}>Select the Date for Grooming Service:</Text>

                    {/* Date Selection */}
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={dates}
                        renderItem={({ item }) => {
                            const formattedDate = formatDate(item)
                            const isSelected =
                                selectedDate && selectedDate.getDate() === item.getDate() && selectedDate.getMonth() === item.getMonth()

                            // Check if this date matches the closed booking date
                            const closedDate = timeData ? new Date(timeData.Which_Date_booking_Closed) : null
                            const isClosedDate =
                                closedDate &&
                                item.getDate() === closedDate.getDate() &&
                                item.getMonth() === closedDate.getMonth() &&
                                item.getFullYear() === closedDate.getFullYear()

                            return (
                                <TouchableOpacity
                                    style={[styles.dateButton, isSelected && styles.selectedDate, isClosedDate && styles.closedDate]}
                                    onPress={() => handleDateSelection(item)}
                                    disabled={isClosedDate}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            isSelected && styles.selectedDateText,
                                            isClosedDate && styles.closedDateText,
                                        ]}
                                    >
                                        {formattedDate.day}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateNumber,
                                            isSelected && styles.selectedDateText,
                                            isClosedDate && styles.closedDateText,
                                        ]}
                                    >
                                        {formattedDate.date}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.monthText,
                                            isSelected && styles.selectedDateText,
                                            isClosedDate && styles.closedDateText,
                                        ]}
                                    >
                                        {formattedDate.month}
                                    </Text>

                                    {isClosedDate && (
                                        <View style={styles.closedBadge}>
                                            <Text style={styles.closedBadgeText}>Closed</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={styles.dateList}
                    />

                    {/* Booking Closed Message */}
                    {isDateClosed && (
                        <View style={styles.closedMessageContainer}>
                            <Icon name="calendar-remove" size={24} color="#B32113" />
                            <Text style={styles.closedMessageText}>Sorry, bookings are not available for this date.</Text>
                        </View>
                    )}

                    {/* Time Slot Selection */}
                    {selectedDate && !isDateClosed && (
                        <View style={styles.timeContainer}>
                            <Text style={styles.timeInstructionText}>Select a time slot:</Text>

                            <View style={styles.timeSlotGrid}>
                                {timeSlots.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.timeButton,
                                            selectedTime?.start === item.start && styles.selectedTime,
                                            item.isBlocked && styles.blockedTime,
                                        ]}
                                        onPress={() => handleTimeSelection(item)}
                                        disabled={item.isBlocked}
                                    >
                                        <Text
                                            style={[
                                                styles.timeText,
                                                selectedTime?.start === item.start && styles.selectedTimeText,
                                                item.isBlocked && styles.blockedTimeText,
                                            ]}
                                        >
                                            {item.start} - {item.end}
                                        </Text>

                                        {item.isBlocked ? (
                                            <View style={styles.blockedBadge}>
                                                <Text style={styles.blockedBadgeText}>Closed</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.slotCountContainer}>
                                                <Icon name="account-group" size={12} color="#666" />
                                                <Text style={styles.slotCountText}>{item.availableSlots} slots</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Book Now Button */}
                    {selectedDate && selectedTime && !isDateClosed && (
                        <View style={styles.bookingSection}>
                            <View style={styles.bookingSummary}>
                                <Text style={styles.summaryTitle}>Booking Summary:</Text>
                                <View style={styles.summaryRow}>
                                    <Icon name="calendar" size={18} color="#666" />
                                    <Text style={styles.summaryText}>{selectedDate.toDateString()}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Icon name="clock-outline" size={18} color="#666" />
                                    <Text style={styles.summaryText}>
                                        {selectedTime.start} - {selectedTime.end}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Icon name="paw" size={18} color="#666" />
                                    <Text style={styles.summaryText}>Grooming Service</Text>
                                </View>
                            </View>

                            {isLoggedIn ? (
                                <TouchableOpacity disabled={loading} activeOpacity={0.9} style={styles.bookNowButton} onPress={handleBooking}>
                                    <Text style={styles.bookNowText}>{loading ? 'Please Wait' : 'Book Now'}</Text>
                                    <Icon name="arrow-right" size={20} color="#fff" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity activeOpacity={0.9} style={styles.bookNowButton} onPress={() => navigation.navigate('login')}>
                                    <Text style={styles.bookNowText}>Please Login To Book Now</Text>
                                    <Icon name="arrow-right" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}

                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 20,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: "#B32113",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    scrollViewContainer: {
        paddingBottom: 40,
    },
    instructionText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginVertical: 20,
        paddingHorizontal: 20,
    },
    dateList: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    dateButton: {
        backgroundColor: "#fff",
        padding: 15,
        marginHorizontal: 6,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: "relative",
    },
    selectedDate: {
        backgroundColor: "#B32113",
        shadowOpacity: 0.2,
    },
    closedDate: {
        backgroundColor: "#f5f5f5",
        borderColor: "#ddd",
        borderWidth: 1,
        opacity: 0.8,
    },
    dayText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
        marginBottom: 5,
    },
    dateNumber: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    monthText: {
        fontSize: 14,
        color: "#666",
    },
    selectedDateText: {
        color: "#fff",
    },
    closedDateText: {
        color: "#999",
    },
    closedBadge: {
        position: "absolute",
        top: 0,
        right: 0,
        backgroundColor: "#FF6B6B",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 8,
    },
    closedBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    closedMessageContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFEBEE",
        padding: 15,
        borderRadius: 8,
        marginHorizontal: 20,
        marginVertical: 15,
    },
    closedMessageText: {
        color: "#B32113",
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    timeContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    timeInstructionText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 15,
    },
    timeSlotGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    timeButton: {
        backgroundColor: "#fff",
        padding: 15,
        marginBottom: 15,
        borderRadius: 12,
        width: "48%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: "relative",
    },
    selectedTime: {
        backgroundColor: "#B32113",
    },
    blockedTime: {
        backgroundColor: "#f5f5f5",
        borderColor: "#ddd",
        borderWidth: 1,
        opacity: 0.8,
    },
    timeText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginBottom: 5,
    },
    selectedTimeText: {
        color: "#fff",
    },
    blockedTimeText: {
        color: "#999",
    },
    blockedBadge: {
        backgroundColor: "#FF6B6B",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginTop: 5,
    },
    blockedBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    slotCountContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    slotCountText: {
        fontSize: 12,
        color: "#666",
        marginLeft: 4,
    },
    bookingSection: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    bookingSummary: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 10,
    },
    bookNowButton: {
        backgroundColor: "#B32113",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    bookNowText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginRight: 10,
    },
})

