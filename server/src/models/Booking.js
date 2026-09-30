const mongoose = require('mongoose');

// Shop-visit model: the customer visits the vendor's physical shop. There is
// no doorstep/home-service flow — the service location is always the
// vendor's registered business address (see Vendor.businessAddress).
const BOOKING_STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Rejected', 'Cancelled'];

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true }, // e.g. CW-20260828-0001
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    // Vehicle type is duplicated here (not just via the Vehicle ref) because
    // pricing is looked up per-vehicle-type at booking time and a customer
    // could later edit/delete the Vehicle document — this keeps the quoted
    // price and booking record stable regardless.
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },

    scheduledDate: { type: Date, required: true },
    scheduledTimeSlot: { type: String, required: true }, // e.g. "10:00 AM - 11:00 AM"
    specialInstructions: { type: String, default: '' },

    // --- Pricing & commission (snapshotted, never recalculated retroactively) ---
    priceQuoted: { type: Number, required: true, min: 0 }, // = bookingAmount
    commissionRate: { type: Number, default: 0 }, // % at time of completion
    commissionAmount: { type: Number, default: 0 },
    vendorPayableAmount: { type: Number, default: 0 },
    collectedAmount: { type: Number, default: 0 },
    collectionStatus: {
      type: String,
      enum: ['Not Applicable', 'Pending', 'Partially Collected', 'Collected'],
      default: 'Not Applicable',
    },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'collected', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, enum: ['cash_at_shop', 'Pay at shop', null, ''], default: 'cash_at_shop' },
    collectedAt: { type: Date },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    cancelledBy: { type: String, enum: ['user', 'vendor', 'admin', null], default: null },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.statics.STATUSES = BOOKING_STATUSES;

module.exports = mongoose.model('Booking', bookingSchema);
