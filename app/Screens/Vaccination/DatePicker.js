import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, Pressable, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios'
import { getUser } from '../../hooks/getUserHook';
export default function DatePicker({ isPhysiotherapy = false, isOpen, onClosed, Clinic, onFormSubmit, vaccineItem, TypeOfBooking }) {
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const { user, getUserFnc } = getUser()
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ petName: '', contactNumber: '', date: new Date() });
    const navigation = useNavigation()
    const today = new Date();

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowPicker(false);
        if (event.type === 'set') {
            setDate(currentDate);
            setFormData((prev) => ({ ...prev, date: currentDate }));
        }
    };
    useEffect(() => {
        getUserFnc()
    }, [])


    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleConfirm = async () => {
        if (formData.petName.trim() === '' || formData.contactNumber.trim() === '') {
            alert('Please fill all fields');
            return;
        }
        const sendingItem = {
            petName: formData.petName,
            contactNumber: formData.contactNumber,
            date: date.toISOString(),
            ServiceTitle: vaccineItem?.title || '',
            ServiceId: vaccineItem?.documentId || '',
            isPhysiotherapy,
            user: user,
            ClinicPrice: vaccineItem?.discount_price || 0,
            HomePriceOfPackageDiscount: vaccineItem?.homePriceOfPackageDiscount || 0,
            clinicId: Clinic?.documentId || '',
            clinicName: Clinic?.clinic_name || 'Doggy World Sector 8 , Rohini',
            TypeOfBooking: TypeOfBooking,
        };

        if (isPhysiotherapy) {
            console.log("sendingItem has bookings");
            await handleBookPhysio(sendingItem)
        } else {
            console.log("sendingItem", sendingItem)
        }

        navigation.navigate('vaccination_booked', { details: sendingItem });
        setFormData({ petName: '', contactNumber: '' });
        onFormSubmit(formData);
        onClosed();
    };

    const handleBookPhysio = async (data) => {
        setLoading(true)
        try {
            const response = await axios.post(`https://admindoggy.adsdigitalmedia.com/api/make-order-physio-booking`, data)
            console.log(response.data)
            Alert.alert("Booking success", `Your's bookings have been successfully done`)
            setLoading(false)

        } catch (error) {
            setLoading(false)
            console.log(error?.response?.data?.message)
            Alert.alert("Booking Failed", error?.response?.data?.message)

        }
    }

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="slide"
            onRequestClose={onClosed}
        >
            <View style={styles.modalContainer}>
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Book Appointment</Text>
                    <Text style={styles.subtitle}>
                        At {TypeOfBooking} for {vaccineItem?.title || 'N/A'}{' '}
                        {vaccineItem?.isPackage ? 'Package' : 'Vaccine'}
                    </Text>
                    {TypeOfBooking === 'Clinic' && (

                        <Text style={styles.subtitle}>
                            And Clinic Is  <Text style={styles.ClinicTitle}> {isPhysiotherapy ? 'Doggy World Sector 8 , Rohini' : Clinic?.clinic_name}  </Text>
                        </Text>
                    )}

                    {vaccineItem?.isPackage && TypeOfBooking === 'Home' && (
                        <Text style={styles.price}>
                            Home Price: ₹{vaccineItem?.HomePriceOfPackageDiscount || vaccineItem?.HomePriceOfPackage || 'N/A'}
                        </Text>
                    )}
                    {TypeOfBooking === 'Clinic' && (
                        <Text style={styles.price}>
                            Price: ₹{vaccineItem?.discount_price || vaccineItem?.price || 'N/A'}
                            {isPhysiotherapy && vaccineItem?.price_minute ? ` / ${vaccineItem.price_minute}` : ''}
                        </Text>

                    )}

                    {/* Date Selection */}
                    {showPicker ? (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="calendar"
                            minimumDate={today}
                            onChange={handleDateChange}
                        />
                    ) : (
                        <TouchableOpacity
                            onPress={() => setShowPicker(true)}
                            style={styles.dateButton}
                        >
                            <Text style={styles.dateText}>
                                {date.toDateString()}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Pet Name Input */}
                    <TextInput
                        placeholder="Enter Pet Name"
                        style={styles.input}
                        value={formData.petName}
                        onChangeText={(value) => handleInputChange('petName', value)}
                    />

                    {/* Contact Number Input */}
                    <TextInput
                        placeholder="Enter Contact Number"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={formData.contactNumber}
                        onChangeText={(value) => handleInputChange('contactNumber', value)}
                    />

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClosed}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.buttonText}> {loading ? 'Please Wait  .... ' : 'Confirm'} </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003873',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#555',
        marginBottom: 15,
        textAlign: 'center',
    },
    price: {
        fontSize: 16,
        color: '#003873',
        fontWeight: 'bold',

    },
    dateButton: {
        backgroundColor: '#f0f8ff',
        padding: 12,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 20,
        marginTop: 10,
        paddingHorizontal: 10,
        width: '100%',
        alignItems: 'start',
    },
    dateText: {
        fontSize: 16,
        color: '#000',
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#111',
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#f44336',
    },
    confirmButton: {
        backgroundColor: '#003873',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ClinicTitle: {
        fontWeight: 'bold',
        color: '#f44336',
        marginBottom: 5,
        textAlign: 'center',
        fontSize: 16,
        textTransform: 'capitalize',
    }
});
