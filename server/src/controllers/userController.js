const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// @desc    List saved addresses
// @route   GET /api/users/addresses
const getAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.addresses });
});

// @desc    Add a new address
// @route   POST /api/users/addresses
const addAddress = asyncHandler(async (req, res) => {
  const { label, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } = req.body;

  if (!addressLine1 || !city) {
    res.status(400);
    throw new Error('Address line 1 and city are required');
  }

  if (isDefault) {
    req.user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  req.user.addresses.push({
    label,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    landmark,
    isDefault: !!isDefault || req.user.addresses.length === 0,
  });

  await req.user.save();
  res.status(201).json({ success: true, data: req.user.addresses });
});

// @desc    Update an address
// @route   PUT /api/users/addresses/:addressId
const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    req.user.addresses.forEach((addr) => {
      if (addr._id.toString() !== address._id.toString()) addr.isDefault = false;
    });
  }

  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
});

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }
  address.deleteOne();
  await req.user.save();
  res.json({ success: true, data: req.user.addresses });
});

// @desc    Dashboard summary: counts + recent bookings
// @route   GET /api/users/dashboard
const getDashboardSummary = asyncHandler(async (req, res) => {
  const [totalBookings, activeBookings, completedBookings, cancelledBookings, recentBookings, reviewsGiven] =
    await Promise.all([
      Booking.countDocuments({ user: req.user._id }),
      Booking.countDocuments({
        user: req.user._id,
        status: { $in: ['Pending', 'Confirmed', 'In Progress'] },
      }),
      Booking.countDocuments({ user: req.user._id, status: 'Completed' }),
      Booking.countDocuments({ user: req.user._id, status: 'Cancelled' }),
      Booking.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vendor', 'businessName city')
        .populate('service', 'name images'),
      Review.countDocuments({ user: req.user._id }),
    ]);

  res.json({
    success: true,
    data: {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      reviewsGiven,
      recentBookings,
    },
  });
});

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getDashboardSummary,
};
