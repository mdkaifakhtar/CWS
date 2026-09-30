const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const BookingStatusLog = require('../models/BookingStatusLog');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
const Vehicle = require('../models/Vehicle');
const generateBookingCode = require('../utils/generateBookingCode');
const { computeAvailableSlots } = require('../utils/slotGenerator');
const { notifyUser } = require('../utils/notify');

const ACTIVE_BOOKING_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

// @desc    Create a new booking (customer visits the vendor's physical shop —
//          there is no doorstep/delivery-address concept in this platform)
// @route   POST /api/bookings
// @access  Private (user)
const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, vehicleId, scheduledDate, scheduledTimeSlot, specialInstructions } = req.body;

  if (!serviceId || !vehicleId || !scheduledDate || !scheduledTimeSlot) {
    res.status(400);
    throw new Error('serviceId, vehicleId, scheduledDate and scheduledTimeSlot are all required');
  }

  const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Selected vehicle was not found on your account');
  }

  const service = await Service.findOne({
    _id: serviceId,
    isActive: true,
    approvalStatus: 'approved',
  });

  if (!service) {
    res.status(404);
    throw new Error('Selected service is not available');
  }

  const vendor = await Vendor.findOne({ _id: service.vendor, isActive: true, approvalStatus: 'approved' });
  if (!vendor) {
    res.status(404);
    throw new Error('Selected vendor is not available');
  }

  const requestedDate = new Date(scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (requestedDate < today) {
    res.status(400);
    throw new Error('Scheduled date cannot be in the past');
  }

  // Server-side re-validation of the requested slot against the vendor's
  // real availability (working hours/days, existing bookings, minimum lead
  // time) — never trust the frontend's own slot display.
  const dateStr = requestedDate.toISOString().slice(0, 10);
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);

  const existingBookings = await Booking.find({
    vendor: vendor._id,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  }).select('scheduledTimeSlot');

  const { isWorkingDay, isUnavailableDate, slots } = computeAvailableSlots({
    vendor,
    dateStr,
    bookedSlotLabels: existingBookings.map((b) => b.scheduledTimeSlot),
  });

  if (!isWorkingDay || isUnavailableDate) {
    res.status(400);
    throw new Error('This shop is not open on the selected date. Please pick another date.');
  }

  const matchingSlot = slots.find((s) => s.label === scheduledTimeSlot);
  if (!matchingSlot || !matchingSlot.available) {
    res.status(409);
    throw new Error('That time slot is no longer available. Please choose a different slot.');
  }

  const priceQuoted = service.priceForVehicleType(vehicle.vehicleType);
  const bookingCode = await generateBookingCode();

  const booking = await Booking.create({
    bookingCode,
    user: req.user._id,
    vendor: vendor._id,
    service: service._id,
    vehicle: vehicle._id,
    vehicleType: vehicle.vehicleType,
    scheduledDate: requestedDate,
    scheduledTimeSlot,
    specialInstructions,
    priceQuoted,
    status: 'Pending',
  });

  await BookingStatusLog.create({
    booking: booking._id,
    status: 'Pending',
    changedBy: req.user._id,
    note: 'Booking submitted by customer, awaiting shop confirmation',
  });

  service.bookingCount += 1;
  await service.save();

  await notifyUser({
    recipient: vendor.owner,
    type: 'booking_created',
    title: 'New booking request',
    message: `${req.user.name} requested "${service.name}" for ${dateStr} at ${scheduledTimeSlot}.`,
    link: `/vendor/bookings/${booking._id}`,
  });

  const populated = await booking.populate([
    { path: 'service', select: 'name images durationMinutes' },
    { path: 'vendor', select: 'businessName city phone businessAddress' },
    { path: 'vehicle' },
    { path: 'vehicleType', select: 'name' },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// @desc    List the logged-in user's bookings (with optional status filter)
// @route   GET /api/bookings/my
// @access  Private (user)
const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('vendor', 'businessName city phone businessAddress')
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

// @desc    Get a single booking's detail + status history
// @route   GET /api/bookings/:id
// @access  Private (owning user)
const getBookingDetail = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id })
    .populate('vendor', 'businessName city phone email businessAddress')
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

// @desc    Cancel a booking (only allowed before service starts)
// @route   PUT /api/bookings/:id/cancel
// @access  Private (owning user)
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const nonCancellable = ['In Progress', 'Completed', 'Cancelled', 'Rejected'];
  if (nonCancellable.includes(booking.status)) {
    res.status(400);
    throw new Error(`Booking cannot be cancelled once it is "${booking.status}"`);
  }

  booking.status = 'Cancelled';
  booking.cancelledBy = 'user';
  booking.cancellationReason = req.body.reason || 'Cancelled by customer';
  await booking.save();

  await BookingStatusLog.create({
    booking: booking._id,
    status: 'Cancelled',
    changedBy: req.user._id,
    note: booking.cancellationReason,
  });

  const vendor = await Vendor.findById(booking.vendor).select('owner businessName');
  if (vendor) {
    await notifyUser({
      recipient: vendor.owner,
      type: 'booking_cancelled',
      title: 'Booking cancelled by customer',
      message: `Booking ${booking.bookingCode} was cancelled: ${booking.cancellationReason}`,
      link: `/vendor/bookings/${booking._id}`,
    });
  }

  res.json({ success: true, data: booking });
});

module.exports = { createBooking, getMyBookings, getBookingDetail, cancelBooking };
