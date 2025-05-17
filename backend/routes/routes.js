const express = require('express');
const { createPetType, updatePetType, deletePetType, getAllPetTypes } = require('../controller/Pet controller/PetType');
const { upload } = require('../middleware/multer');
const { registerPet, verifyOtp, resendOtp, loginPet, loginPetverifyOtp, getPetProfile, updatePetProfile, deletePetProfile, changePetOwnerNumber, verifyNumberChangeOtp, getAllPets } = require('../controller/Pet controller/PetAuth');
const { createMainCategory, getAllCategories, getSingleCategory, updateCategory, deleteCategory } = require('../controller/Main Category/MainCategory');
const { createTypeOfVaccine, getAllTypeOfVaccines, getSingleTypeOfVaccine, updateTypeOfVaccine, deleteTypeOfVaccine } = require('../controller/Vaccine/TypeOfVaccine');
const { createVaccineProduct, getAllVaccineProducts, getSingleVaccineProduct, updateVaccineProduct, deleteVaccineProduct } = require('../controller/Vaccine/VaccinationController');
const { createCakeFlavour, getAllCakeFlavours, getSingleCakeFlavour, updateCakeFlavour, deleteCakeFlavour } = require('../controller/Cake Controller/FlavourController');
const { createCakeDesign, getAllCakeDesigns, getCakeDesignById, updateCakeDesign, deleteCakeDesign } = require('../controller/Cake Controller/DesignController');
const { createSizeForCake, getAllCakeSizes, getCakeSizeById, updateCakeSize, deleteCakeSize } = require('../controller/Cake Controller/SizeController');
const { createPetBakery, getAllPetBakery, updatePetBakery, deletePetBakery, getSinglePetBakery } = require('../controller/Pet Bakery/petBakeryCategory');
const { createBakeryProduct, getAllBakeryProducts, getBakeryProductById, updateBakeryProduct, deleteBakeryProduct, getBakeryProductCategoryById } = require('../controller/Pet Bakery/petBakeryProducts');
const { createPhysioTherepay, getAllPhysioTherapies, getPhysioTherapyById, updatePhysioTherapy, deletePhysioTherapy } = require('../controller/PhysioTherapy/PhysioTherapy');
const { createCoupon, getCoupons, getCouponById, updateCoupon, deleteCoupon } = require('../controller/common/Coupon');
const { createPetShopCategory, getAllPetShopCategories, getSinglePetShopCategory, updatePetShopCategory, deletePetShopCategory } = require('../controller/Pet Shops/PetShopCategories');
const { createPetShopSubCategory, getAllPetShopSubCategories, getSinglePetShopSubCategory, updatePetShopSubCategory, deletePetShopSubCategory, getPetShopSubCategoryByCategories } = require('../controller/Pet Shops/PetShopSubCategories');
const { createPetShopProduct, getAllPetProducts, getPetShopProductById, updatePetShopProduct, deletePetShopProduct, getPetShopProductByCategoryId } = require('../controller/Pet Shops/PetShopsProduct');
const { createDoctors, editDoctor, deleteDoctor, getAllDoctors, getSingleDoctor } = require('../controller/Doctors/Doctors');
const { clinicRegister, resendOTP, verifyOTP, getAllClinics, getClinicById, updateClinic, deleteClinic, clinicLogin, refreshToken, logout, validateToken, logoutAllDevices, clinicUser } = require('../controller/Clinics/Clinics');
const { isAuthenticated, authorizeRoles } = require('../middleware/protect');
const { createHomeBanner, updateHomeBanner, deleteHomeBanner, getAllHomeBanners, getHomeBannerById } = require('../controller/HomeBanner/HomeBanner');
const { createAServiceBanners, updateServiceBanner, deleteServiceBanner, getAllServiceBanners, getServiceBannersByType } = require('../controller/HomeBanner/ServiceBanner');
const { createBlogs, getAllBlogs, getSingleBlog, updateBlog, deleteBlog } = require('../controller/Blogs/Blogs');
const { CreateGrommingService, GetAllGroomingServices, GetSingleGroomingService, UpdateGroomingService, DeleteGroomingService } = require('../controller/Grooming/Grooming');
const { CreateGroomingPackage, GetAllGroomingPackages, GetSingleGroomingPackage, UpdateGroomingPackage, DeleteGroomingPackage } = require('../controller/Grooming/GroomingPackages');
const { createGroomingPackagejson, getAllGroomingPackagesjson, getGroomingPackageByIdjson, updateGroomingPackagejson, deleteGroomingPackagejson } = require('../controller/Grooming/GroomingPackagejson');
const { createConsultation, updateConsultation, deleteConsultation, getAllConsultations, getSingleConsultation } = require('../controller/Consultations/Consultation');
const { createDoctorConsultation, getAllDoctorConsultations, getSingleDoctorConsultation, updateDoctorConsultation, deleteDoctorConsultation } = require('../controller/Consultations/AvailableDoctors');
const notificationController = require('../controller/FCM/NotificationToken');
const { makeBookings, verifyPayment, getBookingStatus, MakeABookingForVaccines, MakeABookingForPhysio, MakeABookingForlabTest } = require('../controller/Consultations/BookingConsultaation');
const { createAddress, getAllAddressesByPetId, getAddressById, updateAddress, deleteAddress } = require('../controller/Address/Address');
const { createTypeOfLabTest, getAllTypeOfLabTests, getSingleTypeOfLabTest, updateTypeOfLabTest, deleteTypeOfLabTest } = require('../controller/LabControllers/TypeOfLabs');
const { createLabTestProduct, AllBookingsOfLab, getAllLabTestProducts, getSingleLabTestProduct, updateLabTestProduct, deleteLabTestProduct } = require('../controller/LabControllers/LabController');
const { createSettings, getSettings, updateSettings, deleteSettings, createAdminSettings } = require('../controller/AdminSettings/Settings');
const { BookingOfLabTest, SingleBookingOfLabTest, CancelBookingOfLabTest, RescheduleOfLabTest, deleteBookingoflab, UpdateStatusBookingOfLabTest, getMyLabTestAndVaccinationByUser } = require('../controller/LabControllers/LabOrderController');
const { AllBookingsOfPhysio, BookingsOfPhysio, SingleBookingOfPhysio, CancelBookingOfPhysio, deleteBookingofPhysio, RescheduleOfPhysio, updatePhyioStatus, AddAreviewToPhysio, BookingsMyOfPhysio } = require('../controller/PhysioTherapy/PhysioOrders');
const { makeBookingForPetBakeryAndShop, getBookingDetailsShopBooking, getAllBookingDetailsShopBooking, changeOrderStatusOrBakery, deletePetShopAndBakeryOrder, getMyAllBookingDetailsShopBooking, getMySingleBookingDetailsShopBooking } = require('../controller/common/BookingPetShopAndBakery');
const { makeBookingForCake, getAllCakeBooking, getSingleCakeBooking, changeOrderStatus, deleteCakeOrder, getMyAllCakeBookings } = require('../controller/Cake Controller/CakeBooking');
const { getMyConsultationsBooking, getMyConsultationsBookingSingle, resecheduleBooking, CancelBooking, addRating, getAllConsultationsBookings, addPrescriptions } = require('../controller/Pet controller/PetOrdersControllers');
const { getAllBookingsVaccination, SingleBookingOfVaccination, deleteBookingOfVaccination, CancelBookingOfVaccination, addNextScheduled, AddAreviewToVaccination, RescheduleOfVaccinationBooking, updatefVaccinationBookingStatus, getScheduleOfVaccination } = require('../controller/Vaccine/VaccineOrderController');
const { DashboardAggregationDataThroughJS } = require('../controller/Dashboard/Dashboard');

const router = express.Router();


//Pet Type 
router.post('/create-pet-type', createPetType)
router.post('/update-pet-type/:id', updatePetType)
router.delete('/delete-pet-type/:id', deletePetType)
router.get('/get-pet-type', getAllPetTypes)


//Pet Auth 
router.post('/register-pet', registerPet);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login-pet', loginPet);
router.post('/login-pet-verify-otp', loginPetverifyOtp);
router.get('/pet-profile', isAuthenticated, getPetProfile);
router.put('/pet-profile/:petId', updatePetProfile);
router.delete('/pet-profile/:petId', deletePetProfile);
router.put('/change-owner-number/:petId', changePetOwnerNumber);
router.post('/verify-number-change-otp/:petId', verifyNumberChangeOtp);
router.get('/all-pets', getAllPets);


//pet consulations events
router.get('/pet-profile-consultations-booking/:id', getMyConsultationsBooking);
router.get('/all-consultations-booking', getAllConsultationsBookings);
router.get('/consultations-booking/:id', getMyConsultationsBookingSingle);
router.post('/consultations-reschedule', resecheduleBooking);
router.post('/consultations-prescriptions', addPrescriptions);
router.get('/consultations-cancel', CancelBooking);
router.post('/consultations-rate', addRating);



router.post('/addresses', isAuthenticated, createAddress);
router.get('/addresses', isAuthenticated, getAllAddressesByPetId);
router.get('/addresses/:id', getAddressById);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);


router.post('/Fcm/register', notificationController.registerToken);
router.get('/Fcm/', notificationController.getAllTokens);
router.get('/Fcm/:id', notificationController.getTokenById);
router.get('/Fcm/token/:fcmtoken', notificationController.findByToken);
router.put('/Fcm/:id', notificationController.updateToken);
router.delete('/Fcm/:id', notificationController.deleteToken);

router.get('/', async (req, res) => {
    try {
        const redis = req.app.get('redis');

        if (!redis) {
            return res.status(500).json({
                success: false,
                message: "Redis client not available",
            });
        }

        await redis.flushAll(); // flushes all keys in the Redis database

        return res.status(200).json({
            success: true,
            message: "Redis cache flushed successfully",
        });
    } catch (error) {
        console.error('Error flushing Redis:', error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

//Home main screen category
router.post('/main-pet-category', upload.single('image'), createMainCategory);
router.get('/get-main-pet-category', getAllCategories);
router.get('/main-pet-category/:id', getSingleCategory);
router.delete('/delete-pet-category/:id', deleteCategory);
router.put('/update-pet-category/:id', upload.single('image'), updateCategory);

// Create a New Vaccine Type
router.post('/create-vaccine-type', upload.single('image'), createTypeOfVaccine);
router.get('/list-all-vaccine-types', getAllTypeOfVaccines);
router.get('/vaccine-type-details/:id', getSingleTypeOfVaccine);
router.put('/update-vaccine-type/:id', upload.single('image'), updateTypeOfVaccine);
router.delete('/remove-vaccine-type/:id', deleteTypeOfVaccine);


// Create a new vaccine product
router.post('/vaccine-product', upload.array('images'), createVaccineProduct);
router.get('/vaccine-products', getAllVaccineProducts);
router.get('/vaccine-product/:id', getSingleVaccineProduct);
router.put('/vaccine-update-product/:id', upload.array('images'), updateVaccineProduct);
router.delete('/vaccine-delete-product/:id', deleteVaccineProduct);

// Create a new vaccine Order routes
router.get('/vaccine-orders', getAllBookingsVaccination);
router.get('/single-vaccine-orders', SingleBookingOfVaccination);
router.delete('/delete-vaccine-orders/:id', deleteBookingOfVaccination);
router.put('/cancel-vaccine-orders', CancelBookingOfVaccination);
router.post('/add-scheduled', addNextScheduled);
router.post('/add-review', AddAreviewToVaccination);
router.put('/add-first-vaccine-reschudle', RescheduleOfVaccinationBooking);
router.put('/update-vaccine-status', updatefVaccinationBookingStatus);
router.get('/get-schedule-of-vaccination', getScheduleOfVaccination);



// Create a New Lab test Type
router.post('/create-LabTest-type', upload.single('image'), createTypeOfLabTest);
router.get('/list-all-LabTest-types', getAllTypeOfLabTests);
router.get('/LabTest-type-details/:id', getSingleTypeOfLabTest);
router.put('/update-LabTest-type/:id', upload.single('image'), updateTypeOfLabTest);
router.delete('/remove-LabTest-type/:id', deleteTypeOfLabTest);


// Create a new Lab Test product
router.post('/LabTest-product', upload.array('images'), createLabTestProduct);
router.get('/LabTest-products', getAllLabTestProducts);
router.get('/LabTest-product/:id', getSingleLabTestProduct);
router.get('/bookings/lab-test/:date', AllBookingsOfLab);
router.put('/LabTest-update-product/:id', upload.array('images'), updateLabTestProduct);
router.delete('/LabTest-delete-product/:id', deleteLabTestProduct);



// Create a new Cake flavour 
router.post('/cake-flavour', upload.single('image'), createCakeFlavour);
router.get('/cake-flavours', getAllCakeFlavours);
router.get('/cake-flavour/:id', getSingleCakeFlavour);
router.put('/cake-flavour/:id', upload.single('image'), updateCakeFlavour);
router.delete('/cake-flavour/:id', deleteCakeFlavour);



// Create a new Cake design 

router.post("/cake-design", upload.single("image"), createCakeDesign);
router.get("/cake-design", getAllCakeDesigns);
router.get("/cake-design/:id", getCakeDesignById);
router.put("/cake-design/:id", upload.single("image"), updateCakeDesign);
router.delete("/cake-design/:id", deleteCakeDesign);

// Create a new Cake size 
router.post('/cake-size', createSizeForCake);
router.get('/cake-sizes', getAllCakeSizes);
router.get('/cake-size/:id', getCakeSizeById);
router.put('/cake-size/:id', updateCakeSize);
router.delete('/cake-size/:id', deleteCakeSize);

// Create a new Cake Bookings 
router.get('/all-cake-bookings', getAllCakeBooking);
router.get('/cake-bookings', getSingleCakeBooking);
router.get('/cake-booking', isAuthenticated, getMyAllCakeBookings);
router.post('/chanage-booking-status', changeOrderStatus);
router.delete('/delete-cake-booking/:id', deleteCakeOrder);



//create a new pet bakery routes
router.post('/create-pet-bakery', upload.single("image"), createPetBakery);
router.get('/get-all-pet-bakery', getAllPetBakery);
router.put('/update-pet-bakery/:id', upload.single("image"), updatePetBakery);
router.delete('/delete-pet-bakery/:id', deletePetBakery);
router.get('/get-pet-bakery/:id', getSinglePetBakery);

//create a new pet bakery product route
router.post('/create-pet-bakery-product', upload.array("images"), createBakeryProduct);
router.get('/get-bakery-product', getAllBakeryProducts);
router.get('/get-bakery-product/:id', getBakeryProductById);
router.get('/get-bakery-category-product/:id', getBakeryProductCategoryById);
router.post('/update-bakery-product/:id', upload.array("images"), updateBakeryProduct);
router.delete('/delete-bakery-product/:id', deleteBakeryProduct);


//create a new PhysioTherapy product route
router.post('/create-physioTherapy', upload.array("images"), createPhysioTherepay);
router.get('/get-physioTherapy', getAllPhysioTherapies);
router.get('/get-physioTherapy/:id', getPhysioTherapyById);
router.post('/update-physioTherapy/:id', upload.array("images"), updatePhysioTherapy);
router.delete('/delete-physioTherapy/:id', upload.array("images"), deletePhysioTherapy);

//order for AllBookingsOfPhysio
router.get('/get-order-physio/:date', AllBookingsOfPhysio);
router.get('/get-order-physio', BookingsOfPhysio);
router.get('/get-my-order-physio', isAuthenticated, BookingsMyOfPhysio);
router.get('/get-single-order-physio', SingleBookingOfPhysio);
router.put('/cancel-order-of-physio', CancelBookingOfPhysio);
router.delete('/delete-physio-booking/:id', deleteBookingofPhysio);
router.put('/reschedule-order-physio', RescheduleOfPhysio);
router.put('/update-physio-status', updatePhyioStatus);
router.post('/update-physio-review', AddAreviewToPhysio);




//create a new coupon route
router.post('/create-coupon', createCoupon);
router.get('/get-coupons', getCoupons);
router.get('/get-coupon/:id', getCouponById);
router.put('/update-coupon/:id', updateCoupon);
router.delete('/delete-coupon/:id', deleteCoupon);

//create a pet shop category route
router.post('/petshop-category', upload.single("image"), createPetShopCategory);
router.get('/petshop-category', getAllPetShopCategories);
router.get('/petshop-category/:id', getSinglePetShopCategory);
router.put('/petshop-category/:id', upload.single("image"), updatePetShopCategory);
router.delete('/petshop-category/:id', deletePetShopCategory);


//create a pet shop sub category route
router.post('/petshop-sub-category', upload.single("image"), createPetShopSubCategory);
router.get('/petshop-sub-category', getAllPetShopSubCategories);
router.get('/petshop-sub-category/:id', getSinglePetShopSubCategory);
router.get('/petshop-subs/:id', getPetShopSubCategoryByCategories);
router.post('/petshop-sub-category/:id', upload.single("image"), updatePetShopSubCategory);
router.delete('/petshop-sub-category/:id', deletePetShopSubCategory);

//create a pet shop  route
router.post('/petshop-create-product', upload.array("images"), createPetShopProduct);
router.get('/petshop-get-product', getAllPetProducts);
router.get('/petshop-get-product/:id', getPetShopProductById);
router.get('/petshop-get-product-category/:id', getPetShopProductByCategoryId);
router.post('/petshop-update-product/:id', upload.array("images"), updatePetShopProduct);
router.delete('/delete-shop-product/:id', deletePetShopProduct);


//

router.get('/petshop-bakery-get', getAllBookingDetailsShopBooking);
router.get('/petshop-my-bakery-get',isAuthenticated, getMyAllBookingDetailsShopBooking);
router.get('/petshop-my-bakery-get/:id', getMySingleBookingDetailsShopBooking);
router.post('/chanage-petshop-status', changeOrderStatusOrBakery);
router.delete('/delete-petshop-order/:id', deletePetShopAndBakeryOrder);


//create a Display Doctor  route
router.post('/doctors/create', upload.single("image"), createDoctors);
router.put('/doctors/edit/:id', upload.single("image"), editDoctor);
router.delete('/doctors/delete/:id', deleteDoctor);
router.get('/doctors', getAllDoctors);
router.get('/doctors/:id', getSingleDoctor);


//create a Clinic regsiter
router.post('/clinic/regsiter', isAuthenticated, authorizeRoles('admin'), upload.array("images"), clinicRegister);
router.post('/clinic/resend-otp', resendOTP);
router.post('/clinic/verify-otp', verifyOTP);
router.get('/clinic/get-all-clinic', getAllClinics);
router.get('/clinic/get-clinic/:id', getClinicById);
router.post('/clinic/update/:id', upload.array("images"), updateClinic);
router.delete('/clinic/delete/:id', isAuthenticated, deleteClinic);
router.post('/clinic/login', clinicLogin);
router.get('/dashboard-user', isAuthenticated, clinicUser);

router.post('/refresh-token', refreshToken);
router.get('/logout', isAuthenticated, logout);
router.get('/validate-token', isAuthenticated, validateToken);
router.get('/logout-all-devices', isAuthenticated, logoutAllDevices);



//create a Home Banner 

router.post('/home-banner', upload.single("image"), createHomeBanner);
router.get('/home-banner', getAllHomeBanners);
router.get('/home-banner/:id', getHomeBannerById);
router.post('/home-banner/:id', upload.single("image"), updateHomeBanner);
router.delete('/home-banner/:id', deleteHomeBanner);

router.post('/service-banner', upload.array("images"), createAServiceBanners);
router.post('/service-banner/:id', upload.array("images"), updateServiceBanner);
router.delete('/service-banner/:id', deleteServiceBanner);
router.get('/service-banner', getAllServiceBanners);
router.get('/service-banner/:type', getServiceBannersByType);

//create a Blogs 

router.post('/blogs', upload.array("images"), createBlogs);
router.post('/blogs/:id', upload.array("images"), updateBlog);
router.delete('/blogs/:id', deleteBlog);
router.get('/blogs', getAllBlogs);
router.get('/blogs/:id', getSingleBlog);


//create a Grooming Services Routes 
router.post('/grooming-service', upload.single("image"), CreateGrommingService);
router.post('/grooming-service/:id', upload.single("image"), UpdateGroomingService);
router.delete('/grooming-service/:id', DeleteGroomingService);
router.get('/grooming-service', GetAllGroomingServices);
router.get('/grooming-service/:id', GetSingleGroomingService);

//create a Grooming Services Packages 
router.post('/grooming-service-package', CreateGroomingPackage);
router.post('/grooming-service-package/:id', UpdateGroomingPackage);
router.delete('/grooming-service-package/:id', DeleteGroomingPackage);
router.get('/grooming-service-package', GetAllGroomingPackages);
router.get('/grooming-service-package/:id', GetSingleGroomingPackage);

//create a Grooming Services Packages 
router.post("/grooming-service-package-json", createGroomingPackagejson);
router.get("/grooming-service-package-json", getAllGroomingPackagesjson);
router.get("/grooming-service-package-json/:id", getGroomingPackageByIdjson);
router.put("/grooming-service-package-json/:id", updateGroomingPackagejson);
router.delete("/grooming-service-package-json/:id", deleteGroomingPackagejson);

//create a Consultation 
router.post('/consultation-types', upload.single("image"), createConsultation);
router.post('/consultation-types/:id', upload.single("image"), updateConsultation);
router.delete('/consultation-types/:id', deleteConsultation);
router.get('/consultation-types', getAllConsultations);
router.get('/consultation-types/:id', getSingleConsultation);


//create a  Doctor Consultation 

router.post('/consultation-doctor', upload.single("image"), createDoctorConsultation);
router.post('/consultation-doctor/:id', upload.single("image"), updateDoctorConsultation);
router.delete('/consultation-doctor/:id', deleteDoctorConsultation);
router.get('/consultation-doctor', getAllDoctorConsultations);
router.get('/consultation-doctor/:id', getSingleDoctorConsultation);


// Booking for consulations
router.post('/booking-consultation-doctor', makeBookings);
router.post('/booking-vaccinations', isAuthenticated, MakeABookingForVaccines);
router.post('/booking-lab-test', isAuthenticated, MakeABookingForlabTest);
router.post('/booking-physio', isAuthenticated, MakeABookingForPhysio);

router.post('/booking-verify-payment', verifyPayment);
router.get('/booking-status/:bookingId/:type', getBookingStatus);

router.post('/booking-for-shop', isAuthenticated, makeBookingForPetBakeryAndShop);
router.get('/booking-details/:id', getBookingDetailsShopBooking);


router.post('/create-cake-order', isAuthenticated, makeBookingForCake);

// lab test Routes
router.get('/lab-tests-booking', BookingOfLabTest);
router.get('/lab-and-vaccine-my-booking', isAuthenticated, getMyLabTestAndVaccinationByUser);
router.get('/lab-booking', SingleBookingOfLabTest);
router.put('/lab-booking-cancel', CancelBookingOfLabTest);
router.put('/lab-tests-booking-reschedule', RescheduleOfLabTest);
router.delete('/lab-tests-booking-delete/:id', deleteBookingoflab);
router.put('/lab-tests-booking/:id/status', UpdateStatusBookingOfLabTest);





// Admin settings Routes
router.post('/settings', createSettings);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.delete('/settings', deleteSettings);
router.post('/settings/admin', createAdminSettings);


//Dashboard admin
router.get('/dashboard-admin', DashboardAggregationDataThroughJS)

module.exports = router;