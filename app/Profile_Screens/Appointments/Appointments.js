import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { getUser } from "../../hooks/getUserHook";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import ReviewModal from "../../components/ReviewModel/ReviewModel";

export default function Appointments() {
  const navigation = useNavigation();
  const { orderData, getUserFnc, loading, error } = getUser();
  const [consultations, setConsultations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [openRateModel, setOpenRateModel] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'upcoming', 'completed', 'cancelled'

  useEffect(() => {
    if (orderData) {
      setConsultations(orderData?.consultationBookings || []);
    }
  }, [orderData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      getUserFnc();
      setRefreshing(false);
    }, 1500);
  }, [getUserFnc]);

  const filteredConsultations = () => {
    switch (filterType) {
      case "upcoming":
        return consultations.filter((item) => !item.is_consultation_complete && !item.isBookingCancel);
      case "completed":
        return consultations.filter((item) => item.is_consultation_complete);
      case "cancelled":
        return consultations.filter((item) => item.isBookingCancel);
      default:
        return consultations;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes.substring(0, 2)} ${ampm}`;
  };

  const handleReview = (item) => {
    setSelectedAppointment(item);
    setOpenRateModel(true);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF3A3D" />
        <Text style={styles.loadingText}>Loading your appointments...</Text>
      </View>
    );
  }

  const renderAppointmentCard = ({ item }) => {
    const consultation = item.consultation || {};
    const doctor = item.doctor || {};
    const pet = item.pet || {};

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <FontAwesome name="stethoscope" size={16} color="#FF3A3D" />
            <Text style={styles.consultationType}>{consultation.name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.is_consultation_complete
                ? styles.completedBadge
                : item.isBookingCancel
                  ? styles.cancelledBadge
                  : styles.upcomingBadge,
            ]}
          >
            <Text style={[
              styles.statusText,
              item.is_consultation_complete
                ? styles.completedText
                : item.isBookingCancel
                  ? styles.cancelledText
                  : styles.upcomingText,
            ]}>
              {item.is_consultation_complete ? "Completed" : item.isBookingCancel ? "Cancelled" : "Upcoming"}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="pets" size={18} color="#666" />
            <Text style={styles.infoText}>
              {pet.petName} ({pet.PetType})
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={18} color="#666" />
            <Text style={styles.infoText}>{doctor.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={18} color="#666" />
            <Text style={styles.infoText}>{formatDate(item.Date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="access-time" size={18} color="#666" />
            <Text style={styles.infoText}>
              {formatTime(item.Time)} ({item.period})
            </Text>
          </View>

          {item?.is_consultation_complete && item?.is_rate_done && (
            <View style={styles.ratingContainer}>
              <View style={styles.infoRow}>
                <MaterialIcons name="star" size={18} color="#FFB400" />
                <Text style={styles.ratingText}>
                  Thank you for rating our service {item?.consulation_rate} stars!
                </Text>
              </View>
              <Text style={styles.feedbackText}>Your feedback means the world to us. 🌟</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate("AppointmentDetails", { appointment: item })}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>

          {item?.is_consultation_complete && !item?.is_rate_done && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => handleReview(item)}
            >
              <MaterialIcons name="star" size={16} color="#FF3A3D" />
              <Text style={styles.rateButtonText}>Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Appointments</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#FF3A3D" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, filterType === "all" && styles.activeFilter]}
            onPress={() => setFilterType("all")}
          >
            <Text style={[styles.filterText, filterType === "all" && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "upcoming" && styles.activeFilter]}
            onPress={() => setFilterType("upcoming")}
          >
            <Text style={[styles.filterText, filterType === "upcoming" && styles.activeFilterText]}>Upcoming</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "completed" && styles.activeFilter]}
            onPress={() => setFilterType("completed")}
          >
            <Text style={[styles.filterText, filterType === "completed" && styles.activeFilterText]}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === "cancelled" && styles.activeFilter]}
            onPress={() => setFilterType("cancelled")}
          >
            <Text style={[styles.filterText, filterType === "cancelled" && styles.activeFilterText]}>Cancelled</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {filteredConsultations().length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-busy" size={70} color="#FFD6D7" />
          <Text style={styles.emptyTitle}>No appointments found</Text>
          <Text style={styles.emptyText}>Pull down to refresh or try a different filter</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConsultations()}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF3A3D"]}
              tintColor="#FF3A3D"
              title="Refreshing..."
              titleColor="#FF3A3D"
            />
          }
        />
      )}

      <ReviewModal
        open={openRateModel}
        close={() => setOpenRateModel(false)}
        appointment={selectedAppointment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5E5",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF3A3D",
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FFF0F0",
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5E5",
  },
  filterScrollContent: {
    paddingHorizontal: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD6D7",
  },
  activeFilter: {
    backgroundColor: "#FF3A3D",
    borderColor: "#FF3A3D",
  },
  filterText: {
    color: "#FF3A3D",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "white",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5E5",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  consultationType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF3A3D",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: "#E5F8FF",
    borderWidth: 1,
    borderColor: "#C5E8FF",
  },
  completedBadge: {
    backgroundColor: "#E5FFE8",
    borderWidth: 1,
    borderColor: "#C5FFCB",
  },
  cancelledBadge: {
    backgroundColor: "#FFE5E5",
    borderWidth: 1,
    borderColor: "#FFCBCB",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  upcomingText: {
    color: "#0085C5",
  },
  completedText: {
    color: "#00A32A",
  },
  cancelledText: {
    color: "#D30000",
  },
  cardBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
  },
  ratingContainer: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFE7A0",
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
  feedbackText: {
    marginLeft: 26,
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsButton: {
    backgroundColor: "#FF3A3D",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  rateButton: {
    backgroundColor: "white",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3A3D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  rateButtonText: {
    color: "#FF3A3D",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 4,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FF3A3D",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3A3D",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: "#FF3A3D",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
});
