const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleType', required: true },
    nickname: { type: String, default: '' }, // e.g. "My Nexon"
    make: { type: String, default: '' }, // e.g. "Tata"
    model: { type: String, default: '' }, // e.g. "Nexon"
    registrationNumber: { type: String, default: '', trim: true, uppercase: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
