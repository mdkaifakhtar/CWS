const express = require('express');
const { getMyVehicles, addVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('user'));

router.get('/', getMyVehicles);
router.post('/', addVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
