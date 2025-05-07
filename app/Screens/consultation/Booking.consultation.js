import { View, Text, Dimensions, StyleSheet, Image, TouchableOpacity, Animated, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_END_POINT_URL, API_END_POINT_URL_LOCAL } from '../../constant/constant';
import { useToken } from '../../hooks/useToken';
import { getUser } from '../../hooks/getUserHook';
import { Ionicons } from '@expo/vector-icons';
import Razorpay from 'react-native-razorpay';
import useNotificationPermission from '../../hooks/notification';
const { width } = Dimensions.get('window');

const Toast = ({ message, type }) => (
    <Animated.View
        entering={Animated.FadeInUp}
        style={[styles.toast, type === 'error' ? styles.errorToast : styles.successToast]}
    >
        <Ionicons name={type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={20} color="#fff" />
        <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
);

const Header = ({ title, navigation }) => (
    <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
    </View>
);

export default function BookingConsultation() {
    const router = useRoute();
    const { type, id } = router.params || {};
    const navigation = useNavigation();
    const { isLoggedIn } = useToken();
    const { user } = getUser();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [bookingInProgress, setBookingInProgress] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { fcmToken } = useNotificationPermission()
    // Update current time every minute
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/consultation-doctor`);

            // Sort doctors by position
            const sortedDoctors = data.data.sort((a, b) => a.position - b.position);
            setDoctors(sortedDoctors);

            if (sortedDoctors.length > 0) {
                setSelectedDoctor(sortedDoctors[0]);
            }
        } catch (err) {
            setError('Failed to load doctors. Please try again.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDoctor) {
            generateDaysAndTimeSlots(selectedDoctor);
        }
    }, [selectedDoctor, currentTime]);

    useEffect(() => {

        if (availableDates.length > 0) {

            const today = availableDates[0];
            setSelectedDate(today);


            if (selectedDoctor) {
                updateTimeSlotsAvailability(today);
            }
        }
    }, [availableDates]);
    console.log("done", fcmToken)
    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        setSelectedTime(null);

        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.1,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
            })
        ]).start();
    };

    const generateDaysAndTimeSlots = (doctor) => {
        // Generate next 7 days
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.getDate(),
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                fullDate: date
            });
        }
        setAvailableDates(days);


        if (doctor.availableTimeSlots && doctor.availableTimeSlots.length > 0) {
            const generatedSlots = [];

            doctor.availableTimeSlots.forEach(slot => {
                const { whichPart, startTime, endTime } = slot;

                // Convert times to minutes for easier calculation
                const startMinutes = convertTimeToMinutes(startTime);
                const endMinutes = convertTimeToMinutes(endTime);

                // Generate 20-minute slots
                const slotDuration = 20;
                for (let time = startMinutes; time < endMinutes; time += slotDuration) {
                    const slotStartTime = formatMinutesToTime(time);
                    const slotEndTime = formatMinutesToTime(time + slotDuration);
                    const startDateTime = timeToDate(slotStartTime);
                    const endDateTime = timeToDate(slotEndTime);

                    generatedSlots.push({
                        label: `${slotStartTime} - ${slotEndTime}`,
                        period: whichPart,
                        active: true, // Default all slots to active, will update later
                        startDateTime,
                        endDateTime
                    });
                }
            });

            setTimeSlots(generatedSlots);
        }
    };

    // Convert time string (HH:MM AM/PM) to Date object
    const timeToDate = (timeString) => {
        const now = new Date();
        const [timePart, period] = timeString.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);

        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        const date = new Date(now);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    // Helper function to convert time string (HH:MM) to minutes
    const convertTimeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Helper function to format minutes back to time string
    const formatMinutesToTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Check if a time slot is in the past for the selected date
    const isTimeSlotInPast = (date, timeSlot) => {
        const now = new Date();
        const slotDate = new Date(date.fullDate);

        // Extract start time from the slot label "10:00 AM - 10:20 AM"
        const startTime = timeSlot.label.split(' - ')[0];
        const [timePart, period] = startTime.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);

        // Convert to 24-hour format
        if (period === 'PM' && hours < 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        slotDate.setHours(hours, minutes, 0, 0);

        // If the date is today and the time has passed, it's in the past
        return slotDate <= now;
    };

    // Update time slots availability based on current time and selected date
    const updateTimeSlotsAvailability = (selectedDate) => {
        if (!selectedDate) return;

        const today = new Date();
        const isSelectedDateToday =
            selectedDate.fullDate.getDate() === today.getDate() &&
            selectedDate.fullDate.getMonth() === today.getMonth() &&
            selectedDate.fullDate.getFullYear() === today.getFullYear();

        // Update availability of time slots
        const updatedSlots = timeSlots.map(slot => {
            // If selected date is today, check if time slot is in the past
            if (isSelectedDateToday) {
                return {
                    ...slot,
                    active: !isTimeSlotInPast(selectedDate, slot),
                    status: isTimeSlotInPast(selectedDate, slot) ? 'Closed' : 'Open'
                };
            }
            // Otherwise all slots are active for future dates
            return {
                ...slot,
                active: true,
                status: 'Open'
            };
        });

        setTimeSlots(updatedSlots);
    };

    const handleSelectDate = (date) => {
        setSelectedDate(date);
        setSelectedTime(null);

        // Update time slots availability for the selected date
        updateTimeSlotsAvailability(date);
    };

    const handleSelectTime = (time, period) => {
        setSelectedTime(time);
        setSelectedPeriod(period);
    };

    const handleBook = async () => {
        if (!isLoggedIn) {
            Alert.alert(
                'Login Required',
                'Please login to book an appointment',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => navigation.navigate('login') }
                ]
            );
            return;
        }

        if (!selectedDoctor || !selectedDate || !selectedTime) {
            setError('Please select all booking details');
            setTimeout(() => setError(null), 3000);
            return;
        }

        const data = {
            type: type,
            id: id,
            user: user?._id,
            doctorId: selectedDoctor._id,
            period: selectedPeriod,
            date: selectedDate.fullDate,
            time: selectedTime.label
        };

        try {
            setLoading(true)
            setBookingInProgress(true);
            const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/booking-consultation-doctor`, data);
            const { payment, booking } = response.data?.data;

            const options = {
                description: 'Doctor Consultation',
                image: 'https://i.ibb.co/cSHCKWHm/877c8e22-4df0-4f07-a857-e544208dc0f2.jpg',
                currency: 'INR',
                key: payment?.key,
                amount: payment?.amount * 100,
                name: 'Doggy World Care',
                order_id: payment?.orderId,

                prefill: {
                    email: user?.email || '',
                    contact: user?.phone || '',
                    name: user?.name || ''
                },
                theme: { color: '#ff4d4d' }
            };

            Razorpay.open(options)
                .then(async (paymentData) => {
                    // Payment successful
                    console.log('Payment Success:', paymentData);

                    // Verify payment on backend
                    try {
                        const verifyResponse = await axios.post(
                            `${API_END_POINT_URL_LOCAL}/api/v1/booking-verify-payment`,
                            {
                                razorpay_payment_id: paymentData.razorpay_payment_id,
                                razorpay_order_id: paymentData.razorpay_order_id,
                                razorpay_signature: paymentData.razorpay_signature,
                                bookingId: booking._id,
                                fcm: fcmToken
                            }
                        );

                        if (verifyResponse.data.success) {
                            // Payment verified successfully
                            Alert.alert(
                                'Booking Confirmed!',
                                'Your appointment has been booked successfully.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            navigation.reset({
                                                index: 0,
                                                routes: [{ name: 'thankyou', params: { booking: booking } }],
                                            });
                                        },
                                    },
                                ]
                            );

                        } else {

                            Alert.alert('Payment Verification Failed', 'Please contact support with your payment ID.');
                        }
                    } catch (verifyError) {
                        console.error('Verification error:', verifyError);
                        Alert.alert(
                            'Verification Issue',
                            'Your payment was processed, but we could not verify it. Please contact support.'
                        );
                    }
                })
                .catch((error) => {

                    console.log('Payment Error:', error);


                    checkPaymentStatus(booking._id);

                    if (error.code === 'PAYMENT_CANCELLED') {
                        Alert.alert('Booking Cancelled', 'You cancelled the payment process.');
                    } else {
                        Alert.alert('Payment Failed', 'Unable to process payment. Please try again.');
                    }
                });
            setBookingInProgress(false);
            setLoading(false)
        } catch (err) {
            console.error('Booking creation error:', err.response?.data || err);
            Alert.alert('Booking Issue', err.response?.data?.message || 'An unexpected error occurred.');

            setError('Failed to book appointment. Please try again.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setBookingInProgress(false);
            setLoading(false)
        }
    };

    // Helper function to check payment status for edge cases
    const checkPaymentStatus = async (bookingId) => {
        try {
            // Wait a few seconds to allow webhook processing
            setTimeout(async () => {
                const statusResponse = await axios.get(
                    `${API_END_POINT_URL_LOCAL}/api/v1/booking-status/${bookingId}`
                );

                console.log('status-response', statusResponse.data)

                if (statusResponse.data.status === 'Confirmed') {
                    Alert.alert(
                        'Booking Confirmed!',
                        'Your appointment has been booked successfully.',
                        [{ text: 'OK', onPress: () => navigation.navigate('BookingSuccess', { booking: statusResponse.data.booking }) }]
                    );
                }
            }, 3000);
        } catch (error) {
            console.error('Status check error:', error);
        }
    };

    // Group doctors into rows of 3
    const doctorRows = useMemo(() => {
        const rows = [];
        for (let i = 0; i < doctors.length; i += 3) {
            rows.push(doctors.slice(i, i + 3));
        }
        return rows;
    }, [doctors]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Header title="Book Consultation" navigation={navigation} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4d4d" />
                    <Text style={styles.loadingText}>Loading available doctors...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <Header title="Book Consultation" navigation={navigation} />

            <ScrollView showsVerticalScrollIndicator={false}>

                {success && <Toast message={success} type="success" />}

                <View style={styles.mainContent}>
                    <View style={styles.headerSection}>
                        <Text style={styles.headingText}>Choose Your Doctor</Text>
                        <Text style={styles.subHeadingText}>Select a doctor for your {type || 'consultation'}</Text>
                    </View>

                    {/* Doctors displayed in rows of 3 */}
                    <View style={styles.doctorSection}>
                        {doctorRows.map((row, rowIndex) => (
                            <View key={`row-${rowIndex}`} style={styles.doctorRow}>
                                {row.map((doctor) => {
                                    const isInactive = doctor.status === 'inactive';
                                    const isSelected = selectedDoctor?._id === doctor._id;

                                    return (
                                        <TouchableOpacity
                                            key={doctor._id}
                                            activeOpacity={isInactive ? 1 : 0.9}
                                            onPress={() => !isInactive && handleSelectDoctor(doctor)}
                                            style={styles.doctorCardWrapper}
                                            disabled={isInactive}
                                        >
                                            <Animated.View style={[
                                                styles.doctorCard,
                                                isSelected && styles.selectedDoctorCard,
                                                isSelected && { transform: [{ scale: scaleAnim }] },
                                                isInactive && styles.inactiveDoctorCard,
                                            ]}>
                                                <Image
                                                    source={{ uri: doctor.image?.url || 'https://via.placeholder.com/150' }}
                                                    style={styles.doctorImage}
                                                />

                                                <View style={styles.doctorInfo}>
                                                    <Text style={styles.doctorName} numberOfLines={2}>{doctor.name}</Text>

                                                    <View style={styles.priceContainer}>
                                                        <Text style={styles.discountPrice}>₹{doctor.discount || doctor.price}</Text>
                                                        {doctor.discount && doctor.discount < doctor.price && (
                                                            <Text style={styles.originalPrice}>₹{doctor.price}</Text>
                                                        )}
                                                    </View>

                                                    {isInactive && (
                                                        <Text style={styles.bookingClosedText}>Doctor unavailable</Text>
                                                    )}
                                                </View>

                                                {isSelected && !isInactive && (
                                                    <View style={styles.selectedBadge}>
                                                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                                    </View>
                                                )}
                                            </Animated.View>
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Add empty placeholders if row is not complete */}
                                {Array(3 - row.length).fill().map((_, index) => (
                                    <View key={`empty-${index}`} style={[styles.doctorCardWrapper, { opacity: 0 }]} />
                                ))}
                            </View>
                        ))}
                    </View>


                    {selectedDoctor && (
                        <View style={styles.dateTimeSection}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="calendar-outline" size={20} color="#333" />
                                <Text style={styles.sectionTitle}>Select Date</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateContainer}>
                                {availableDates.map((date, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleSelectDate(date)}
                                        style={[
                                            styles.dateCard,
                                            selectedDate?.date === date.date &&
                                            selectedDate?.month === date.month &&
                                            styles.selectedDateCard
                                        ]}
                                    >
                                        <Text style={[
                                            styles.dateDay,
                                            selectedDate?.date === date.date &&
                                            selectedDate?.month === date.month &&
                                            styles.selectedDateText
                                        ]}>
                                            {date.day}
                                        </Text>
                                        <Text style={[
                                            styles.dateNumber,
                                            selectedDate?.date === date.date &&
                                            selectedDate?.month === date.month &&
                                            styles.selectedDateText
                                        ]}>
                                            {date.date}
                                        </Text>
                                        <Text style={[
                                            styles.dateMonth,
                                            selectedDate?.date === date.date &&
                                            selectedDate?.month === date.month &&
                                            styles.selectedDateText
                                        ]}>
                                            {date.month}
                                        </Text>
                                        {index === 0 && (
                                            <View style={styles.todayBadge}>

                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {selectedDate && timeSlots.length > 0 && (
                                <View style={styles.timeSection}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="time-outline" size={20} color="#333" />
                                        <Text style={styles.sectionTitle}>Available Time Slots</Text>
                                    </View>
                                    {['Morning', 'Afternoon', 'Evening'].map((period) => {
                                        const periodSlots = timeSlots.filter(slot => slot.period === period);
                                        if (periodSlots.length === 0) return null;

                                        return (
                                            <View key={period} style={styles.periodSection}>
                                                <View style={styles.periodHeader}>
                                                    <Ionicons
                                                        name={
                                                            period === 'Morning' ? 'sunny-outline' :
                                                                period === 'Afternoon' ? 'partly-sunny-outline' : 'moon-outline'
                                                        }
                                                        size={18}
                                                        color="#ff4d4d"
                                                    />
                                                    <Text style={styles.periodTitle}>{period}</Text>
                                                </View>
                                                <View style={styles.timeGrid}>
                                                    {periodSlots.map((slot, index) => (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => slot.active && handleSelectTime(slot, period)}
                                                            style={[
                                                                styles.timeSlot,
                                                                selectedTime?.label === slot.label && styles.selectedTimeSlot,
                                                                !slot.active && styles.inactiveTimeSlot
                                                            ]}
                                                            disabled={!slot.active}
                                                        >
                                                            <Text style={[
                                                                styles.timeText,
                                                                selectedTime?.label === slot.label && styles.selectedTimeText,
                                                                !slot.active && styles.inactiveTimeText
                                                            ]}>
                                                                {slot.label}
                                                            </Text>
                                                            <View style={[
                                                                styles.slotStatusBadge,
                                                                slot.active ? styles.openStatusBadge : styles.closedStatusBadge
                                                            ]}>
                                                                <Text style={[
                                                                    styles.slotStatusText,
                                                                    slot.active ? styles.openStatusText : styles.closedStatusText
                                                                ]}>
                                                                    {slot.active ? 'Open' : 'Closed'}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.bookButton,
                        (!selectedTime || !selectedDate || bookingInProgress) && styles.bookButtonDisabled
                    ]}
                    disabled={!selectedTime || !selectedDate || bookingInProgress}
                    onPress={handleBook}
                >
                    {bookingInProgress ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.bookButtonText}>
                                {isLoggedIn ? 'Book Appointment' : 'Login to Book'}
                            </Text>
                            {isLoggedIn && selectedDoctor && (
                                <Text style={styles.bookButtonPrice}>
                                    ₹{selectedDoctor.discount || selectedDoctor.price}
                                </Text>
                            )}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        elevation: 2,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    errorToast: {
        backgroundColor: '#ff4d4d',
    },
    successToast: {
        backgroundColor: '#00c853',
    },
    toastText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    mainContent: {
        padding: 16,
    },
    headerSection: {
        marginBottom: 24,
    },
    headingText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subHeadingText: {
        fontSize: 14,
        color: '#666',
    },
    doctorSection: {
        marginBottom: 24,
    },
    doctorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    doctorCardWrapper: {
        width: (width - 48) / 3,
    },
    doctorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        alignItems: 'center',
        position: 'relative',
        height: 140,
        justifyContent: 'center',
    },
    selectedDoctorCard: {
        backgroundColor: '#fff0f0',
        borderColor: '#ff4d4d',
        borderWidth: 2,
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ff4d4d',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    doctorInfo: {
        overflow: 'hidden',
        alignItems: 'center',
    },
    doctorName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
        textAlign: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    discountPrice: {
        fontSize: 14,
        color: '#ff4d4d',
        fontWeight: '600',
    },
    originalPrice: {
        fontSize: 10,
        color: '#666',
        textDecorationLine: 'line-through',
    },
    dateTimeSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    dateContainer: {
        marginBottom: 24,
    },
    dateCard: {

        marginRight: 12,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minWidth: 70,
        position: 'relative',
    },
    selectedDateCard: {
        backgroundColor: '#c94242',
        borderColor: '#f5c9c9',
    },
    dateDay: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    dateMonth: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    selectedDateText: {
        color: '#fff',
    },
    todayBadge: {
        position: 'absolute',
        zIndex: 999,
        height: 10,
        width: 10,
        top: 1,
        right: 2,
        backgroundColor: '#4caf50',
        borderRadius: 50,

    },
    todayText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    timeSection: {
        marginTop: 8,
    },
    periodSection: {
        marginBottom: 20,
    },
    periodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 6,
    },
    periodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timeSlot: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        alignItems: 'center',
        width: '48%',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        position: 'relative',
    },
    selectedTimeSlot: {
        backgroundColor: '#ff4d4d',
        borderColor: '#ff4d4d',
    },
    inactiveTimeSlot: {
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
        opacity: 0.6,
    },
    timeText: {
        fontSize: 13,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    selectedTimeText: {
        color: '#fff',
        fontWeight: '500',
    },
    inactiveTimeText: {
        color: '#999',
    },
    slotStatusBadge: {
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    openStatusBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 1,
        borderColor: '#4caf50',
    },
    closedStatusBadge: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 1,
        borderColor: '#f44336',
    },
    slotStatusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    openStatusText: {
        color: '#4caf50',
    },
    closedStatusText: {
        color: '#f44336',
    },
    bottomBar: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bookButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    bookButtonDisabled: {
        backgroundColor: '#cccccc',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    bookButtonPrice: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    bookingClosedText: {
        marginTop: 4,
        color: 'red',
        fontSize: 9,
        fontWeight: '500',
    },
    inactiveDoctorCard: {
        opacity: 0.5,
        backgroundColor: '#f8f8f8',
    },
});