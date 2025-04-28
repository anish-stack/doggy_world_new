const express = require('express');
const { createPetType, updatePetType, deletePetType, getAllPetTypes } = require('../controller/Pet controller/PetType');
const { upload } = require('../middleware/multer');
const { registerPet, verifyOtp, resendOtp, loginPet, loginPetverifyOtp, getPetProfile, updatePetProfile, deletePetProfile, changePetOwnerNumber, verifyNumberChangeOtp, getAllPets } = require('../controller/Pet controller/PetAuth');
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




module.exports = router;