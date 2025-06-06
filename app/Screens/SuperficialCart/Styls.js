import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c24d43',
    marginBottom: 12,
  }, emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  emptyCartImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
    // tintColor: '#bb372c',
  },
  emptyCartTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#bb372c',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCartDescription: {
    fontSize: 16,
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  serviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    width: '47%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ca645b',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceText: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: '#ca645b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  testDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00C853',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#90A4AE',
    textDecorationLine: 'line-through',
  },
  removeButton: {
    padding: 8,
  },
  offerCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bb372c',
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7d170e',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8EAF6',
  },
  appliedButton: {
    backgroundColor: '#120302',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F51B5',
  },
  appliedButtonText: {
    color: '#FFFFFF',
  },
  offerDetails: {
    fontSize: 14,
    color: '#546E7A',
  },
  homeCollectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0d3d0',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
  },
  homeCollectionIcon: {
    width: 48,
    height: 48,
    // tintColor: '#ca645b',
  },
  homeCollectionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  homeCollectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a11e12',
    marginBottom: 4,
  },
  homeCollectionSubtitle: {
    fontSize: 14,
    color: '#000',
  },
  clinicCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedClinicCard: {
    borderColor: '#3F51B5',
    borderWidth: 2,
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ca645b',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFA000',
  },
  clinicAddress: {
    fontSize: 14,
    color: '#546E7A',
    marginBottom: 4,
  },
  clinicTime: {
    fontSize: 14,
    color: '#a11e12',
    fontWeight: '500',
  },
  timingContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  timingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c24d43',
    marginBottom: 16,
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedTimeSlot: {
    borderColor: '#3F51B5',
    backgroundColor: '#E8EAF6',
  },
  ultrasoundSlot: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  timeSlotLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 4,
  },
  timeSlotTime: {
    fontSize: 14,
    color: '#546E7A',
  },
  priceBreakdown: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceBreakdownTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#546E7A',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a11e12',
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a11e12',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a11e12',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#a11e12',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ca645b',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  test_type: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ca645b',

  },
  containers: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    marginBottom:12,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#fff',
    padding: 4,
    borderRadius: 8,

  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#4630EB',
    marginRight: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flexShrink: 1,
  },
});

export default styles;