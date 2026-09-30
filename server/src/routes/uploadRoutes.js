const express = require('express');
const { uploadImages, uploadServiceImages } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/images', protect, authorize('vendor', 'admin'), upload.any(), uploadImages);
router.post('/service-images', protect, authorize('vendor', 'admin'), upload.any(), uploadServiceImages);

module.exports = router;

