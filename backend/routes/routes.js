const express = require('express');
const { createPetType, updatePetType, deletePetType, getAllPetTypes } = require('../controller/Pet controller/PetType');
const { upload } = require('../middleware/multer');
const { registerPet, verifyOtp, resendOtp, loginPet, loginPetverifyOtp, getPetProfile, updatePetProfile, deletePetProfile, changePetOwnerNumber, verifyNumberChangeOtp, getAllPets } = require('../controller/Pet controller/PetAuth');
const { createMainCategory , getAllCategories,getSingleCategory,updateCategory,deleteCategory} = require('../controller/Main Category/MainCategory');
const { createTypeOfVaccine, getAllTypeOfVaccines, getSingleTypeOfVaccine, updateTypeOfVaccine, deleteTypeOfVaccine } = require('../controller/Vaccine/TypeOfVaccine');
const { createVaccineProduct, getAllVaccineProducts, getSingleVaccineProduct, updateVaccineProduct, deleteVaccineProduct } = require('../controller/Vaccine/VaccinationController');

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
router.post('/main-pet-category',upload.single('image'), createMainCategory);
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
router.post('/vaccine-product',upload.array('images') , createVaccineProduct);
router.get('/vaccine-products', getAllVaccineProducts);
router.get('/vaccine-product/:id', getSingleVaccineProduct);
router.put('/vaccine-update-product/:id', upload.array('image') , updateVaccineProduct);
router.delete('/vaccine-delete-product/:id', deleteVaccineProduct);

module.exports = router;