const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Vehicle = require('../models/Vehicle');

// @desc    List / search customers
// @route   GET /api/admin/users
// query: q, isActive, page, limit
const getUsers = asyncHandler(async (req, res) => {
  const { q, isActive, page = 1, limit = 10 } = req.query;
  const filter = { role: 'user' };
  if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Get a single customer's profile + booking/spend/vehicle stats
// @route   GET /api/admin/users/:id
const getUserDetail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'user' }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('Customer not found');
  }

  const [totalBookings, completedBookings, cancelledBookings, reviewCount, spendAgg, vehicles, recentBookings] =
    await Promise.all([
      Booking.countDocuments({ user: user._id }),
      Booking.countDocuments({ user: user._id, status: 'Completed' }),
      Booking.countDocuments({ user: user._id, status: { $in: ['Cancelled', 'Rejected'] } }),
      Review.countDocuments({ user: user._id }),
      Booking.aggregate([
        { $match: { user: user._id, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$priceQuoted' } } },
      ]),
      Vehicle.find({ owner: user._id }).populate('vehicleType', 'name'),
      Booking.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('vendor', 'businessName')
        .populate('service', 'name'),
    ]);

  res.json({
    success: true,
    data: {
      user,
      stats: {
        totalBookings,
        completedBookings,
        cancelledBookings,
        reviewCount,
        totalSpend: spendAgg[0]?.total || 0,
      },
      vehicles,
      recentBookings,
    },
  });
});

// @desc    Activate/deactivate a customer account
// @route   PUT /api/admin/users/:id/toggle-active
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'user' });
  if (!user) {
    res.status(404);
    throw new Error('Customer not found');
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: user.toSafeObject() });
});

module.exports = { getUsers, getUserDetail, toggleUserActive };
