const express = require('express');
const {
  getCategories,
  getVehicleTypes,
  searchServices,
  getServiceDetail,
  getVendorDetail,
  getNearbyVendors,
  getHomeFeed,
} = require('../controllers/catalogController');
const { getServiceAvailability } = require('../controllers/availabilityController');

const router = express.Router();

router.get('/home', getHomeFeed);
router.get('/categories', getCategories);
router.get('/vehicle-types', getVehicleTypes);
router.get('/services', searchServices);
router.get('/services/:id', getServiceDetail);
router.get('/services/:id/availability', getServiceAvailability);
router.get('/nearby-vendors', getNearbyVendors);
router.get('/vendors', getNearbyVendors);
router.get('/vendors/:id', getVendorDetail);

module.exports = router;

