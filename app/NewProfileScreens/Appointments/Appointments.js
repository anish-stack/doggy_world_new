
import { useState, useCallback } from "react"
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import TopHeadPart from "../../layouts/TopHeadPart"
import { API_END_POINT_URL_LOCAL } from "../../constant/constant"
import { getUser } from "../../hooks/getUserHook"
import { useToken } from "../../hooks/useToken"
import ConsultationCard from "./components/ConsultationCard"
import FilterBar from "./components/FilterBar"
import EmptyState from "./components/EmptyState"
import { showMessage } from "react-native-flash-message"

export default function Appointments() {
  const { user, refreshUser, loading: userLoading } = getUser()
  const { token, isLoggedIn } = useToken()
  const navigation = useNavigation()

  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState("all") // 'all', 'upcoming', 'completed', 'cancelled'

  const fetchConsultations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_END_POINT_URL_LOCAL}/api/v1/pet-profile-consultations-booking/681b0e18d9f50dd601cab7db`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setConsultations(result.data)
        // Check for upcoming consultations to notify
        checkUpcomingConsultations(result.data)
      } else {
        showMessage({
          message: "Error",
          description: result.message || "Failed to fetch consultations",
          type: "danger",
        })
      }
    } catch (error) {
      console.error("Error fetching consultations:", error)
      showMessage({
        message: "Error",
        description: "Something went wrong. Please try again.",
        type: "danger",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const checkUpcomingConsultations = (data) => {
    const now = new Date()

    data.forEach((consultation) => {
      if (consultation.status === "Confirmed") {
        const [hours, minutes] = consultation.time.split(" - ")[0].split(":")
        const [hourValue, period] = hours.split(" ")

        let hour = Number.parseInt(hourValue)
        if (period === "PM" && hour !== 12) hour += 12
        if (period === "AM" && hour === 12) hour = 0

        const consultDate = new Date(consultation.date)
        consultDate.setHours(hour, Number.parseInt(minutes))

        const timeDiff = (consultDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        if (timeDiff > 0 && timeDiff <= 3) {
          showMessage({
            message: "Upcoming Consultation",
            description: `You have a consultation with ${consultation.doctorId.name} in ${Math.round(timeDiff)} hours`,
            type: "info",
            duration: 5000,
          })
        }
      }
    })
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchConsultations()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchConsultations()
      } else {
        navigation.navigate("Login")
      }
    }, [isLoggedIn]),
  )

  const filteredConsultations = () => {
    switch (filter) {
      case "upcoming":
        return consultations.filter((c) => c.status === "Confirmed")
      case "completed":
        return consultations.filter((c) => c.status === "Completed")
      case "cancelled":
        return consultations.filter((c) => c.status === "Cancelled")
      default:
        return consultations
    }
  }

  const handleViewConsultation = (consultation) => {
    navigation.navigate("ConsultationDetail", { consultation })
  }

  return (
    <View style={styles.container}>
      <TopHeadPart title="Your Consultations 🐾" icon="information-circle-outline" />

      <View style={styles.content}>
        <FilterBar activeFilter={filter} setFilter={setFilter} />

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6A5AE0" />
            <Text style={styles.loadingText}>Fetching your pet consultations...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredConsultations()}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ConsultationCard consultation={item} onPress={() => handleViewConsultation(item)} />
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6A5AE0"]} />}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<EmptyState filter={filter} />}
          />
        )}
      </View>

      <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate("BookConsultation")}>
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.bookButtonText}>Book New Consultation</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  content: {

    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContainer: {
     paddingHorizontal: 4,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  bookButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#6A5AE0",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
})
