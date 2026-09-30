const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/Review');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');
const { isValidEmail, isValidPhone } = require('../utils/validators');
const { notifyRole } = require('../utils/notify');

// @desc    Get the logged-in vendor's business profile
// @route   GET /api/vendor/me
const getMyVendorProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.vendor });
});

// Fields a vendor is allowed to self-edit. Approval/suspension fields are
// deliberately excluded so a vendor can never bypass the admin workflow.
const EDITABLE_FIELDS = [
  'businessName',
  'businessRegistrationNumber',
  'ownerName',
  'ownerPhone',
  'ownerEmail',
  'ownerAddress',
  'phone',
  'businessAddress',
  'serviceAreas',
  'city',
  'state',
  'pincode',
  'location',
  'description',
  'coverImageUrl',
  'galleryImages',
  'workingDays',
  'workingHours',
  'unavailableDates',
];

// @desc    Update editable business info. If a previously rejected vendor
//          edits their profile, this counts as a resubmission: status moves
//          back to "pending" and admins are notified again.
// @route   PUT /api/vendor/me
const updateMyVendorProfile = asyncHandler(async (req, res) => {
  if (req.body.email !== undefined && !isValidEmail(req.body.email)) {
    res.status(400);
    throw new Error('Enter a valid business email address');
  }
  if (req.body.phone !== undefined && !isValidPhone(req.body.phone)) {
    res.status(400);
    throw new Error('Enter a valid business phone number');
  }
  if (req.body.ownerPhone && !isValidPhone(req.body.ownerPhone)) {
    res.status(400);
    throw new Error('Enter a valid owner mobile number');
  }
  if (req.body.ownerEmail && !isValidEmail(req.body.ownerEmail)) {
    res.status(400);
    throw new Error('Enter a valid owner email address');
  }

  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.vendor[field] = req.body[field];
    }
  });

  const wasRejected = req.vendor.approvalStatus === 'rejected';
  if (wasRejected) {
    req.vendor.approvalStatus = 'pending';
    req.vendor.rejectionReason = '';
    req.vendor.resubmissionCount += 1;
  }

  await req.vendor.save();

  if (wasRejected) {
    await notifyRole({
      recipientRole: 'admin',
      type: 'vendor_resubmitted',
      title: `Vendor resubmitted: ${req.vendor.businessName}`,
      message: `${req.vendor.businessName} updated their application after a rejection and is awaiting re-review.`,
      link: `/admin/vendors/${req.vendor._id}`,
    });
  }

  res.json({ success: true, data: req.vendor });
});

// @desc    Upload one or more verification documents (Cloudinary) and attach them.
//          Also counts as a resubmission if the vendor was previously rejected.
// @route   POST /api/vendor/documents
const uploadVendorDocuments = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    res.status(400);
    throw new Error('No files were provided');
  }

  const docType = Vendor.DOCUMENT_TYPES.includes(req.body.type) ? req.body.type : 'other';

  const uploaded = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: `carwash-platform/vendor-documents/${req.vendor._id}`,
      resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    });
    uploaded.push({ type: docType, name: req.body.label || file.originalname, url: result.secure_url });
  }

  req.vendor.documents.push(...uploaded);

  const wasRejected = req.vendor.approvalStatus === 'rejected';
  if (wasRejected) {
    req.vendor.approvalStatus = 'pending';
    req.vendor.rejectionReason = '';
    req.vendor.resubmissionCount += 1;
  }

  await req.vendor.save();

  if (wasRejected) {
    await notifyRole({
      recipientRole: 'admin',
      type: 'vendor_resubmitted',
      title: `Vendor resubmitted: ${req.vendor.businessName}`,
      message: `${req.vendor.businessName} uploaded new documents after a rejection and is awaiting re-review.`,
      link: `/admin/vendors/${req.vendor._id}`,
    });
  }

  res.status(201).json({ success: true, data: req.vendor.documents });
});

// @desc    Remove a previously uploaded document
// @route   DELETE /api/vendor/documents/:docId
const deleteVendorDocument = asyncHandler(async (req, res) => {
  const doc = req.vendor.documents.id(req.params.docId);
  if (!doc) {
    res.status(404);
    throw new Error('Document not found');
  }
  doc.deleteOne();
  await req.vendor.save();
  res.json({ success: true, data: req.vendor.documents });
});

// @desc    Vendor dashboard summary: booking counts, monthly trend, earnings, ratings
// @route   GET /api/vendor/dashboard
const getVendorDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalBookings,
    pendingBookings,
    acceptedBookings,
    completedBookings,
    cancelledBookings,
    monthlyBookings,
    earningsAgg,
    totalServices,
    activeServices,
    recentBookings,
  ] = await Promise.all([
    Booking.countDocuments({ vendor: vendorId }),
    Booking.countDocuments({ vendor: vendorId, status: 'Pending' }),
    Booking.countDocuments({
      vendor: vendorId,
      status: { $in: ['Confirmed', 'In Progress'] },
    }),
    Booking.countDocuments({ vendor: vendorId, status: 'Completed' }),
    Booking.countDocuments({ vendor: vendorId, status: { $in: ['Cancelled', 'Rejected'] } }),
    Booking.countDocuments({ vendor: vendorId, createdAt: { $gte: startOfMonth } }),
    Booking.aggregate([
      { $match: { vendor: vendorId, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$priceQuoted' } } },
    ]),
    Service.countDocuments({ vendor: vendorId }),
    Service.countDocuments({ vendor: vendorId, isActive: true }),
    Booking.find({ vendor: vendorId })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('service', 'name')
      .populate('user', 'name phone'),
  ]);

  res.json({
    success: true,
    data: {
      totalBookings,
      pendingBookings,
      acceptedBookings,
      completedBookings,
      cancelledBookings,
      monthlyBookings,
      totalEarnings: earningsAgg[0]?.total || 0,
      totalServices,
      activeServices,
      ratingAverage: req.vendor.ratingAverage,
      ratingCount: req.vendor.ratingCount,
      approvalStatus: req.vendor.approvalStatus,
      recentBookings,
    },
  });
});

// @desc    Reviews received by the vendor
// @route   GET /api/vendor/reviews
const getVendorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ vendor: req.vendor._id, isHidden: false })
    .populate('user', 'name avatarUrl')
    .populate('service', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

module.exports = {
  getMyVendorProfile,
  updateMyVendorProfile,
  uploadVendorDocuments,
  deleteVendorDocument,
  getVendorDashboard,
  getVendorReviews,
};
