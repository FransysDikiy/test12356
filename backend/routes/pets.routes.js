const express = require('express');
const router = express.Router();
const petController = require('../controllers/pets.controller');
const authMiddleware = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../middlewares/schemas');

router.post('/', authMiddleware(), validate(schemas.createPetSchema), petController.createPet);
router.get('/', authMiddleware(), validate(schemas.getPetsSchema), petController.getPets);
router.put('/:id', authMiddleware(), validate(schemas.updatePetSchema), petController.updatePet);
router.delete('/:id', authMiddleware(), petController.deletePet);
router.get('/:id', authMiddleware(), validate(schemas.getPetSchema), petController.getPetById);
module.exports = router;
