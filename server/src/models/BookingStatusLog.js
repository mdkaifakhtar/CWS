const mongoose = require('mongoose');

const bookingStatusLogSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookingStatusLog', bookingStatusLogSchema);
