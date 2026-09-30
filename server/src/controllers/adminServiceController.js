const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

// @desc    List all services across all vendors, with filters
// @route   GET /api/admin/services
// query: status, vendor, category, q, page, limit
const getAllServices = asyncHandler(async (req, res) => {
  const { status, vendor, category, q, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (status) filter.approvalStatus = status;
  if (vendor) filter.vendor = vendor;
  if (category) filter.category = category;
  if (q) filter.name = new RegExp(q, 'i');

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const [services, total] = await Promise.all([
    Service.find(filter)
      .populate('vendor', 'businessName city approvalStatus')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Service.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: services,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Get a single service's full detail for the moderation screen
// @route   GET /api/admin/services/:id
const getServiceDetail = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('vendor', 'businessName city approvalStatus phone email')
    .populate('category', 'name');

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  res.json({ success: true, data: service });
});

// @desc    Approve a service
// @route   PUT /api/admin/services/:id/approve
const approveService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  service.approvalStatus = 'approved';
  service.moderationReason = '';
  await service.save();
  res.json({ success: true, data: service });
});

// @desc    Reject a service with a reason (hides it from the customer catalog)
// @route   PUT /api/admin/services/:id/reject
const rejectService = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('A rejection reason is required');
  }
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  service.approvalStatus = 'rejected';
  service.moderationReason = reason;
  await service.save();
  res.json({ success: true, data: service });
});

// @desc    Toggle whether a service is featured on the homepage
// @route   PUT /api/admin/services/:id/toggle-featured
const toggleServiceFeatured = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  service.isFeatured = !service.isFeatured;
  await service.save();
  res.json({ success: true, data: service });
});

// @desc    Admin override to activate/deactivate a service regardless of vendor
// @route   PUT /api/admin/services/:id/toggle-active
const toggleServiceActive = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  service.isActive = !service.isActive;
  await service.save();
  res.json({ success: true, data: service });
});

module.exports = {
  getAllServices,
  getServiceDetail,
  approveService,
  rejectService,
  toggleServiceFeatured,
  toggleServiceActive,
};
