import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, TouchableWithoutFeedback } from 'react-native';
import React, { useEffect } from 'react';
import { getUser } from '../../hooks/getUserHook';
import { useToken } from '../../hooks/useToken';
import { useNavigation } from '@react-navigation/native';
import { Share } from 'react-native';
import { CreditCard as Edit3, Package, Calendar, Cake, Scissors, Stethoscope, ShoppingBag, Star, Share2, PhoneCall, LogOut, PawPrint as Paw } from 'lucide-react-native';
import Tabs from '../../layouts/Tabs';
import Layout from '../../layouts/Layout';
import TopHeadPart from '../../layouts/TopHeadPart';

export default function Profile() {
    const { user, getUserFnc, orderData } = getUser();
    const { token, isLoggedIn, deleteToken } = useToken();
    const router = useNavigation();

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
        // { title: 'Edit Profile', icon: Edit3, onPress: () => router.navigate('home') },
        { title: 'Rate Our App', icon: Star, onPress: () => { } },
        { title: 'Share App', icon: Share2, onPress: handleShare },
        { title: 'Contact Us', icon: PhoneCall, onPress: () => router.navigate('Support') },
        { title: 'Logout', icon: LogOut, onPress: handleLogout, danger: true },
    ];

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
        })
    }

    useEffect(() => {
        getUserFnc()
    }, [])

    if (!isLoggedIn || !user) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Please login to view your profile</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.navigate('login')}
                >
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                                <Text style={styles.petName}>{user.petName}</Text>
                                <Text style={styles.breed}>{user.Breed} • {user.PetType}</Text>
                                <Text style={styles.phone}>{user.contact_number}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => router.navigate('/profile/edit')}
                        >
                            <Edit3 size={20} color="#B32113" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsContainer}>
                        <Text style={styles.sectionTitle}>Your Activity</Text>
                        <View style={styles.statsGrid}>
                            {stats.map((stat, index) => (
                                <TouchableWithoutFeedback onPress={() => router.navigate(stat.route)} >
                                    <View key={index} style={styles.statCard}>
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
                        <Text style={styles.version}>Version 1.0.0</Text>
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
    header: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    editButton: {
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    statsContainer: {
        padding: 20,
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
        gap: 12,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        width: (Platform.OS === 'web' ? 200 : '30%'),
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
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
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
    loginButton: {
        backgroundColor: '#B32113',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
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
        marginTop: 40,
    },
});