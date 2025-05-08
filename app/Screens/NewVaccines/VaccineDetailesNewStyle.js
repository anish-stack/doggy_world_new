import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        paddingBottom: 80, // Space for action bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        marginTop: 8,
        marginBottom: 16,
        fontSize: 16,
        color: '#d32f2f',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    backButton: {
        backgroundColor: '#333',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '600',
    },

    // Carousel Styles
    carouselContainer: {
        position: 'relative',
        backgroundColor: '#fff',
    },
    carouselItemContainer: {
        width: screenWidth,
        height: 300,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#d32f2f',
        width: 12,
        height: 8,
    },
    tagContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: 'rgba(211, 47, 47, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        zIndex: 10,
    },
    tagText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Info Section Styles
    infoContainer: {
        backgroundColor: '#fff',
        padding: 16,
        marginTop: 8,
        borderRadius: 12,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    smallDesc: {
        fontSize: 16,
        color: '#555',
        lineHeight: 22,
        marginBottom: 16,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    discountPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d32f2f',
    },
    originalPrice: {
        fontSize: 18,
        color: '#888',
        textDecorationLine: 'line-through',
        marginLeft: 12,
    },
    offPercentage: {
        fontSize: 14,
        color: '#388e3c',
        fontWeight: 'bold',
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: '#e8f5e9',
        borderRadius: 4,
    },

    // Location Type Selection
    locationTypeContainer: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    locationTypeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    locationTypeOptions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 12,
    },
    locationTypeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    locationTypeOptionSelected: {
        backgroundColor: '#d32f2f',
        borderColor: '#d32f2f',
    },
    locationTypeText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    locationTypeTextSelected: {
        color: '#fff',
    },
    locationNoteText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },

    // What's Included Section
    includedSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    includedItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    checkIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    includedText: {
        fontSize: 15,
        color: '#444',
        flex: 1,
        lineHeight: 20,
    },

    // Description Section
    descriptionSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    descriptionText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
    },

    // For Age Section
    forAgeSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    forAgeText: {
        fontSize: 15,
        color: '#444',
    },

    // Pet Type Section
    petTypeSection: {
        marginBottom: 16,
    },
    petTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    petTypeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ffcdd2',
    },
    petTypeText: {
        color: '#d32f2f',
        fontSize: 14,
        marginLeft: 6,
        fontWeight: '500',
    },

    // Related Products Section
    relatedSection: {
        padding: 16,
        backgroundColor: '#fff',
        marginTop: 8,
        marginBottom: 8,
        marginHorizontal: 8,
        borderRadius: 12,
    },
    relatedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    relatedScrollContent: {
        paddingRight: 16,
    },
    relatedCard: {
        width: 130,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
    },
    relatedCardImage: {
        width: '100%',
        height: 100,
    },
    relatedCardContent: {
        padding: 8,
    },
    relatedCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    relatedCardPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#d32f2f',
    },

    // Bottom Action Bar
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 5,
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: '#607d8b',
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addToCartText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    bookNowButton: {
        flex: 1.5,
        backgroundColor: '#d32f2f',
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookNowText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

