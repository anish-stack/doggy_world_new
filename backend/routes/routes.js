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
const { createBakeryProduct, getAllBakeryProducts, getBakeryProductById, updateBakeryProduct, deleteBakeryProduct } = require('../controller/Pet Bakery/petBakeryProducts');
const { createPhysioTherepay, getAllPhysioTherapies, getPhysioTherapyById, updatePhysioTherapy, deletePhysioTherapy } = require('../controller/PhysioTherapy/PhysioTherapy');
const { createCoupon, getCoupons, getCouponById, updateCoupon, deleteCoupon } = require('../controller/common/Coupon');
const { createPetShopCategory, getAllPetShopCategories, getSinglePetShopCategory, updatePetShopCategory, deletePetShopCategory } = require('../controller/Pet Shops/PetShopCategories');
const { createPetShopSubCategory, getAllPetShopSubCategories, getSinglePetShopSubCategory, updatePetShopSubCategory, deletePetShopSubCategory } = require('../controller/Pet Shops/PetShopSubCategories');

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
router.get('/pet-profile/:petId', getPetProfile);
router.put('/pet-profile/:petId', updatePetProfile);
router.delete('/pet-profile/:petId', deletePetProfile);
router.put('/change-owner-number/:petId', changePetOwnerNumber);
router.post('/verify-number-change-otp/:petId', verifyNumberChangeOtp);
router.get('/all-pets', getAllPets);

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
router.put('/vaccine-update-product/:id', upload.array('image'), updateVaccineProduct);
router.delete('/vaccine-delete-product/:id', deleteVaccineProduct);



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
router.post('/update-bakery-product/:id', upload.array("images"), updateBakeryProduct);
router.delete('/delete-bakery-product/:id', deleteBakeryProduct);


//create a new PhysioTherapy product route
router.post('/create-physioTherapy', upload.array("images"), createPhysioTherepay);
router.get('/get-physioTherapy', getAllPhysioTherapies);
router.get('/get-physioTherapy/:id', getPhysioTherapyById);
router.post('/update-physioTherapy/:id', upload.array("images"), updatePhysioTherapy);
router.delete('/delete-physioTherapy/:id', upload.array("images"), deletePhysioTherapy);



//create a new coupon route
router.post('/create-coupon', createCoupon);
router.get('/get-coupons', getCoupons);
router.get('/get-coupon/:id', getCouponById);
router.put('/update-coupon/:id', updateCoupon);
router.delete('/delete-coupon/:id', deleteCoupon);

//create a pet shop category route
router.post('/petshop-category',upload.single("image"), createPetShopCategory);
router.get('/petshop-category', getAllPetShopCategories);
router.get('/petshop-category/:id', getSinglePetShopCategory);
router.put('/petshop-category/:id',upload.single("image"), updatePetShopCategory);
router.delete('/petshop-category/:id', deletePetShopCategory);


//create a pet shop sub category route
router.post('/petshop-sub-category',upload.single("image"), createPetShopSubCategory);
router.get('/petshop-sub-category', getAllPetShopSubCategories);
router.get('/petshop-sub-category/:id', getSinglePetShopSubCategory);
router.post('/petshop-sub-category/:id',upload.single("image"), updatePetShopSubCategory);
router.delete('/petshop-sub-category/:id', deletePetShopSubCategory);


module.exports = router;