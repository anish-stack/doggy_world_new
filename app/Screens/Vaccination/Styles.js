import { StyleSheet, Dimensions } from "react-native"

const { width } = Dimensions.get("window")

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8FC",
    },
    header: {
        backgroundColor: "#ff6b6b",
        overflow: "hidden",
    },
    headerImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    headerTitle: {
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        color: "#FFF",
        fontSize: 24,
        fontWeight: "bold",
    },
    scrollContent: {

        paddingBottom: 100,
    },
    contentContainer: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    forage: {
        fontSize: 16,
        color: "#666",
        marginBottom: 16,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    price: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#cc5656",
    },
    strikePrice: {
        fontSize: 20,
        color: "#999",
        textDecorationLine: "line-through",
        marginLeft: 12,
    },
    discountBadge: {
        backgroundColor: "#FF6B6B",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    discountText: {
        color: "#FFF",
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
    },
    vaccineListContainer: {
        marginBottom: 24,
    },
    vaccineItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#FFF",
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    vaccineIcon: {
        marginRight: 12,
    },
    vaccineName: {
        fontSize: 16,
        color: "#333",
        flex: 1,
    },
    descriptionContainer: {
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    description: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
    },
    addToCartButton: {
        position: "absolute",
        bottom: 24,
        left: 24,
        right: 24,
        backgroundColor: "#cc5656",
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#cc5656",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addedToCartButton: {
        backgroundColor: "#ff6b6b",
    },
    addToCartText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        marginRight: 8,
    },
    notification: {
        position: "absolute",
        top: 60,
        left: 24,
        right: 24,
        backgroundColor: "#cc5656",
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    notificationText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 18,
        textAlign: "center",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },
    optionButton: {
        width: "100%",
        padding: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        marginVertical: 5,
        alignItems: "center",
    },
    selectedOption: {
        borderColor: "#ff6b6b",
        backgroundColor: "#ffebeb",
    },
    confirmButton: {
        backgroundColor: "#ff6b6b",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        width: "100%",
        alignItems: "center",
    },
    confirmText: {
        color: "#fff",
        fontWeight: "bold",
    },
    modalContainers: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 10,

    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        backgroundColor: '#ff4d4d',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

})

export default styles

