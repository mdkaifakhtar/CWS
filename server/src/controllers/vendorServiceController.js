const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');

const OTHER_NAME = 'Other';
const OTHER_SENTINEL = 'other';

// Resolve the "Other" category document (created hidden on first use so the
// public category list/filters are unchanged).
const getOtherCategory = async () => {
  let cat = await ServiceCategory.findOne({ name: OTHER_NAME });
  if (!cat) {
    cat = await ServiceCategory.create({ name: OTHER_NAME, slug: 'other', sortOrder: 999, isActive: false });
  }
  return cat;
};

// Returns { category, isOther } where category is a real ObjectId (or original value).
const resolveCategory = async (category) => {
  if (category === OTHER_SENTINEL) {
    const cat = await getOtherCategory();
    return { category: cat._id, isOther: true };
  }
  const cat = await ServiceCategory.findById(category).select('name');
  return { category, isOther: !!cat && cat.name === OTHER_NAME };
};

// @desc    List all of the logged-in vendor's services (any status)
// @route   GET /api/vendor/services
const getMyServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ vendor: req.vendor._id })
    .populate('category', 'name slug')
    .populate('vehiclePricing.vehicleType', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: services });
});

// @desc    Get a single owned service
// @route   GET /api/vendor/services/:id
const getMyServiceDetail = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, vendor: req.vendor._id })
    .populate('category', 'name slug')
    .populate('vehiclePricing.vehicleType', 'name');

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  res.json({ success: true, data: service });
});

// @desc    Create a new service listing (requires an approved vendor account)
// @route   POST /api/vendor/services
const createService = asyncHandler(async (req, res) => {
  const {
    category,
    name,
    description,
    images,
    basePrice,
    vehiclePricing,
    durationMinutes,
    includedItems,
    discountPercent,
  } = req.body;

  const resolved = category ? await resolveCategory(category) : { category, isOther: false };
  const customName = typeof req.body.customServiceName === 'string' ? req.body.customServiceName.trim() : '';

  if (resolved.isOther && !customName) {
    res.status(400);
    throw new Error('Custom service name is required when category is Other');
  }

  if (!category || (!resolved.isOther && !name) || !basePrice || !durationMinutes) {
    res.status(400);
    throw new Error('category, name, basePrice and durationMinutes are required');
  }

  const service = await Service.create({
    vendor: req.vendor._id,
    category: resolved.category,
    name: resolved.isOther ? customName : name,
    customServiceName: resolved.isOther ? customName : '',
    description,
    images,
    basePrice,
    vehiclePricing,
    durationMinutes,
    includedItems,
    discountPercent,
    // An already-approved vendor's own services are auto-approved for listing.
    // Admin-level per-service moderation can be layered on in a later phase.
    approvalStatus: 'approved',
    isActive: true,
  });

  res.status(201).json({ success: true, data: service });
});

// @desc    Update an owned service
// @route   PUT /api/vendor/services/:id
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, vendor: req.vendor._id });

  if (!service) {
    res.status(404);
    throw new Error('Service not found or you do not have permission to edit it');
  }

  const EDITABLE_FIELDS = [
    'category',
    'name',
    'description',
    'images',
    'basePrice',
    'vehiclePricing',
    'durationMinutes',
    'includedItems',
    'discountPercent',
  ];

  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) service[field] = req.body[field];
  });

  // "Other" category handling (custom service name)
  const resolved = await resolveCategory(req.body.category !== undefined ? req.body.category : service.category);
  service.category = resolved.category;
  if (resolved.isOther) {
    const incoming = typeof req.body.customServiceName === 'string' ? req.body.customServiceName : service.customServiceName || service.name;
    const customName = (incoming || '').trim();
    if (!customName) {
      res.status(400);
      throw new Error('Custom service name is required when category is Other');
    }
    service.customServiceName = customName;
    service.name = customName;
  } else {
    service.customServiceName = '';
  }

  await service.save();
  res.json({ success: true, data: service });
});

// @desc    Toggle a service active/inactive (pause without deleting)
// @route   PUT /api/vendor/services/:id/toggle-active
const toggleServiceActive = asyncHandler(async (req, res) => {
  const service = await Service.findOne({ _id: req.params.id, vendor: req.vendor._id });
  if (!service) {
    res.status(404);
    throw new Error('Service not found or you do not have permission to edit it');
  }
  service.isActive = !service.isActive;
  await service.save();
  res.json({ success: true, data: service });
});

// @desc    Delete an owned service
// @route   DELETE /api/vendor/services/:id
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findOneAndDelete({ _id: req.params.id, vendor: req.vendor._id });
  if (!service) {
    res.status(404);
    throw new Error('Service not found or you do not have permission to delete it');
  }
  res.json({ success: true, data: { deletedId: req.params.id } });
});

module.exports = {
  getMyServices,
  getMyServiceDetail,
  createService,
  updateService,
  toggleServiceActive,
  deleteService,
};
