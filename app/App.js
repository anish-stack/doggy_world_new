import { View, StyleSheet, StatusBar } from "react-native";
import * as Sentry from "@sentry/react-native";
import './context/firebaseConfig';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider, useSelector } from "react-redux";
import { store } from "./redux/store";
import Toast from "react-native-toast-message";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import * as SplashScreen from "expo-splash-screen";
import LottieView from "lottie-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import axios from "axios";
import { API_END_POINT_URL_LOCAL } from "./constant/constant";

// Import all screens
import Home from "./Screens/Home/Home";
import Register from "./Screens/auth/register/register";
import Login from "./Screens/auth/login/login";
import Otp from "./Screens/auth/register/otp";
import ForgetPassword from "./Screens/auth/login/ForgetPassword";
import SearchScreen from "./Screens/Search/SearchScreen";
import Bakery from "./Screens/Services/Bakery/Bakery";
import Consultation from "./Screens/consultation/Consultation";
import BookingConsultation from "./Screens/consultation/Booking.consultation";
import ThankYouPage from "./Screens/consultation/ThankyouPage";
import Grooming from "./Screens/Grooming/Grooming";
import AllGroomingServices from "./Screens/Grooming/AllGroomingServices";
import CustomPackage from "./Screens/Grooming/CustomPackage";
import Clinic from "./Screens/clinic/Clinic";
import BookingStep from "./Screens/Grooming/BookingStep/BookingStep";
import CakesScreen from "./Screens/Services/Bakery/Categories/Cakes.Screen";
import CakeDelivery from "./Screens/Services/Bakery/Categories/Cake.Type";
import Dynamicscreen from "./Screens/Services/Bakery/Dynamic_Screen/Dynamic_screen";
import ProductDetails from "./Screens/Services/Bakery/Dynamic_Screen/ProductDetails";
import Cart from "./Screens/Cart/Cart";
import Offers from "./Screens/Cart/Offers";
import PetShop from "./Screens/Pet_Shop/PetShop";
import Dynamic_Shop from "./Screens/Pet_Shop/_Shop/Dynamic_Shop";
import Dynmaic_Products_Shop from "./Screens/Pet_Shop/_Shop/Dynmaic_Products_Shop";
import Dynamic_Details_Shop from "./Screens/Pet_Shop/_Shop/Dynamic_Details_Shop";
// import Lab_Test from "./Screens/Labs/Lab_Test";
// import Lab_Clinic from "./Screens/Labs/Lab_Clinic";
// import TestPage from "./Screens/Labs/TestPage";
// import Book_Test from "./Screens/Labs/Book_Test";
// import Single_Test from "./Screens/Labs/Single_Test";
import SuperficialNoter from "./Screens/SuperficialCart/SuperficialNoter";
import SuperficialCart from "./Screens/SuperficialCart/SuperficialCart";
// import Vaccinations from "./Screens/Vaccination/Vaccinations";
// import VaccineDetails from "./Screens/Vaccination/VaccineDetails";
// import Vaccination from "./Screens/Vaccination/Vaccination";
// import BookVaccination from "./Screens/Vaccination/BookVaccination";
import Coming_soon from "./Screens/Coming_soon/Coming_soon";
import Physiotherapy from "./Screens/Physiotherapy/Physiotherapy";
import PhysiotherapyDetails from "./Screens/Physiotherapy/PhysiotherapyDetails";
import New_Tests from "./Labs/New_Tests";
import Booking_Test_Confirm from "./Screens/SuperficialCart/Booking_Test_Confirm";
import Address from "./Screens/Cart/Address";
import SingleBlog from "./components/Blogs/SingleBlog";
import Order_Confirmation from "./Screens/Services/Bakery/Categories/Order_Confirmation";
import Orderconfirm from "./Screens/Cart/Orderconfirm";
import Profile from "./Profile_Screens/Profile/Profile";

import Grooming_Sessions from "./Profile_Screens/Grooming_Sessions/Grooming_Sessions";
import Cakes_order from "./Profile_Screens/Cakes_order/Cakes_order";
import Lab from "./Profile_Screens/Orders/lab/Lab";
import Help_Support from "./Profile_Screens/Help_Support/Help_Support";
import AppointmentDetails from "./Profile_Screens/Appointments/AppointmentDetails";
import NotFoundScreen from "./NotFoundScreen";
import ErrorBoundaryWrapper from "./ErrorBoundary";
import NotificationScreen from "./layouts/NotificationScreen";
import SingleCakeOrder from "./Profile_Screens/Cakes_order/SingleCakeOrder";
import Physio from "./Profile_Screens/Orders/Physio/Physio";
import ViewPhysioDetails from "./Profile_Screens/Orders/Physio/ViewPhysioDetails";
import ViewLabDetails from "./Profile_Screens/Orders/lab/ViewLabDetails";
import PetShopOrders from "./Profile_Screens/Orders/petShopOrders/PetShopOrders";
import ViewPetShopOrder from "./Profile_Screens/Orders/petShopOrders/ViewPetShopOrder";
import { getUser } from "./hooks/getUserHook";
import useNotificationPermission from "./hooks/notification";
import VaccinedTypes from "./Screens/Vaccination/VaccinedTypes";
import VaccinesShows from "./Screens/NewVaccines/VaccinesShows";
import VaccineDetailsNew from "./Screens/NewVaccines/VaccineDetailsNew";
import BookingVaccine from "./Screens/NewVaccines/forInstantBooking/BookingVaccine";
import NewLabTypes from "./Screens/NewLabs/NewLabTypes";
import LabTestsShow from "./Screens/NewLabs/LabTestsShow";
import LabTestDetails from "./Screens/NewLabs/LabTestDetails";
import BookingLabTests from "./Screens/NewLabs/instantBooking/BookingLabTests";
import PhysioBooking from "./Screens/Physiotherapy/PhysioBooking";
import Orderthankyou from "./Screens/Pet_Shop/_Shop/Orderthankyou";
import CakeOrderThankyou from "./Screens/Services/Bakery/Categories/CakeOrderThankyou";
import Appointments from "./NewProfileScreens/Appointments/Appointments";
import ConsultationDetail from "./NewProfileScreens/Appointments/ConsultationDetail";

// Prevent SplashScreen from hiding automatically
SplashScreen.preventAutoHideAsync();

// Initialize Sentry
Sentry.init({
  dsn: "https://5b208c724079bf3e5789b51da0190912@o4508873810771970.ingest.us.sentry.io/4509020408643584",
  sendDefaultPii: true,
});

// Create stack navigator
const Stack = createNativeStackNavigator();

// Screen configurations to avoid redundancy
const screenConfigs = {

  noHeader: { headerShown: false },

  withTitle: (title) => ({ headerShown: true, title }),
};

// Main App component
const App = () => {
  const { refreshUser } = getUser();
  const navigationContainerRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState("");
  const { labTestsCount } = useSelector((state) => state.labCart);
  const [showGif, setShowGif] = useState(false);
  const { isGranted, requestPermission, deviceId, fcmToken } = useNotificationPermission();

  // Track route change
  const handleNavigationStateChange = useCallback(() => {
    if (navigationContainerRef.current) {
      const route = navigationContainerRef.current.getCurrentRoute();
      if (route) {
        setCurrentRoute(route.name);
        console.log("Navigated to route:", route.name);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigationContainerRef.current?.addListener(
      "state",
      handleNavigationStateChange
    );

    // Initial call
    handleNavigationStateChange();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleNavigationStateChange]);

  // Show GIF if labTestsCount > 0
  useEffect(() => {
    if (labTestsCount > 0) {
      console.log("Lab tests added:", labTestsCount);
      setShowGif(true);

      const timer = setTimeout(() => {
        setShowGif(false);
        console.log("GIF hidden after 3s");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [labTestsCount]);

  // Send FCM token to server
  const sendTokenOfFcm = async (data) => {
    console.log("Sending FCM token to server:", data);
    try {
      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/Fcm/register`, data);
      console.log("FCM token sent successfully:", response.data);
    } catch (error) {
      console.log("❌ FCM registration error:", error?.response?.data || error.message);
    }
  }

  // Handle notification permission
  const handleRequestNotificationPermission = useCallback(async () => {
    console.log("Requesting notification permission...");
    try {
      const granted = await requestPermission();
      console.log("Notification permission granted:", granted);

      if (granted && deviceId) {
        const data = { fcmToken, deviceId };
        sendTokenOfFcm(data);
      } else {
        console.log("Notification not granted or deviceId missing");
      }
    } catch (error) {
      console.log("❌ Notification permission error:", error);
    }
  }, [requestPermission, deviceId, sendTokenOfFcm]);

  // App initialization effect
  useEffect(() => {
    const loadApp = async () => {
      console.log("🔄 App initialization started...");
      try {
        await refreshUser();
        console.log("✅ User refreshed");

        await handleRequestNotificationPermission();

        await new Promise((resolve) => setTimeout(resolve, 2000));
        await SplashScreen.hideAsync();
        console.log("✅ Splash screen hidden, app ready");
      } catch (error) {
        console.log("❌ App initialization error:", error);
        SplashScreen.hideAsync();
      }
    };

    loadApp();
  }, []);

  // Determine whether to show the notifier
  const shouldShowNoter = useMemo(() => {
    const result =
      labTestsCount > 0 &&
      currentRoute !== "labCart" &&
      currentRoute !== "Booking_Test_Confirm";
    console.log("shouldShowNoter:", result);
    return result;
  }, [labTestsCount, currentRoute]);

  // Conditional overlay rendering
  const renderOverlay = useMemo(() => {
    if (!showGif || currentRoute === "labCart" || currentRoute === "Booking_Test_Confirm") {
      return null;
    }

    console.log("🎉 Showing confetti overlay");
    return (
      <View style={styles.overlay}>
        <LottieView
          source={require("./confeti.json")}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
      </View>
    );
  }, [showGif, currentRoute]);

  return (
    <NavigationContainer ref={navigationContainerRef}>
      <SafeAreaProvider>

        <Stack.Navigator>
          {/* Home Screen */}
          <Stack.Screen name="Home" component={Home} options={screenConfigs.noHeader} />

          {/* Auth Screens */}
          <Stack.Screen name="register" component={Register} options={{ ...screenConfigs.noHeader, title: "Register Your Pet" }} />
          <Stack.Screen name="login" component={Login} options={{ ...screenConfigs.noHeader, title: "Welcome back" }} />
          <Stack.Screen name="otp" component={Otp} options={screenConfigs.noHeader} />
          <Stack.Screen name="forget-password" component={ForgetPassword} options={screenConfigs.noHeader} />

          {/* Searching Screens */}
          <Stack.Screen name="search" component={SearchScreen} options={screenConfigs.noHeader} />

          {/* Service Screens */}
          <Stack.Screen name="Bakery" component={Bakery} options={{ ...screenConfigs.noHeader, title: "Pet Bakery" }} />
          <Stack.Screen name="Consultation" component={Consultation} options={{ ...screenConfigs.noHeader, title: "Online Consultation" }} />
          <Stack.Screen name="Notifications" component={NotificationScreen} options={{ ...screenConfigs.noHeader, title: "Online Consultation" }} />
          <Stack.Screen name="next-step" component={BookingConsultation} options={screenConfigs.noHeader} />
          <Stack.Screen name="thankyou" component={ThankYouPage} options={screenConfigs.noHeader} />

          {/* Service Screens ===> Grooming */}
          <Stack.Screen name="Grooming" component={Grooming} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="Gromming_More_service" component={AllGroomingServices} options={screenConfigs.withTitle("View All Pacakages")} />
          <Stack.Screen name="Create_Custom_Service" component={CustomPackage} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="Book-Grooming" component={BookingStep} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />

          {/* Profile Screens authenticated */}
          <Stack.Screen name="Profile" component={Profile} options={{ ...screenConfigs.noHeader, title: "Profile" }} />
          <Stack.Screen name="Appointments" component={Appointments} options={{ ...screenConfigs.noHeader, title: "Appointments" }} />
          <Stack.Screen name="ConsultationDetail" component={ConsultationDetail} options={{ ...screenConfigs.noHeader, title: "Appointments" }} />
          <Stack.Screen name="Groomings" component={Grooming_Sessions} options={{ ...screenConfigs.noHeader, title: "My Grooming Sessions" }} />
          <Stack.Screen name="cakeorder" component={Cakes_order} options={{ ...screenConfigs.noHeader, title: "Cakes Order" }} />
          <Stack.Screen name="physioBookings" component={Physio} options={{ ...screenConfigs.noHeader, title: "Cakes Order" }} />
          <Stack.Screen name="ViewPhysioDetails" component={ViewPhysioDetails} options={{ ...screenConfigs.noHeader, title: "Cakes Order" }} />
          <Stack.Screen name="SingleCakeOrder" component={SingleCakeOrder} options={{ ...screenConfigs.noHeader, title: "Cakes Order" }} />
          <Stack.Screen name="labVaccinations" component={Lab} options={{ ...screenConfigs.noHeader, title: "Lab And Vaccinations" }} />
          <Stack.Screen name="ViewLabDetails" component={ViewLabDetails} options={{ ...screenConfigs.noHeader, title: "Lab And Vaccinations" }} />
          <Stack.Screen name="Orders" component={PetShopOrders} options={{ ...screenConfigs.noHeader, title: "Lab And Vaccinations" }} />
          <Stack.Screen name="ViewPetShopOrder" component={ViewPetShopOrder} options={{ ...screenConfigs.noHeader, title: "Lab And Vaccinations" }} />
          <Stack.Screen name="Support" component={Help_Support} options={screenConfigs.withTitle("Help & Support")} />

          {/* Pet Bakery Screens ===> Bakery */}
          <Stack.Screen name="Cake-Screen" component={CakesScreen} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="Cake-Delivery" component={CakeDelivery} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="Order_Confirmation" component={Order_Confirmation} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="CakeOrderThankyou" component={CakeOrderThankyou} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />

          {/* dynamic_screen */}
          <Stack.Screen name="dynamic_screen" component={Dynamicscreen} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="product_details" component={ProductDetails} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />

          {/* cart screen */}
          <Stack.Screen name="cart" component={Cart} options={{ ...screenConfigs.noHeader, title: "Cart" }} />
          <Stack.Screen name="Order-confirm" component={Orderconfirm} options={screenConfigs.noHeader} />
          <Stack.Screen name="Available_Offer" component={Offers} options={{ ...screenConfigs.noHeader, title: "AvailableOffer" }} />
          <Stack.Screen name="single-blog" component={SingleBlog} options={screenConfigs.noHeader} />
          <Stack.Screen name="Orderthankyou" component={Orderthankyou} options={screenConfigs.noHeader} />

          {/* Pet Shop Screen */}
          <Stack.Screen name="Pet_Shop" component={PetShop} options={{ ...screenConfigs.noHeader, title: "PetShop" }} />
          <Stack.Screen name="Dynamic_Shop" component={Dynamic_Shop} options={{ ...screenConfigs.noHeader, title: "Pet Shop" }} />
          <Stack.Screen name="Dynamic_Products_Shop" component={Dynmaic_Products_Shop} options={{ ...screenConfigs.noHeader, title: "Pet Shop" }} />
          <Stack.Screen name="Dynamic_Details_Shop" component={Dynamic_Details_Shop} options={{ ...screenConfigs.noHeader, title: "Pet Shop" }} />

          {/* select_address_and_order */}
          <Stack.Screen name="select_address_and_order" component={Address} options={screenConfigs.noHeader} />

          {/* Lab Test Screen */}

          {/* 
          <Stack.Screen name="lab_Clinic" component={Lab_Clinic} options={screenConfigs.noHeader} />
          <Stack.Screen name="TestPage" component={TestPage} options={screenConfigs.noHeader} />
          <Stack.Screen name="next-step_booking_lab" component={Book_Test} options={screenConfigs.noHeader} />
          <Stack.Screen name="TestSelection" component={Single_Test} options={screenConfigs.noHeader} /> */}
          <Stack.Screen name="labCart" component={SuperficialCart} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
          <Stack.Screen name="Booking_Test_Confirm" component={Booking_Test_Confirm} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />

          {/* New Lab Test Screens */}
          <Stack.Screen name="Lab" component={NewLabTypes} options={{ ...screenConfigs.noHeader }} />
          <Stack.Screen name="labtests" component={LabTestsShow} options={{ ...screenConfigs.noHeader }} />
          <Stack.Screen name="LabDetailsDetail" component={LabTestDetails} options={{ ...screenConfigs.noHeader }} />
          <Stack.Screen name="book-now-labtest" component={BookingLabTests} options={{ ...screenConfigs.noHeader }} />

          {/* vaccination */}
          <Stack.Screen name="vaccination" component={VaccinedTypes} options={{ ...screenConfigs.noHeader, title: "Lab Test" }} />
          <Stack.Screen name="vaccines" component={VaccinesShows} options={{ ...screenConfigs.noHeader, title: "vaccines" }} />
          <Stack.Screen name="VaccineDetail" component={VaccineDetailsNew} options={{ ...screenConfigs.noHeader, title: "VaccineDetailsNew" }} />
          <Stack.Screen name="book-now-vaccine" component={BookingVaccine} options={{ ...screenConfigs.noHeader, title: "VaccineDetailsNew" }} />

          {/* <Stack.Screen name="vaccination_home" component={Vaccination} options={screenConfigs.withTitle("Vaccination")} />
          <Stack.Screen name="vaccination_booked" component={BookVaccination} options={screenConfigs.withTitle("Booking Successful 😃")} />
          <Stack.Screen name="vaccination" component={Vaccinations} options={{ ...screenConfigs.noHeader, title: "Vaccination Best For Pet" }} />
          <Stack.Screen name="VaccineDetails" component={VaccineDetails} options={{ ...screenConfigs.noHeader, title: "Vaccination Details" }} /> */}

          {/* Coming-Soon Screen */}
          <Stack.Screen name="Coming_soon" component={Coming_soon} options={{ ...screenConfigs.noHeader, title: "Coming Soon" }} />

          {/* Physiotherapy */}
          <Stack.Screen name="Physiotherapy" component={Physiotherapy} options={{ ...screenConfigs.noHeader, title: "Coming Soon" }} />
          <Stack.Screen name="PhysioBooking" component={PhysioBooking} options={{ ...screenConfigs.noHeader, title: "Coming Soon" }} />
          <Stack.Screen name="PhysiotherapyDetails" component={PhysiotherapyDetails} options={{ ...screenConfigs.noHeader, title: "Coming Soon" }} />
          <Stack.Screen name="*" component={NotFoundScreen} options={screenConfigs.withTitle("Details About Therapy")} />

          {/* Clinic Screen */}
          <Stack.Screen name="clinic" component={Clinic} options={{ ...screenConfigs.noHeader, title: "Dog Grooming" }} />
        </Stack.Navigator>
      </SafeAreaProvider>

      {/* Conditionally render overlay */}
      {renderOverlay}

      {/* Conditionally render SuperficialNoter */}
      {shouldShowNoter && <SuperficialNoter />}

      <Toast />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  lottie: {
    width: 600,
    height: 600,
  },
  text: {
    marginBottom: 12,
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },
});

// Root App component wrapped with store provider
const RootApp = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <StatusBar
        barStyle={'dark-content'}
      />
      <ErrorBoundaryWrapper>
        <App />
      </ErrorBoundaryWrapper>
    </SafeAreaProvider>
  </Provider>
);

// Wrap with Sentry
const SentryWrappedApp = Sentry.wrap(RootApp);
AppRegistry.registerComponent(appName, () => SentryWrappedApp);

export default SentryWrappedApp;