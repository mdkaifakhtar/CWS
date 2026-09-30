const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('user'));

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingDetail);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
