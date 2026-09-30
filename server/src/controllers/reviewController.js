const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');

const recalcRatings = async (serviceId, vendorId) => {
  const [serviceAgg] = await Review.aggregate([
    { $match: { service: serviceId, isHidden: false } },
    { $group: { _id: '$service', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const [vendorAgg] = await Review.aggregate([
    { $match: { vendor: vendorId, isHidden: false } },
    { $group: { _id: '$vendor', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Service.findByIdAndUpdate(serviceId, {
    ratingAverage: serviceAgg ? Number(serviceAgg.avg.toFixed(1)) : 0,
    ratingCount: serviceAgg ? serviceAgg.count : 0,
  });
  await Vendor.findByIdAndUpdate(vendorId, {
    ratingAverage: vendorAgg ? Number(vendorAgg.avg.toFixed(1)) : 0,
    ratingCount: vendorAgg ? vendorAgg.count : 0,
  });
};

// @desc    Submit a review for a completed booking
// @route   POST /api/reviews
// @access  Private (user)
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating) {
    res.status(400);
    throw new Error('bookingId and rating are required');
  }

  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Completed') {
    res.status(400);
    throw new Error('You can only review a booking after the service is completed');
  }

  const existing = await Review.findOne({ booking: booking._id });
  if (existing) {
    res.status(400);
    throw new Error('This booking has already been reviewed');
  }

  const review = await Review.create({
    booking: booking._id,
    user: req.user._id,
    vendor: booking.vendor,
    service: booking.service,
    rating,
    comment,
  });

  await recalcRatings(booking.service, booking.vendor);

  res.status(201).json({ success: true, data: review });
});

// @desc    Get reviews the current user has written
// @route   GET /api/reviews/my
// @access  Private (user)
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('vendor', 'businessName')
    .populate('service', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

module.exports = { createReview, getMyReviews };
