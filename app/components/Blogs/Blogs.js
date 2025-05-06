import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

import { LinearGradient } from 'expo-linear-gradient';
import SectionTitle from '../PartHeader.js/SectionTitle';

const { width } = Dimensions.get('window');

export default function Blogs() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/Blogs?populate=*');
            setBlogs(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Loading amazing pet stories...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            <View style={styles.featuredSection}>

                <SectionTitle
                    title="Featured Blogs"
                    subtitle="Learn and Explore What Your Furry Friend Wants"
                    variant="primary"
                    style={{ marginBottom: 20 }}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featuredContainer}
                >
                    
                    {blogs.slice(0, 3).map((blog, index) => (
                        <View>
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                style={styles.featuredCard}
                                onPress={() => navigation.navigate('single-blog', { blog })}
                            >
                                <Image
                                    source={{ uri: blog.blogImage?.url }}
                                    style={styles.featuredImage}
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.featuredGradient}

                                >
                                    <Text style={styles.featuredTitle} numberOfLines={2}>
                                        {blog.title}
                                    </Text>
                                    <View style={styles.featuredMeta}>
                                        {/* <Calendar size={14} color="#fff" /> */}
                                        <Text style={styles.featuredDate}>
                                            {formatDate(blog.createdAt)}
                                        </Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        padding: 24,
        paddingTop: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    featuredSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        // marginBottom: 16,
    },
    featuredContainer: {
        paddingRight: 20,
    },
    featuredCard: {
        width: width * 0.8,
        height: 250,
        marginRight: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    featuredGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    featuredMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredDate: {
        color: '#fff',
        marginLeft: 6,
        fontSize: 14,
    },
    allBlogsSection: {
        padding: 20,
    },
    blogCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    blogImage: {
        width: '100%',
        height: 200,
    },
    blogContent: {
        padding: 16,
    },
    blogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    blogDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    blogMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#666',
    },
});