const express = require('express');
const { createReview, getMyReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('user'));

router.post('/', createReview);
router.get('/my', getMyReviews);

module.exports = router;
