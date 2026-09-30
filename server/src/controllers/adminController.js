const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { notifyUser } = require('../utils/notify');

// @desc    Admin dashboard summary
// @route   GET /api/admin/dashboard
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalVendors,
    pendingVendorApprovals,
    approvedVendors,
    suspendedVendors,
    totalServices,
    totalBookings,
    pendingBookings,
    completedBookings,
    cancelledBookings,
    recentVendors,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Vendor.countDocuments(),
    Vendor.countDocuments({ approvalStatus: 'pending' }),
    Vendor.countDocuments({ approvalStatus: 'approved' }),
    Vendor.countDocuments({ approvalStatus: 'suspended' }),
    Service.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'Pending' }),
    Booking.countDocuments({ status: 'Completed' }),
    Booking.countDocuments({ status: { $in: ['Cancelled', 'Rejected'] } }),
    Vendor.find().sort({ createdAt: -1 }).limit(6).select('businessName city approvalStatus createdAt'),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalVendors,
      pendingVendorApprovals,
      approvedVendors,
      suspendedVendors,
      totalServices,
      totalBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      recentVendors,
    },
  });
});

// @desc    Search / filter vendors
// @route   GET /api/admin/vendors
// query: status, q, page, limit
const getVendors = asyncHandler(async (req, res) => {
  const { status, q, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.approvalStatus = status;
  if (q) {
    filter.$or = [
      { businessName: new RegExp(q, 'i') },
      { ownerName: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Vendor.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: vendors,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Get full vendor detail (profile + documents + stats) for the review screen
// @route   GET /api/admin/vendors/:id
const getVendorDetail = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id).populate('owner', 'name email phone isActive');
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  const [serviceCount, bookingCount, completedBookingCount] = await Promise.all([
    Service.countDocuments({ vendor: vendor._id }),
    Booking.countDocuments({ vendor: vendor._id }),
    Booking.countDocuments({ vendor: vendor._id, status: 'Completed' }),
  ]);

  res.json({
    success: true,
    data: { vendor, stats: { serviceCount, bookingCount, completedBookingCount } },
  });
});

// @desc    Approve a pending (or previously rejected) vendor
// @route   PUT /api/admin/vendors/:id/approve
const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  vendor.approvalStatus = 'approved';
  vendor.isActive = true;
  vendor.approvedAt = new Date();
  vendor.rejectionReason = '';
  vendor.suspensionReason = '';
  await vendor.save();

  await notifyUser({
    recipient: vendor.owner,
    type: 'vendor_approved',
    title: 'Your vendor account has been approved',
    message: `${vendor.businessName} is now live. You can start adding services and receiving bookings.`,
    link: '/vendor',
  });

  res.json({ success: true, data: vendor });
});

// @desc    Reject a pending vendor with a reason
// @route   PUT /api/admin/vendors/:id/reject
const rejectVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('A rejection reason is required');
  }

  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  vendor.approvalStatus = 'rejected';
  vendor.rejectionReason = reason;
  vendor.isActive = false;
  await vendor.save();

  await notifyUser({
    recipient: vendor.owner,
    type: 'vendor_rejected',
    title: 'Your vendor application was rejected',
    message: reason,
    link: '/vendor',
  });

  res.json({ success: true, data: vendor });
});

// @desc    Suspend a currently approved vendor
// @route   PUT /api/admin/vendors/:id/suspend
const suspendVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('A suspension reason is required');
  }

  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  vendor.approvalStatus = 'suspended';
  vendor.suspensionReason = reason;
  vendor.isActive = false;
  vendor.suspendedAt = new Date();
  await vendor.save();

  await notifyUser({
    recipient: vendor.owner,
    type: 'vendor_suspended',
    title: 'Your vendor account has been suspended',
    message: reason,
    link: '/vendor',
  });

  res.json({ success: true, data: vendor });
});

// @desc    Restore a suspended vendor back to approved
// @route   PUT /api/admin/vendors/:id/restore
const restoreVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  if (vendor.approvalStatus !== 'suspended') {
    res.status(400);
    throw new Error('Only a suspended vendor can be restored');
  }

  vendor.approvalStatus = 'approved';
  vendor.isActive = true;
  vendor.suspensionReason = '';
  await vendor.save();

  await notifyUser({
    recipient: vendor.owner,
    type: 'vendor_restored',
    title: 'Your vendor account has been restored',
    message: `${vendor.businessName} is active again.`,
    link: '/vendor',
  });

  res.json({ success: true, data: vendor });
});

module.exports = {
  getAdminDashboard,
  getVendors,
  getVendorDetail,
  approveVendor,
  rejectVendor,
  suspendVendor,
  restoreVendor,
};
