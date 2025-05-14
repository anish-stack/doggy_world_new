import { Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"

const FilterBar = ({ activeFilter, setFilter }) => {
  const filters = [
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ]

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[styles.filterButton, activeFilter === filter.id && styles.activeFilterButton]}
          onPress={() => setFilter(filter.id)}
        >
          <Text style={[styles.filterText, activeFilter === filter.id && styles.activeFilterText]}>{filter.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height:40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#F0F0F0",
  },
  activeFilterButton: {
    backgroundColor: "#6A5AE0",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeFilterText: {
    color: "white",
  },
})

export default FilterBar
