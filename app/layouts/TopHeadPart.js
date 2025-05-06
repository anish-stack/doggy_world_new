import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import PropTypes from 'prop-types'

export default function TopHeadPart({ icon, title, fnc }) {
    const navigation = useNavigation()

    // Safe function execution to prevent errors
    const handlePress = () => {
        try {
            if (typeof fnc === 'function') {
                fnc();
            } else {
                console.warn("fnc prop is not a function");
            }
        } catch (error) {
            console.error("Error executing fnc:", error);
        }
    }

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <MaterialIcons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.headerTitle}>
                {typeof title === "string" ? title : "Default Text"}
            </Text>
            <TouchableOpacity style={styles.supportButton} onPress={handlePress} activeOpacity={0.7}>
                <MaterialIcons name={typeof icon === "string" ? icon : "support-agent"} size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    )
}

// Default Props
TopHeadPart.defaultProps = {
    icon: "support-agent",
    title: "Default Text",
    fnc: () => console.log("Default function executed"),
}

// Prop Types for Error Prevention
TopHeadPart.propTypes = {
    icon: PropTypes.string,
    title: PropTypes.string,
    fnc: PropTypes.func,
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        flex: 1,  // Ensures title does not overflow
        textAlign: "center",
    },
    supportButton: {
        backgroundColor: "#D22B2B",
        padding: 8,
        borderRadius: 20,
    },
})
