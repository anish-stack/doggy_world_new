import React, { useEffect, useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    Dimensions, 
    ScrollView,
    Animated,
    Platform
} from 'react-native';
import axios from 'axios';
import Card from '../card/Card';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

// SVG Pattern Component
const BackgroundPattern = () => (
    <Svg height="100%" width="100%" style={styles.svgPattern} viewBox="0 0 800 800" preserveAspectRatio="xMinYMin slice">
        <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#f9f9f9" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#f0f0f0" stopOpacity="0.4" />
            </LinearGradient>
        </Defs>
        <Path
            d="M30,10 Q50,30 30,50 Q10,70 30,90 Q50,110 30,130 Q10,150 30,170 Q50,190 30,210"
            stroke="#E0E0E0"
            strokeWidth="3"
            fill="none"
            transform="translate(0,0)"
        />
        <Path
            d="M130,10 Q150,30 130,50 Q110,70 130,90 Q150,110 130,130 Q110,150 130,170 Q150,190 130,210"
            stroke="#E0E0E0"
            strokeWidth="3"
            fill="none"
            transform="translate(0,0)"
        />
        <Path
            d="M80,0 Q100,20 80,40 Q60,60 80,80 Q100,100 80,120 Q60,140 80,160 Q100,180 80,200"
            stroke="#F0F0F0"
            strokeWidth="4"
            fill="none"
            transform="translate(100,5)"
        />
        <Path
            d="M230,10 Q250,30 230,50 Q210,70 230,90 Q250,110 230,130 Q210,150 230,170 Q250,190 230,210"
            stroke="#E8E8E8"
            strokeWidth="2"
            fill="none"
            transform="translate(-50,50)"
        />
        {/* Circles */}
        <Path
            d="M0,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0"
            fill="#F0F0F0"
            transform="translate(50,300)"
        />
        <Path
            d="M0,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0"
            fill="#E0E0E0"
            transform="translate(200,150)"
        />
        <Path
            d="M0,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0"
            fill="#E0E0E0"
            transform="translate(300,350)"
        />
        <Path
            d="M0,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0"
            fill="#F0F0F0"
            transform="translate(90,400)"
        />
    </Svg>
);

export default function Categories({ Refresh }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const translateY = useState(new Animated.Value(20))[0];

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Categories refreshing");
                setLoading(true);
                
                // Reset animations when refreshing
                fadeAnim.setValue(0);
                translateY.setValue(20);
                
                const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-main-pet-category`);
                setData(response.data.data);
                
                // Start animations after data is loaded
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true
                    })
                ]).start();
                
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [Refresh, fadeAnim, translateY]);

    const memoizedData = useMemo(() => {
        if (!data) return [];
        return data
            .filter((item) => item.position !== undefined)
            .sort((a, b) => a.position - b.position);
    }, [data]);

    // Calculate number of columns based on screen size
    const numColumns = useMemo(() => {
        if (width <= 320) return 3; // Small phones
        if (width <= 480) return 3; // Regular phones
        if (width <= 768) return 4; // Large phones
        if (width <= 1024) return 5; // Tablets
        return 6; // Large tablets
    }, []);

    // Create rows of data
    const rows = useMemo(() => {
        if (!memoizedData.length) return [];
        
        const result = [];
        for (let i = 0; i < memoizedData.length; i += numColumns) {
            result.push(memoizedData.slice(i, i + numColumns));
        }
        return result;
    }, [memoizedData, numColumns]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <BackgroundPattern />
                <ActivityIndicator size="large" color="#B32113" />
                <Text style={styles.loadingText}>Loading Categories...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background Pattern */}
            <BackgroundPattern />
            
            {/* Header */}
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Pet Services</Text>
                <Text style={styles.headerSubtitle}>Choose what your pet needs</Text>
            </View>
            
            {/* Categories Grid */}
            <Animated.View 
                style={[
                    styles.cardsContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: translateY }]
                    }
                ]}
            >
                {memoizedData && memoizedData.length > 0 ? (
                    <ScrollView 
                        horizontal={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {rows.map((row, rowIndex) => (
                            <View key={`row-${rowIndex}`} style={styles.row}>
                                {row.map((item, colIndex) => (
                                    <View 
                                        key={`item-${rowIndex}-${colIndex}`} 
                                        style={[
                                            styles.cardWrapper,
                                           
                                        ]}
                                    >
                                        <Card data={item} />
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No Categories Available</Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        textAlign:'center',
        width: width,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 15,
        overflow: 'hidden',
       
    },
    svgPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.5,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    headerTitle: {
        fontSize: isTablet ? 22 : 18,
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: isTablet ? 16 : 13,
        color: '#777',
        marginTop: 4,
    },
    loaderContainer: {
        width: width,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
       
    },
    loadingText: {
        marginTop: 15,
        color: '#555',
        fontSize: isTablet ? 16 : 14,
        fontWeight: '500',
    },
    cardsContainer: {
        textAlign:'center',
        padding: 10,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        paddingBottom: 10,
    },
    row: {
       
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
    },
    cardWrapper: {
        marginBottom: 5,
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
    },
    noDataText: {
        fontSize: isTablet ? 18 : 15,
        color: '#888',
        textAlign: 'center',
    },
});