const mongoose = require('mongoose');

/**
 * A Service is the concrete, bookable listing a vendor offers
 * (e.g. "Premium Car Wash" by "Shine Auto Care").
 * It plays the role of both "service" and "service package" described
 * in the requirements doc's User Website / Vendor Panel sections.
 */
const vehiclePriceSchema = new mongoose.Schema(
  {
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    customServiceName: { type: String, default: '', trim: true }, // set only when category is "Other"
    description: { type: String, default: '' },
    images: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    vehiclePricing: [vehiclePriceSchema], // optional per-vehicle-type overrides
    durationMinutes: { type: Number, required: true, min: 5 },
    includedItems: [{ type: String }],
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    moderationReason: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false, index: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ name: 'text', description: 'text' });

serviceSchema.methods.priceForVehicleType = function priceForVehicleType(vehicleTypeId) {
  const override = this.vehiclePricing.find(
    (vp) => vp.vehicleType.toString() === vehicleTypeId?.toString()
  );
  const base = override ? override.price : this.basePrice;
  if (!this.discountPercent) return base;
  return Math.round(base * (1 - this.discountPercent / 100));
};

module.exports = mongoose.model('Service', serviceSchema);
