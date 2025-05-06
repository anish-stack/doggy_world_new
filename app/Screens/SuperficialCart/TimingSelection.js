import { View, Text ,TouchableOpacity} from 'react-native'
import React from 'react'
import styles from './Styls';

export default function TimingSelection({ selectedClinic, selectedTime, onSelectTime, test }) {
    const isAnyTestIsUltra = test.some((item) => item.isUltraSound);
    const getTimings = () => {
        if (selectedClinic?.documentId === 'r9qel0puc15klzfz7rj3mra9') {
          return [
            ...(isAnyTestIsUltra ? [{
              time: "11:30 - 2:30",
              label: "Ultrasound Time",
              type: "ultrasound"
            }] : []),
            {
              time: "10:00AM - 9:00PM",
              label: "Regular Hours",
              type: "normal"
            }
          ];
        }
        return [
          {
            time: "10:00AM - 2:00PM",
            label: "Morning",
            type: "normal"
          },
          {
            time: "5:00PM - 9:00PM",
            label: "Evening",
            type: "normal"
          }
        ];
      };
  return (
    <View style={styles.timingContainer}>
    <View
      style={{
        backgroundColor: "#ff5252",
        paddingVertical: 5,
        paddingHorizontal: 15,
        marginBottom: 10,
        borderRadius: 20,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "bold",
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        Available Time Slots
      </Text>
    </View>

    <View style={styles.timingGrid}>
      {getTimings().map((timing, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.timeSlot,
            selectedTime === timing.time && styles.selectedTimeSlot,
            timing.type === 'ultrasound' && styles.ultrasoundSlot
          ]}
          onPress={() => onSelectTime(timing.time)}
        >
          <Text style={styles.timeSlotLabel}>{timing.label}</Text>
          <Text style={styles.timeSlotTime}>{timing.time}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
  )
}