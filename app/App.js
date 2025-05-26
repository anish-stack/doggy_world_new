import { View, StyleSheet, StatusBar, Dimensions } from "react-native";
import * as Sentry from "@sentry/react-native";
import './context/firebaseConfig';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
const { width, height } = Dimensions.get("window");
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
import SuperficialNoter from "./Screens/SuperficialCart/SuperficialNoter";
import SuperficialCart from "./Screens/SuperficialCart/SuperficialCart";
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
import ViewVaccineDetails from "./Profile_Screens/Orders/lab/ViewVaccineDetails";
import { getApp } from 'firebase/app';
import ProductDetailScreen from "./Screens/Services/Bakery/Dynamic_Screen/SingleBakerProduct";

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: "https://5b208c724079bf3e5789b51da0190912@o4508873810771970.ingest.us.sentry.io/4509020408643584",
  sendDefaultPii: true,
});

const Stack = createNativeStackNavigator();

const screenConfigs = {
  noHeader: { headerShown: false },
  withTitle: (title) => ({ headerShown: true, title }),
};

// Loading component to display during initialization
const AppLoading = () => (
  <View style={styles.loadingContainer}>
    <LottieView
      source={require("./animations/loading.json")}
      autoPlay
      loop
      style={styles.loadingAnimation}
    />
  </View>
);

const App = () => {
  const { refreshUser } = getUser();
  const navigationContainerRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState("");
  const { labTestsCount } = useSelector((state) => state.labCart);
  const [showGif, setShowGif] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isGranted, requestPermission, deviceId, fcmToken } = useNotificationPermission();

  // Memoized navigation state change handler
  const handleNavigationStateChange = useCallback(() => {
    if (navigationContainerRef.current) {
      const route = navigationContainerRef.current.getCurrentRoute();
      if (route) {
        setCurrentRoute(route.name);
      }
    }
  }, []);

  // Setup navigation listeners
  useEffect(() => {
    const unsubscribe = navigationContainerRef.current?.addListener(
      "state",
      handleNavigationStateChange
    );

    handleNavigationStateChange();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [handleNavigationStateChange]);

  // Handle lab tests count changes
  useEffect(() => {
    if (labTestsCount > 0) {
      setShowGif(true);
      const timer = setTimeout(() => {
        setShowGif(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [labTestsCount]);

  // Send FCM token to server - memoized to prevent recreation
  const sendTokenOfFcm = useCallback(async (data) => {
    try {
      await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/Fcm/register`, data);
    } catch (error) {
      // Silent error handling in production
    }
  }, []);

  // Handle notification permission - memoized
  const handleRequestNotificationPermission = useCallback(async () => {
    try {
      const granted = await requestPermission();
      if (granted && deviceId && fcmToken) {
        const data = { fcmToken, deviceId };
        await sendTokenOfFcm(data);
      }
    } catch (error) {
      // Silent error handling in production
    }
  }, [requestPermission, deviceId, fcmToken, sendTokenOfFcm]);

  // App initialization effect
  useEffect(() => {
    const loadApp = async () => {
      try {
      
        getApp();

        await refreshUser();

        // Request notification permissions
        await handleRequestNotificationPermission();

        // Simulate a minimum loading time for better UX
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Hide splash screen and set loading state
        await SplashScreen.hideAsync();
        setIsLoading(false);
      } catch (error) {
        // Handle errors during initialization
        Sentry.captureException(error);
        await SplashScreen.hideAsync();
        setIsLoading(false);
      }
    };

    loadApp();
  }, [refreshUser, handleRequestNotificationPermission]);

  // Memoized logic to determine whether to show the notifier
  const shouldShowNoter = useMemo(() => {
    return (
      labTestsCount > 0 &&
      currentRoute !== "labCart" &&
      currentRoute !== "Booking_Test_Confirm"
    );
  }, [labTestsCount, currentRoute]);

  // Memoized overlay rendering
  const renderOverlay = useMemo(() => {
    if (!showGif || currentRoute === "labCart" || currentRoute === "Booking_Test_Confirm") {
      return null;
    }

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

  if (isLoading) {
    return <View style={styles.fullScreenLoader}><AppLoading /></View>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
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
            <Stack.Screen name="Dynamic_Details_Shop_Bakery" component={ProductDetailScreen} options={{ ...screenConfigs.noHeader, title: "Pet Bakery" }} />
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
            <Stack.Screen name="ViewVaccineDetails" component={ViewVaccineDetails} options={{ ...screenConfigs.noHeader, title: "Lab And Vaccinations" }} />
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
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  fullScreenLoader: {
    flex: 1,
    height: '100%',
    width: width,
    backgroundColor: '#f0fffe',

  },
  loadingContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
});

// Root App component wrapped with store provider
const RootApp = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <StatusBar barStyle={'default'} />
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