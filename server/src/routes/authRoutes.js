const express = require('express');
const { registerUser, loginUser, getMe, updateMe, changePassword, changeEmail } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
// Self-service only: both act on req.user from the JWT, never on an id from the body.
router.put('/change-password', protect, changePassword);
router.put('/change-email', protect, authorize('admin'), changeEmail);

module.exports = router;
