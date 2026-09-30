const express = require('express');
const { registerVendor } = require('../controllers/vendorAuthController');
const {
  getMyVendorProfile,
  updateMyVendorProfile,
  uploadVendorDocuments,
  deleteVendorDocument,
  getVendorDashboard,
  getVendorReviews,
} = require('../controllers/vendorController');
const {
  getMyServices,
  getMyServiceDetail,
  createService,
  updateService,
  toggleServiceActive,
  deleteService,
} = require('../controllers/vendorServiceController');
const {
  getVendorBookings,
  getVendorBookingDetail,
  updateBookingStatus,
  collectBookingPayment,
} = require('../controllers/vendorBookingController');
const { protect, authorize } = require('../middleware/auth');
const { loadVendorProfile, requireApprovedVendor } = require('../middleware/vendorGuard');
const upload = require('../middleware/upload');

const router = express.Router();

// Public
router.post('/register', registerVendor);

// Everything below requires a logged-in vendor with a linked business profile
router.use(protect, authorize('vendor'), loadVendorProfile);

router.get('/me', getMyVendorProfile);
router.put('/me', updateMyVendorProfile);
router.get('/dashboard', getVendorDashboard);
router.get('/reviews', getVendorReviews);

router.post('/documents', upload.array('files', 5), uploadVendorDocuments);
router.delete('/documents/:docId', deleteVendorDocument);

// Services — creating/editing requires an approved account
router.get('/services', getMyServices);
router.get('/services/:id', getMyServiceDetail);
router.post('/services', requireApprovedVendor, createService);
router.put('/services/:id', requireApprovedVendor, updateService);
router.put('/services/:id/toggle-active', requireApprovedVendor, toggleServiceActive);
router.delete('/services/:id', requireApprovedVendor, deleteService);

// Bookings — responding to bookings requires an approved account
router.get('/bookings', getVendorBookings);
router.get('/bookings/:id', getVendorBookingDetail);
router.put('/bookings/:id/status', requireApprovedVendor, updateBookingStatus);
router.put('/bookings/:id/collect-payment', requireApprovedVendor, collectBookingPayment);

module.exports = router;

