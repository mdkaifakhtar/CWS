const mongoose = require('mongoose');

const vehicleTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Hatchback, Sedan, SUV, Luxury, Bike
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VehicleType', vehicleTypeSchema);
