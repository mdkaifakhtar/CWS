const Booking = require('../models/Booking');

/**
 * Generates a human-friendly, unique booking code like CW-20260828-0007
 */
const generateBookingCode = async () => {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const countToday = await Booking.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const sequence = String(countToday + 1).padStart(4, '0');
  return `CW-${datePart}-${sequence}`;
};

module.exports = generateBookingCode;
