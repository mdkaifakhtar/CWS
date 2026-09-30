const asyncHandler = require('express-async-handler');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');
const Vendor = require('../models/Vendor');
const { findOrCreateCategory, normalizeCategoryName } = require('../utils/categoryHelper');

// @desc    Upload one or more images to Cloudinary / local storage and return their URLs & save metadata
// @route   POST /api/uploads/images
// @access  Private (vendor or admin)
const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    res.status(400);
    throw new Error('No files were provided for upload');
  }

  const category = req.body.category || 'Cover Image';
  const customCategoryName = normalizeCategoryName(req.body.customCategoryName || '');
  if (category === 'Other' && !customCategoryName) {
    res.status(400);
    throw new Error('Custom category name is required when category is Other');
  }
  // "Other" + custom name becomes (or reuses) a REAL category in the category system
  let realCategory = null;
  if (category === 'Other') {
    ({ category: realCategory } = await findOrCreateCategory(customCategoryName));
  }

  const urls = [];
  const photoRecords = [];

  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: 'carwash-platform/shop-images',
      resourceType: 'image',
      originalName: file.originalname,
    });
    const finalUrl = result.secure_url || result.url;
    urls.push(finalUrl);
    photoRecords.push({
      imageUrl: finalUrl,
      category,
      customCategoryName: category === 'Other' ? realCategory.name : '',
      uploadedAt: new Date(),
    });
  }

  const primaryUrl = urls[0];

  // If user is a vendor, persist the uploaded images into MongoDB vendor profile
  if (req.user && req.user.vendorProfile) {
    const vendor = await Vendor.findById(req.user.vendorProfile);
    if (vendor) {
      photoRecords.forEach((p) => {
        vendor.shopPhotos.push(p);
        if (!vendor.galleryImages.includes(p.imageUrl)) {
          vendor.galleryImages.push(p.imageUrl);
        }
      });
      if (category === 'Cover Image' || !vendor.coverImageUrl) {
        vendor.coverImageUrl = primaryUrl;
      }
      await vendor.save();
    }
  }

  res.status(201).json({
    success: true,
    data: {
      url: primaryUrl,
      urls,
      photoRecords,
    },
    url: primaryUrl,
  });
});

// @desc    Upload service/package photos to Cloudinary (does NOT touch the vendor's shop gallery)
// @route   POST /api/uploads/service-images
// @access  Private (vendor or admin)
// Response: { success, data: { url, urls } }  (same shape as /uploads/images minus shop records)
const uploadServiceImages = asyncHandler(async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) {
    res.status(400);
    throw new Error('No files were provided for upload');
  }
  if (files.some((f) => !f.mimetype.startsWith('image/'))) {
    res.status(400);
    throw new Error('Only JPEG, PNG or WEBP images are allowed');
  }
  const urls = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: 'carwash-platform/service-images',
      resourceType: 'image',
      originalName: file.originalname,
      filePrefix: 'service-image',
    });
    urls.push(result.secure_url || result.url);
  }
  res.status(201).json({ success: true, data: { url: urls[0], urls }, url: urls[0] });
});

module.exports = { uploadImages, uploadServiceImages };


