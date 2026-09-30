const asyncHandler = require('express-async-handler');
const Vehicle = require('../models/Vehicle');

// @desc    List the logged-in customer's saved vehicles
// @route   GET /api/vehicles
const getMyVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id }).populate('vehicleType', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: vehicles });
});

// @desc    Add a vehicle
// @route   POST /api/vehicles
const addVehicle = asyncHandler(async (req, res) => {
  const { vehicleType, nickname, make, model, registrationNumber, isDefault } = req.body;

  if (!vehicleType) {
    res.status(400);
    throw new Error('vehicleType is required');
  }

  if (isDefault) {
    await Vehicle.updateMany({ owner: req.user._id }, { isDefault: false });
  }

  const existingCount = await Vehicle.countDocuments({ owner: req.user._id });

  const vehicle = await Vehicle.create({
    owner: req.user._id,
    vehicleType,
    nickname,
    make,
    model,
    registrationNumber,
    isDefault: !!isDefault || existingCount === 0,
  });

  const populated = await vehicle.populate('vehicleType', 'name');
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const EDITABLE = ['vehicleType', 'nickname', 'make', 'model', 'registrationNumber', 'isDefault'];
  EDITABLE.forEach((field) => {
    if (req.body[field] !== undefined) vehicle[field] = req.body[field];
  });

  if (req.body.isDefault) {
    await Vehicle.updateMany({ owner: req.user._id, _id: { $ne: vehicle._id } }, { isDefault: false });
  }

  await vehicle.save();
  const populated = await vehicle.populate('vehicleType', 'name');
  res.json({ success: true, data: populated });
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  res.json({ success: true, data: { deletedId: req.params.id } });
});

module.exports = { getMyVehicles, addVehicle, updateVehicle, deleteVehicle };
