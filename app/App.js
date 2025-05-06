import { Image, View, StyleSheet, Text } from "react-native";
import * as Sentry from "@sentry/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./Screens/Home/Home";
import register from "./Screens/auth/register/register";
import login from "./Screens/auth/login/login";
import otp from "./Screens/auth/register/otp";
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
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./redux/store";
import Toast from "react-native-toast-message";
import { useEffect, useRef, useState } from "react";
import { AppRegistry } from "react-native";
import { name as appName } from "./app.json";
import * as SplashScreen from "expo-splash-screen";

import Cart from "./Screens/Cart/Cart";
import Offers from "./Screens/Cart/Offers";
import PetShop from "./Screens/Pet_Shop/PetShop";
import Dynamic_Shop from "./Screens/Pet_Shop/_Shop/Dynamic_Shop";
import Dynmaic_Products_Shop from "./Screens/Pet_Shop/_Shop/Dynmaic_Products_Shop";
import Dynamic_Details_Shop from "./Screens/Pet_Shop/_Shop/Dynamic_Details_Shop";
import Lab_Test from "./Screens/Labs/Lab_Test";
import Lab_Clinic from "./Screens/Labs/Lab_Clinic";
import TestPage from "./Screens/Labs/TestPage";
import Book_Test from "./Screens/Labs/Book_Test";
import Single_Test from "./Screens/Labs/Single_Test";
import SuperficialNoter from "./Screens/SuperficialCart/SuperficialNoter";
import LottieView from "lottie-react-native";
import SuperficialCart from "./Screens/SuperficialCart/SuperficialCart";
import Vaccinations from "./Screens/Vaccination/Vaccinations";
import VaccineDetails from "./Screens/Vaccination/VaccineDetails";
import Vaccination from "./Screens/Vaccination/Vaccination";
import BookVaccination from "./Screens/Vaccination/BookVaccination";
import Coming_soon from "./Screens/Coming_soon/Coming_soon";
import Physiotherapy from "./Screens/Physiotherapy/Physiotherapy";
import PhysiotherapyDetails from "./Screens/Physiotherapy/PhysiotherapyDetails";
import New_Tests from "./Labs/New_Tests";
import Booking_Test_Confirm from "./Screens/SuperficialCart/Booking_Test_Confirm";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Address from "./Screens/Cart/Address";
import SingleBlog from "./components/Blogs/SingleBlog";
import Order_Confirmation from "./Screens/Services/Bakery/Categories/Order_Confirmation";
import Orderconfirm from "./Screens/Cart/Orderconfirm";
import Profile from "./Profile_Screens/Profile/Profile";
import Appointments from "./Profile_Screens/Appointments/Appointments";
import Grooming_Sessions from "./Profile_Screens/Grooming_Sessions/Grooming_Sessions";
import Cakes_order from "./Profile_Screens/Cakes_order/Cakes_order";
import Lab from "./Profile_Screens/Orders/lab/Lab";
import Help_Support from "./Profile_Screens/Help_Support/Help_Support";
import AppointmentDetails from "./Profile_Screens/Appointments/AppointmentDetails";
import { StatusBar } from "expo-status-bar";
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
const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync();
Sentry.init({
  dsn: "https://5b208c724079bf3e5789b51da0190912@o4508873810771970.ingest.us.sentry.io/4509020408643584",

  sendDefaultPii: true,
});


const App = () => {
  const { getUserFnc } = getUser()
  const navigationContainerRef = useRef();
  const [currentRoute, setCurrentRoute] = useState("");
  const { labTests, labTestsCount } = useSelector((state) => state.labCart);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    const getCurrentRoute = () => {
      if (navigationContainerRef.current) {
        const route = navigationContainerRef.current.getCurrentRoute();
        if (route) {
          setCurrentRoute(route.name);
          console.log("Current Route:", route.name);
        }
      }
    };

    getCurrentRoute();

    const unsubscribe = navigationContainerRef.current?.addListener(
      "state",
      getCurrentRoute
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (labTestsCount > 0) {
      setShowGif(true);

      const timer = setTimeout(() => {
        setShowGif(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [labTestsCount]);

  useEffect(() => {
    const loadApp = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      SplashScreen.hideAsync();
    };
    getUserFnc()
    loadApp();
  }, []);

  return (
    <NavigationContainer ref={navigationContainerRef}>
      <SafeAreaProvider>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }}
          />
          {/* <Stack.Screen name="Home" options={{ headerShown: false }} component={Home} /> */}
          {/* Auth Screens */}
          <Stack.Screen
            name="register"
            options={{ headerShown: false, title: "Register Your Pet" }}
            component={register}
          />
          <Stack.Screen
            name="login"
            options={{ headerShown: false, title: "Welcome back" }}
            component={login}
          />
          <Stack.Screen
            name="otp"
            options={{ headerShown: false }}
            component={otp}
          />
          <Stack.Screen
            name="forget-password"
            options={{ headerShown: false }}
            component={ForgetPassword}
          />

          {/* Searching Screens */}
          <Stack.Screen
            name="search"
            options={{ headerShown: false }}
            component={SearchScreen}
          />

          {/* Service Screens */}
          <Stack.Screen
            name="Bakery"
            options={{ headerShown: false, title: "Pet Bakery" }}
            component={Bakery}
          />
          <Stack.Screen
            name="Consultation"
            options={{ headerShown: false, title: "Online Consultation" }}
            component={Consultation}
          />
          <Stack.Screen
            name="Notifications"
            options={{ headerShown: false, title: "Online Consultation" }}
            component={NotificationScreen}
          />

          <Stack.Screen
            name="next-step"
            options={{ headerShown: false }}
            component={BookingConsultation}
          />
          <Stack.Screen
            name="thankyou"
            options={{ headerShown: false }}
            component={ThankYouPage}
          />

          {/* Service Screens ===> Grooming */}
          <Stack.Screen
            name="Grooming"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={Grooming}
          />
          <Stack.Screen
            name="Gromming_More_service"
            options={{ headerShown: true, title: "View All Pacakages" }}
            component={AllGroomingServices}
          />
          <Stack.Screen
            name="Create_Custom_Service"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={CustomPackage}
          />
          {/* Book-Grooming */}
          <Stack.Screen
            name="Book-Grooming"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={BookingStep}
          />

          {/* Profile Screens authenticated */}
          <Stack.Screen
            name="Profile"
            options={{ headerShown: false, title: "Profile" }}
            component={Profile}
          />
          <Stack.Screen
            name="Appointments"
            options={{ headerShown: false, title: "Appointments" }}
            component={Appointments}
          />
          <Stack.Screen
            name="AppointmentDetails"
            options={{ headerShown: false, title: "Appointments" }}
            component={AppointmentDetails}
          />
          <Stack.Screen
            name="Groomings"
            options={{ headerShown: false, title: "My Grooming Sessions" }}
            component={Grooming_Sessions}
          />
          <Stack.Screen
            name="cakeorder"
            options={{ headerShown: false, title: "Cakes Order" }}
            component={Cakes_order}
          />
          <Stack.Screen
            name="physioBookings"
            options={{ headerShown: false, title: "Cakes Order" }}
            component={Physio}
          />
          <Stack.Screen
            name="ViewPhysioDetails"
            options={{ headerShown: false, title: "Cakes Order" }}
            component={ViewPhysioDetails}
          />
          <Stack.Screen
            name="SingleCakeOrder"
            options={{ headerShown: false, title: "Cakes Order" }}
            component={SingleCakeOrder}
          />
          <Stack.Screen
            name="labVaccinations"
            options={{ headerShown: false, title: "Lab And Vaccinations" }}
            component={Lab}
          />
          <Stack.Screen
            name="ViewLabDetails"
            options={{ headerShown: false, title: "Lab And Vaccinations" }}
            component={ViewLabDetails}
          />
          <Stack.Screen
            name="Orders"
            options={{ headerShown: false, title: "Lab And Vaccinations" }}
            component={PetShopOrders}
          />
          <Stack.Screen
            name="ViewPetShopOrder"
            options={{ headerShown: false, title: "Lab And Vaccinations" }}
            component={ViewPetShopOrder}
          />
          <Stack.Screen
            name="Support"
            options={{ headerShown: true, title: "Help & Support" }}
            component={Help_Support}
          />

          {/* Pet Bakery Screens ===> Bakery */}
          <Stack.Screen
            name="Cake-Screen"
            options={{ headerShown: false, title: "Dog Grong" }}
            component={CakesScreen}
          />
          <Stack.Screen
            name="Cake-Delivery"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={CakeDelivery}
          />
          <Stack.Screen
            name="Order_Confirmation"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={Order_Confirmation}
          />

          {/* dynamic_screen */}
          <Stack.Screen
            name="dynamic_screen"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={Dynamicscreen}
          />
          <Stack.Screen
            name="product_details"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={ProductDetails}
          />

          {/* cart screen */}
          <Stack.Screen
            name="cart"
            options={{ headerShown: false, title: "Cart" }}
            component={Cart}
          />
          <Stack.Screen
            name="Order-confirm"
            options={{ headerShown: false }}
            component={Orderconfirm}
          />
          <Stack.Screen
            name="Available_Offer"
            options={{ headerShown: false, title: "AvailableOffer" }}
            component={Offers}
          />
          <Stack.Screen
            name="single-blog"
            options={{ headerShown: false }}
            component={SingleBlog}
          />

          {/* Pet Shop Screen */}
          <Stack.Screen
            name="Pet_Shop"
            options={{ headerShown: true, title: "Pet Shop" }}
            component={PetShop}
          />
          <Stack.Screen
            name="Dynamic_Shop"
            options={{ headerShown: false, title: "Pet Shop" }}
            component={Dynamic_Shop}
          />
          <Stack.Screen
            name="Dynamic_Products_Shop"
            options={{ headerShown: false, title: "Pet Shop" }}
            component={Dynmaic_Products_Shop}
          />
          <Stack.Screen
            name="Dynamic_Details_Shop"
            options={{ headerShown: false, title: "Pet Shop" }}
            component={Dynamic_Details_Shop}
          />

          {/* select_address_and_order */}
          <Stack.Screen
            name="select_address_and_order"
            options={{ headerShown: false }}
            component={Address}
          />

          {/* Lab Test Screen */}
          <Stack.Screen
            name="Lab_Test"
            options={{ headerShown: false }}
            component={Lab_Test}
          />
          <Stack.Screen
            name="lab_Clinic"
            options={{ headerShown: false }}
            component={Lab_Clinic}
          />
          <Stack.Screen
            name="TestPage"
            options={{ headerShown: false }}
            component={TestPage}
          />
          <Stack.Screen
            name="next-step_booking_lab"
            options={{ headerShown: false }}
            component={Book_Test}
          />
          <Stack.Screen
            name="TestSelection"
            options={{ headerShown: false }}
            component={Single_Test}
          />
          <Stack.Screen
            name="labCart"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={SuperficialCart}
          />
          <Stack.Screen
            name="Booking_Test_Confirm"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={Booking_Test_Confirm}
          />
          {/* New Lab Test Screens */}

          <Stack.Screen
            name="Lab"
            options={{ headerShown: false, title: "Lab Test" }}
            component={New_Tests}
          />

          {/* vaccination */}
          <Stack.Screen
            name="vaccination_home"
            options={{ headerShown: true, title: "Vaccination" }}
            component={Vaccination}
          />
          <Stack.Screen
            name="vaccination_booked"
            options={{ headerShown: true, title: "Booking Successful 😃" }}
            component={BookVaccination}
          />
          <Stack.Screen
            name="vaccination"
            options={{ headerShown: false, title: "Vaccination Best For Pet" }}
            component={Vaccinations}
          />
          <Stack.Screen
            name="VaccineDetails"
            options={{ headerShown: false, title: "Vaccination Details" }}
            component={VaccineDetails}
          />

          {/* Coming-Soon Screen */}
          <Stack.Screen
            name="Coming_soon"
            options={{ headerShown: false, title: "Coming  Soon" }}
            component={Coming_soon}
          />

          {/* Physiotherapy */}
          <Stack.Screen
            name="Physiotherapy"
            options={{ headerShown: true, title: "Physiotherapy" }}
            component={Physiotherapy}
          />
          <Stack.Screen
            name="PhysiotherapyDetails"
            options={{ headerShown: true, title: "Details About Therapy" }}
            component={PhysiotherapyDetails}
          />
          <Stack.Screen
            name="*"
            options={{ headerShown: true, title: "Details About Therapy" }}
            component={NotFoundScreen}
          />

          {/* Clinic Screen */}
          <Stack.Screen
            name="clinic"
            options={{ headerShown: false, title: "Dog Grooming" }}
            component={Clinic}
          />
        </Stack.Navigator>
      </SafeAreaProvider>

      {currentRoute === "labCart" ||
        currentRoute === "Booking_Test_Confirm" ? null : (
        <>
          {showGif && (
            <View style={styles.overlay}>
              <LottieView
                source={require("./confeti.json")}
                autoPlay
                loop={false}
                style={styles.lottie}
              />
            </View>
          )}

          {/* {labTestsCount > 0 ? <SuperficialNoter /> : null} */}
        </>
      )}

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
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
const RootApp = () => (
  <Provider store={store}>
    <SafeAreaProvider>
      <StatusBar
        backgroundColor="transparent"
        hidden={false}
        translucent={false}
      />
      <ErrorBoundaryWrapper>

        <App />
      </ErrorBoundaryWrapper>
    </SafeAreaProvider>

  </Provider>
);
const wrappedWithSentry = Sentry.wrap(RootApp);
AppRegistry.registerComponent(appName, () => wrappedWithSentry);

export default Sentry.wrap(wrappedWithSentry);