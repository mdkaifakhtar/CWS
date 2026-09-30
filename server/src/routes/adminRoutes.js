const express = require('express');
const {
  getAdminDashboard,
  getVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  suspendVendor,
  restoreVendor,
} = require('../controllers/adminController');
const {
  getAllCategories,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
} = require('../controllers/adminCategoryController');
const {
  getAllServices,
  getServiceDetail: getAdminServiceDetail,
  approveService,
  rejectService,
  toggleServiceFeatured,
  toggleServiceActive,
} = require('../controllers/adminServiceController');
const { getUsers, getUserDetail, toggleUserActive } = require('../controllers/adminUserController');
const { getSettings, updateSettings } = require('../controllers/adminSettingsController');
const { getDailySummary, getBookingLedger, getVendorPerformance } = require('../controllers/adminFinanceController');
const {
  getCollectionsOverview,
  getVendorCollectionHistory,
  recordCollection,
} = require('../controllers/adminCollectionsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getAdminDashboard);

// Vendor approval workflow
router.get('/vendors', getVendors);
router.get('/vendors/:id', getVendorDetail);
router.put('/vendors/:id/approve', approveVendor);
router.put('/vendors/:id/reject', rejectVendor);
router.put('/vendors/:id/suspend', suspendVendor);
router.put('/vendors/:id/restore', restoreVendor);

// Service categories
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.put('/categories/:id/toggle-active', toggleCategoryActive);
router.delete('/categories/:id', deleteCategory);

// Platform-wide service moderation
router.get('/services', getAllServices);
router.get('/services/:id', getAdminServiceDetail);
router.put('/services/:id/approve', approveService);
router.put('/services/:id/reject', rejectService);
router.put('/services/:id/toggle-featured', toggleServiceFeatured);
router.put('/services/:id/toggle-active', toggleServiceActive);

// Customer management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/toggle-active', toggleUserActive);

// Platform settings (commission %, lead time)
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Daily operations / financial reporting
router.get('/finance/daily-summary', getDailySummary);
router.get('/finance/ledger', getBookingLedger);
router.get('/finance/vendor-performance', getVendorPerformance);

// Vendor collections / settlement ledger
router.get('/collections', getCollectionsOverview);
router.get('/collections/:vendorId', getVendorCollectionHistory);
router.post('/collections/:vendorId', recordCollection);

module.exports = router;
