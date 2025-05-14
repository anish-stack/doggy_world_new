import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, TouchableWithoutFeedback, Share, ActivityIndicator, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getUser } from '../../hooks/getUserHook';
import { useToken } from '../../hooks/useToken';
import { useNavigation } from '@react-navigation/native';
import {
    CreditCard as Edit3,
    Package,
    Calendar,
    Cake,
    Scissors,
    Stethoscope,
    ShoppingBag,
    Star,
    Share2,
    PhoneCall,
    LogOut,
    PawPrint as Paw,
    Gift,
    Bell
} from 'lucide-react-native';
import Tabs from '../../layouts/Tabs';
import Layout from '../../layouts/Layout';
import TopHeadPart from '../../layouts/TopHeadPart';
import * as Notifications from 'expo-notifications';

export default function Profile() {
    const { user, refreshUser, orderData, loading } = getUser();
    const { token, isLoggedIn, deleteToken } = useToken();
    const router = useNavigation();
    const [birthdayInfo, setBirthdayInfo] = useState(null);

    const {
        consultationBookings = [],
        cakeBookings = [],
        groomingPackages = [],
        labVaccinations = [],
        petShopOrders = [],
        physioBookings = []
    } = orderData || {};

    const stats = [
        { title: 'Consultations', route: "Appointments", count: consultationBookings.length, icon: Stethoscope },
        { title: 'Cake Orders', route: "cakeorder", count: cakeBookings.length, icon: Cake },
        { title: 'Grooming', route: "Groomings", count: groomingPackages.length, icon: Scissors },
        { title: 'Lab & Vaccines', route: "labVaccinations", count: labVaccinations.length, icon: Package },
        { title: 'Shop Orders', route: "Orders", count: petShopOrders.length, icon: ShoppingBag },
        { title: 'Physio Sessions', route: "physioBookings", count: physioBookings.length, icon: Calendar },
    ];

    const menuItems = [
        { title: 'Rate Our App', icon: Star, onPress: () => { } },
        { title: 'Share App', icon: Share2, onPress: handleShare },
        { title: 'Contact Us', icon: PhoneCall, onPress: () => router.navigate('Support') },
        { title: 'Logout', icon: LogOut, onPress: handleLogout, danger: true },
    ];

    // Calculate birthday info
    useEffect(() => {
        if (user?.petdob) {
            try {
                const birthday = calculateBirthdayInfo(user.petdob);
                setBirthdayInfo(birthday);

                // Schedule birthday notification if permission granted
                if (user.isGivePermisoonToSendNotification && birthday.daysUntilBirthday <= 5 && birthday.daysUntilBirthday > 0) {
                    scheduleBirthdayNotification(user.petname, birthday.daysUntilBirthday);
                }
            } catch (error) {
                console.error("Error calculating birthday:", error);
                setBirthdayInfo(null);
            }
        }
    }, [user]);

    async function handleShare() {
        try {
            await Share.share({
                message: 'Check out Doggy World Care - The best pet care app!',
                url: 'https://doggyworldapp.com',
                title: 'Doggy World',
            });
        } catch (error) {
            console.error(error);
        }
    }

    function handleLogout() {
        deleteToken();
        router.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    }

    function handleCakeOrder() {
        router.navigate('Cake-Screen');
    }

    function calculateBirthdayInfo(dobString) {
        try {
            const dob = new Date(dobString);
            if (isNaN(dob.getTime())) {
                throw new Error("Invalid date");
            }

            const today = new Date();

            // Set the birthday for this year
            const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

            // If birthday has passed this year, calculate for next year
            if (birthdayThisYear < today) {
                birthdayThisYear.setFullYear(today.getFullYear() + 1);
            }

            // Calculate days until birthday
            const diffTime = Math.abs(birthdayThisYear - today);
            const daysUntilBirthday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Calculate pet's age
            const ageDifMs = today - dob;
            const ageDate = new Date(ageDifMs);
            const years = Math.abs(ageDate.getUTCFullYear() - 1970);
            const months = ageDate.getUTCMonth();

            // Format birthday date
            const options = { month: 'long', day: 'numeric' };
            const formattedDate = dob.toLocaleDateString(undefined, options);

            return {
                formattedDate,
                daysUntilBirthday,
                isBirthday: daysUntilBirthday === 0,
                isUpcoming: daysUntilBirthday <= 5 && daysUntilBirthday > 0,
                years,
                months,
                birthdayDate: `${dob.getDate()}-${dob.getMonth() + 1}-${dob.getFullYear()}`
            };
        } catch (error) {
            console.error("Date calculation error:", error);
            return null;
        }
    }

    async function scheduleBirthdayNotification(petName, daysLeft) {
        try {
            if (Platform.OS !== 'web') {
                const { status } = await Notifications.getPermissionsAsync();

                if (status !== 'granted') {
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    if (newStatus !== 'granted') return;
                }

                // Cancel existing notifications first
                await Notifications.cancelAllScheduledNotificationsAsync();

                // Schedule notification
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `${petName}'s Birthday Coming Soon! 🎂`,
                        body: `${petName}'s special day is just ${daysLeft} days away! Plan something special.`,
                        sound: true,
                    },
                    trigger: { seconds: 1 }, // For testing - in production use actual timing
                });
            }
        } catch (error) {
            console.error("Notification error:", error);
        }
    }

    useEffect(() => {
        refreshUser();
    }, [token]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#B32113" />
                <Text style={styles.loadingText}>Fetching pet profile...</Text>
            </View>
        );
    }

    if (!isLoggedIn || !user) {
        return (
            <View style={styles.container}>
                <View style={styles.loginContainer}>
                    <Paw size={64} color="#B32113" />
                    <Text style={styles.title}>Please login to view your pet profile</Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.navigate('login')}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Safely get pet properties
    const petName = user?.petname || 'Pet';
    const petBreed = user?.petbreed || user?.Breed || 'Unknown Breed';
    const petType = user?.petType?.petType || 'Pet';
    const petOwnerNumber = user?.petOwnertNumber || 'No contact number';

    return (
        <>
            <TopHeadPart title='Pet Profile 🐾🐾' icon='info' />
            <Layout isHeaderShow={false}>
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.profileInfo}>
                            <View style={styles.avatarContainer}>
                                <Paw size={32} color="#FFFFFF" />
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.petName}>{petName}</Text>
                                <Text style={styles.breed}>{petBreed} • {petType}</Text>
                                <Text style={styles.phone}>{petOwnerNumber}</Text>
                                {birthdayInfo ? (
                                    <View style={styles.ageContainer}>
                                        <Text style={styles.ageText}>
                                            {birthdayInfo.years > 0
                                                ? `${birthdayInfo.years} year${birthdayInfo.years > 1 ? 's' : ''}`
                                                : ''}
                                            {birthdayInfo.months > 0
                                                ? `${birthdayInfo.years > 0 ? ', ' : ''}${birthdayInfo.months} month${birthdayInfo.months > 1 ? 's' : ''}`
                                                : birthdayInfo.years === 0 ? 'Less than a month' : ''}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => router.navigate('/profile/edit')}
                        >
                            <Edit3 size={20} color="#B32113" />
                        </TouchableOpacity>
                    </View>

                    {birthdayInfo && (
                        <View style={[
                            styles.birthdayCard,
                            birthdayInfo.isBirthday ? styles.birthdayCardToday :
                                birthdayInfo.isUpcoming ? styles.birthdayCardUpcoming : styles.birthdayCardRegular
                        ]}>
                            <View style={styles.birthdayIconContainer}>
                                {birthdayInfo.isBirthday ? (
                                    <Gift size={32} color="#FFFFFF" />
                                ) : birthdayInfo.isUpcoming ? (
                                    <Bell size={32} color="#FFFFFF" />
                                ) : (
                                    <Cake size={32} color="#FFFFFF" />
                                )}
                            </View>
                            <View style={styles.birthdayInfoContainer}>
                                {birthdayInfo.isBirthday ? (
                                    <>
                                        <Text style={styles.birthdayTitle}>Happy Birthday {petName}! 🎉</Text>
                                        <Text style={styles.birthdaySubtitle}>It's {petName}'s special day today!</Text>
                                    </>
                                ) : birthdayInfo.isUpcoming ? (
                                    <>
                                        <Text style={styles.birthdayTitle}>Birthday coming soon! 🎂</Text>
                                        <Text style={styles.birthdaySubtitle}>
                                            {petName}'s birthday is in {birthdayInfo.daysUntilBirthday} day{birthdayInfo.daysUntilBirthday > 1 ? 's' : ''}!
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.birthdayTitle}>Birthday: {birthdayInfo.formattedDate}</Text>
                                        <Text style={styles.birthdaySubtitle}>
                                            {birthdayInfo.daysUntilBirthday} days until {petName}'s next birthday
                                        </Text>
                                    </>
                                )}
                            </View>
                            {(birthdayInfo.isBirthday || birthdayInfo.isUpcoming) && (
                                <TouchableOpacity
                                    style={styles.orderCakeButton}
                                    onPress={handleCakeOrder}
                                >
                                    <Text style={styles.orderCakeText}>Order Cake</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.statsContainer}>
                        <Text style={styles.sectionTitle}>Your Activity</Text>
                        <View style={styles.statsGrid}>
                            {stats.map((stat, index) => (
                                <TouchableWithoutFeedback
                                    key={index}
                                    onPress={() => router.navigate(stat.route)}
                                >
                                    <View style={styles.statCard}>
                                        <stat.icon size={24} color="#B32113" />
                                        <Text style={styles.statCount}>{stat.count}</Text>
                                        <Text style={styles.statTitle}>{stat.title}</Text>
                                    </View>
                                </TouchableWithoutFeedback>
                            ))}
                        </View>
                    </View>

                    <View style={styles.menuContainer}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={item.onPress}
                            >
                                <View style={styles.menuItemLeft}>
                                    <item.icon size={20} color={item.danger ? '#EF4444' : '#1F2937'} />
                                    <Text style={[styles.menuItemText, item.danger && styles.dangerText]}>
                                        {item.title}
                                    </Text>
                                </View>
                                <View style={styles.menuItemArrow} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.version}>Version 1.0.1</Text>
                    </View>
                </ScrollView>
            </Layout>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        margin: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#B32113',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        marginLeft: 16,
    },
    petName: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
    },
    breed: {
        fontSize: 16,
        color: '#4B5563',
        marginTop: 2,
    },
    phone: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    ageContainer: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ageText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
    },
    editButton: {
        padding: 10,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
    },
    birthdayCard: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    birthdayCardToday: {
        backgroundColor: '#ECFDF5', // Green background for birthday
        borderColor: '#10B981',
        borderWidth: 1,
    },
    birthdayCardUpcoming: {
        backgroundColor: '#FEF3C7', // Yellow background for upcoming
        borderColor: '#F59E0B',
        borderWidth: 1,
    },
    birthdayCardRegular: {
        backgroundColor: '#FFFFFF',
    },
    birthdayIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#B32113',
    },
    birthdayInfoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    birthdayTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    birthdaySubtitle: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 2,
    },
    orderCakeButton: {
        backgroundColor: '#B32113',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 8,
    },
    orderCakeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: (Platform.OS === 'web' ? 200 : '31%'), // Adjusted for better spacing
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
            },
        }),
    },
    statCount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    statTitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center',
    },
    menuContainer: {
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 12,
    },
    dangerText: {
        color: '#EF4444',
    },
    menuItemArrow: {
        width: 8,
        height: 8,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: '#9CA3AF',
        transform: [{ rotate: '45deg' }],
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
    version: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    loginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loginButton: {
        backgroundColor: '#B32113',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        width: '100%',
        maxWidth: 300,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        marginTop: 16,
    },
});