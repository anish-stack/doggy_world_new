import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function SingleBlog() {
    const navigation = useNavigation();
    const route = useRoute();
    const { blog } = route.params;

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${blog.title}\n\n${blog.description}\n\nRead more at Doggy World Care`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const renderContent = (content) => {
        return content.split('\n').map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
                {paragraph}
            </Text>
        ));
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Image
                        source={{ uri: blog.blogImage?.url }}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent']}
                        style={styles.headerGradient}
                    >
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => navigation.goBack()}
                            >
                                <MaterialIcons name='arrow-left' color="#fff" size={24} />
                                {/* <ArrowLeft color="#fff" size={24} /> */}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={handleShare}
                            >
                                  <MaterialIcons name='share' color="#fff" size={24} />
                                {/* <Share2 color="#fff" size={24} /> */}
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>{blog.title}</Text>

                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                        <MaterialIcons name='calendar-today' color="#666" size={24} />
                       
                            <Text style={styles.metaText}>
                                {formatDate(blog.createdAt)}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                        <MaterialIcons name='lock-clock' color="#666" size={24} />
                           
                            <Text style={styles.metaText}>5 min read</Text>
                        </View>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.description}>{blog.description}</Text>
                    </View>
                    {blog.Blog_second_image?.url && (
                        <Image
                            source={{ uri: blog.Blog_second_image.url }}
                            style={styles.secondaryImage}
                        />
                    )}
                    <View style={styles.mainContent}>
                        {renderContent(blog.content)}
                        {blog.content_2 && (
                            <>
                                <View style={styles.divider} />
                                {renderContent(blog.content_2)}
                            </>
                        )}
                    </View>


                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        height: 300,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        paddingTop: 40,
        paddingHorizontal: 20,
    },
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
        marginTop: -40,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    meta: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    metaText: {
        marginLeft: 6,
        color: '#666',
        fontSize: 14,
    },
    descriptionContainer: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        color: '#1A1A1A',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    mainContent: {
        marginBottom: 24,
    },
    paragraph: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E9ECEF',
        marginVertical: 24,
    },
    secondaryImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 24,
    },
});