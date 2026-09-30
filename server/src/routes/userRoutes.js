const express = require('express');
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getDashboardSummary,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('user'));

router.get('/dashboard', getDashboardSummary);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

module.exports = router;
