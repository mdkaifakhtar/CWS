const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');
const { computeAvailableSlots } = require('../utils/slotGenerator');

const ACTIVE_BOOKING_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

// @desc    Get real bookable time slots for a service's vendor on a given date
// @route   GET /api/catalog/services/:id/availability?date=YYYY-MM-DD
// @access  Public
const getServiceAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400);
    throw new Error('A valid date query param (YYYY-MM-DD) is required');
  }

  const service = await Service.findOne({ _id: req.params.id, isActive: true, approvalStatus: 'approved' });
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  const vendor = await Vendor.findOne({ _id: service.vendor, isActive: true, approvalStatus: 'approved' });
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const existingBookings = await Booking.find({
    vendor: vendor._id,
    scheduledDate: { $gte: dayStart, $lte: dayEnd },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  }).select('scheduledTimeSlot');

  const bookedSlotLabels = existingBookings.map((b) => b.scheduledTimeSlot);

  const result = computeAvailableSlots({ vendor, dateStr: date, bookedSlotLabels });

  res.json({ success: true, data: result });
});

module.exports = { getServiceAvailability };
