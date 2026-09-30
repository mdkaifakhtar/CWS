const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const BookingStatusLog = require('../models/BookingStatusLog');
const PlatformSettings = require('../models/PlatformSettings');
const { computeCommissionBreakdown } = require('../utils/commission');
const { notifyUser } = require('../utils/notify');

// Shop-visit flow: Pending -> Confirmed -> In Progress -> Completed, with
// Rejected only possible from Pending (a vendor can't "reject" a booking
// they already confirmed — they'd cancel it, which isn't a vendor action
// in this build; see README for that limitation).
const ALLOWED_TRANSITIONS = {
  Pending: ['Confirmed', 'Rejected'],
  Confirmed: ['In Progress'],
  'In Progress': ['Completed'],
};

const STATUS_NOTIFICATIONS = {
  Confirmed: {
    type: 'booking_accepted',
    title: 'Your booking is confirmed',
    message: (b) => `${b.vendorName} confirmed your booking for "${b.serviceName}". Please visit the shop at your booked time.`,
  },
  Rejected: {
    type: 'booking_rejected',
    title: 'Your booking was rejected',
    message: (b, reason) => reason || `${b.vendorName} was unable to accept this booking.`,
  },
  'In Progress': {
    type: 'booking_started',
    title: 'Your service has started',
    message: (b) => `${b.vendorName} has started work on "${b.serviceName}".`,
  },
  Completed: {
    type: 'booking_completed',
    title: 'Your service is complete',
    message: (b) => `"${b.serviceName}" is complete. Don't forget to leave a review!`,
  },
};

// @desc    List bookings belonging to the logged-in vendor
// @route   GET /api/vendor/bookings
const getVendorBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { vendor: req.vendor._id };
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name phone email')
      .populate('service', 'name images')
      .populate('vehicle')
      .populate('vehicleType', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Get a single owned booking + its status history
// @route   GET /api/vendor/bookings/:id
const getVendorBookingDetail = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, vendor: req.vendor._id })
    .populate('user', 'name phone email')
    .populate('service', 'name images durationMinutes')
    .populate('vehicle')
    .populate('vehicleType', 'name');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const statusHistory = await BookingStatusLog.find({ booking: booking._id }).sort({ createdAt: 1 });
  res.json({ success: true, data: { booking, statusHistory } });
});

// @desc    Update a booking's status (confirm/reject/start/complete)
// @route   PUT /api/vendor/bookings/:id/status
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('status is required');
  }

  const booking = await Booking.findOne({ _id: req.params.id, vendor: req.vendor._id }).populate(
    'service',
    'name'
  );
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found or does not belong to your account');
  }

  const allowedNext = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowedNext.includes(status)) {
    res.status(400);
    throw new Error(
      `Cannot move a booking from "${booking.status}" to "${status}". Allowed next states: ${
        allowedNext.join(', ') || 'none (this is a terminal status)'
      }`
    );
  }

  booking.status = status;

  if (status === 'Rejected') {
    booking.cancelledBy = 'vendor';
    booking.cancellationReason = reason || 'Rejected by vendor';
  }

  // Money is only collected once the customer has actually visited the shop
  // and the service is complete — snapshot the commission breakdown using
  // the platform's *current* rate at that moment, so later commission
  // changes never retroactively alter a completed booking's numbers.
  if (status === 'Completed') {
    const settings = await PlatformSettings.getSettings();
    const { commissionRate, commissionAmount, vendorPayableAmount } = computeCommissionBreakdown(
      booking.priceQuoted,
      settings.commissionPercent
    );
    booking.commissionRate = commissionRate;
    booking.commissionAmount = commissionAmount;
    booking.vendorPayableAmount = vendorPayableAmount;
    booking.collectionStatus = 'Pending';
  }

  await booking.save();

  await BookingStatusLog.create({
    booking: booking._id,
    status,
    changedBy: req.user._id,
    note: reason || '',
  });

  const notif = STATUS_NOTIFICATIONS[status];
  if (notif) {
    await notifyUser({
      recipient: booking.user,
      type: notif.type,
      title: notif.title,
      message: notif.message({ vendorName: req.vendor.businessName, serviceName: booking.service?.name }, reason),
      link: `/dashboard/bookings/${booking._id}`,
    });
  }

  const populated = await booking.populate([
    { path: 'user', select: 'name phone email' },
    { path: 'service', select: 'name images' },
    { path: 'vehicle' },
    { path: 'vehicleType', select: 'name' },
  ]);

  res.json({ success: true, data: populated });
});

// @desc    Mark cash payment collected at shop for a booking
// @route   PUT /api/vendor/bookings/:id/collect-payment
const collectBookingPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, vendor: req.vendor._id });
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found or does not belong to your account');
  }

  booking.paymentStatus = 'collected';
  booking.paymentMethod = 'cash_at_shop';
  booking.collectedAt = new Date();
  booking.collectedBy = req.user._id;
  booking.collectionStatus = 'Collected';

  await booking.save();

  const populated = await booking.populate([
    { path: 'user', select: 'name phone email' },
    { path: 'service', select: 'name images' },
    { path: 'vehicle' },
    { path: 'vehicleType', select: 'name' },
  ]);

  res.json({ success: true, data: populated });
});

module.exports = { getVendorBookings, getVendorBookingDetail, updateBookingStatus, collectBookingPayment };

