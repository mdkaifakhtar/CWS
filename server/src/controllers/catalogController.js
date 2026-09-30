const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
const ServiceCategory = require('../models/ServiceCategory');
const VehicleType = require('../models/VehicleType');
const Review = require('../models/Review');
const { haversineKm, isVendorOpenNow } = require('../utils/geo');

// @desc    List all active service categories
// @route   GET /api/catalog/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
});

// @desc    List all vehicle types
// @route   GET /api/catalog/vehicle-types
const getVehicleTypes = asyncHandler(async (req, res) => {
  const vehicleTypes = await VehicleType.find().sort({ sortOrder: 1 });
  res.json({ success: true, data: vehicleTypes });
});

// @desc    Search / list services with filters (city, category, price, rating, distance)
// @route   GET /api/catalog/services
// query params: city, category, minPrice, maxPrice, minRating, q, sort, lat, lng, page, limit
const searchServices = asyncHandler(async (req, res) => {
  const { city, category, minPrice, maxPrice, minRating, q, sort, lat, lng, page = 1, limit = 12 } = req.query;

  const filter = { isActive: true, approvalStatus: 'approved' };

  if (category) filter.category = category;
  if (minRating) filter.ratingAverage = { $gte: Number(minRating) };
  if (minPrice || maxPrice) {
    filter.basePrice = {};
    if (minPrice) filter.basePrice.$gte = Number(minPrice);
    if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
  }
  if (q) filter.$text = { $search: q };

  let vendorFilter = { approvalStatus: 'approved', isActive: true };
  if (city) vendorFilter.city = new RegExp(`^${city}$`, 'i');

  const vendorIds = await Vendor.find(vendorFilter).distinct('_id');
  filter.vendor = { $in: vendorIds };

  const sortMap = {
    priceLowToHigh: { basePrice: 1 },
    priceHighToLow: { basePrice: -1 },
    rating: { ratingAverage: -1 },
    newest: { createdAt: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const useDistanceSort = sort === 'distance' && lat && lng;
  const userLat = Number(lat);
  const userLng = Number(lng);

  // Distance sorting needs every matching service's vendor coordinates before
  // it can rank them, so we can't page in the DB query in that case — fetch
  // all matches, sort in memory, then paginate. Fine at this data scale.
  let services;
  let total;

  if (useDistanceSort) {
    const all = await Service.find(filter)
      .populate('vendor', 'businessName city ratingAverage coverImageUrl location workingDays workingHours')
      .populate('category', 'name slug');

    const withDistance = all.map((s) => {
      const obj = s.toObject();
      if (s.vendor?.location?.latitude != null && s.vendor?.location?.longitude != null) {
        obj.distanceKm = Number(
          haversineKm(userLat, userLng, s.vendor.location.latitude, s.vendor.location.longitude).toFixed(1)
        );
      } else {
        obj.distanceKm = null;
      }
      obj.vendor.isOpenNow = isVendorOpenNow(s.vendor);
      return obj;
    });

    withDistance.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    total = withDistance.length;
    services = withDistance.slice((pageNum - 1) * pageSize, pageNum * pageSize);
  } else {
    [services, total] = await Promise.all([
      Service.find(filter)
        .populate('vendor', 'businessName city ratingAverage coverImageUrl workingDays workingHours')
        .populate('category', 'name slug')
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      Service.countDocuments(filter),
    ]);
    services = services.map((s) => {
      const obj = s.toObject();
      obj.vendor.isOpenNow = isVendorOpenNow(s.vendor);
      return obj;
    });
  }

  res.json({
    success: true,
    data: services,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Get single service detail
// @route   GET /api/catalog/services/:id
const getServiceDetail = asyncHandler(async (req, res) => {
  const service = await Service.findOne({
    _id: req.params.id,
    isActive: true,
    approvalStatus: 'approved',
  })
    .populate('vendor')
    .populate('category', 'name slug')
    .populate('vehiclePricing.vehicleType', 'name');

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  const reviews = await Review.find({ service: service._id, isHidden: false })
    .populate('user', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: { service, reviews } });
});

// @desc    Get vendor public profile + their active services
// @route   GET /api/catalog/vendors/:id
const getVendorDetail = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({
    _id: req.params.id,
    approvalStatus: 'approved',
    isActive: true,
  });

  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  const services = await Service.find({
    vendor: vendor._id,
    isActive: true,
    approvalStatus: 'approved',
  }).populate('category', 'name slug');

  const reviews = await Review.find({ vendor: vendor._id, isHidden: false })
    .populate('user', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: { vendor, services, reviews } });
});

// @desc    Featured vendors + popular services for homepage
// @route   GET /api/catalog/home
const getHomeFeed = asyncHandler(async (req, res) => {
  const [featuredVendors, popularServices, categories] = await Promise.all([
    Vendor.find({ approvalStatus: 'approved', isActive: true })
      .sort({ ratingAverage: -1 })
      .limit(6),
    Service.find({ isActive: true, approvalStatus: 'approved' })
      .populate('vendor', 'businessName city')
      .populate('category', 'name slug')
      .sort({ bookingCount: -1 })
      .limit(8),
    ServiceCategory.find({ isActive: true }).sort({ sortOrder: 1 }).limit(12),
  ]);

  res.json({ success: true, data: { featuredVendors, popularServices, categories } });
});

// @desc    Get nearby car wash vendors (filtered by location/distance and optionally by service)
// @route   GET /api/catalog/nearby-vendors
const getNearbyVendors = asyncHandler(async (req, res) => {
  const { lat, lng, serviceId, city, q, page = 1, limit = 20 } = req.query;

  const vendorFilter = { approvalStatus: 'approved', isActive: true };

  if (city) {
    vendorFilter.city = new RegExp(`^${city}$`, 'i');
  }

  if (q) {
    vendorFilter.$or = [
      { businessName: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { businessAddress: new RegExp(q, 'i') },
    ];
  }

  // If a service ID filter is specified, only include vendors that offer it
  if (serviceId) {
    const serviceVendorIds = await Service.find({
      _id: serviceId,
      isActive: true,
      approvalStatus: 'approved',
    }).distinct('vendor');
    vendorFilter._id = { $in: serviceVendorIds };
  }

  const vendors = await Vendor.find(vendorFilter);

  // Fetch active service count and starting prices for each vendor
  const vendorIds = vendors.map((v) => v._id);
  const servicesGrouped = await Service.aggregate([
    { $match: { vendor: { $in: vendorIds }, isActive: true, approvalStatus: 'approved' } },
    {
      $group: {
        _id: '$vendor',
        count: { $sum: 1 },
        minPrice: { $min: '$basePrice' },
        servicesList: { $push: { _id: '$_id', name: '$name', basePrice: '$basePrice', durationMinutes: '$durationMinutes' } },
      },
    },
  ]);

  const serviceMap = {};
  servicesGrouped.forEach((g) => {
    serviceMap[g._id.toString()] = g;
  });

  const hasCoords = lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng));
  const userLat = Number(lat);
  const userLng = Number(lng);

  let results = vendors.map((v) => {
    const obj = v.toObject();
    const vLat = v.location?.latitude;
    const vLng = v.location?.longitude;

    if (hasCoords && vLat != null && vLng != null) {
      obj.distanceKm = Number(haversineKm(userLat, userLng, vLat, vLng).toFixed(1));
    } else {
      obj.distanceKm = null;
    }

    obj.isOpenNow = isVendorOpenNow(v);
    const sInfo = serviceMap[v._id.toString()] || { count: 0, minPrice: 0, servicesList: [] };
    obj.servicesCount = sInfo.count;
    obj.startingPrice = sInfo.minPrice || 0;
    obj.services = sInfo.servicesList;

    return obj;
  });

  // Sort: closest distance first if lat/lng available, otherwise by rating
  if (hasCoords) {
    results.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else {
    results.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
  }

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));
  const paginated = results.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      total: results.length,
      page: pageNum,
      pages: Math.ceil(results.length / pageSize) || 1,
    },
  });
});

module.exports = {
  getCategories,
  getVehicleTypes,
  searchServices,
  getServiceDetail,
  getVendorDetail,
  getNearbyVendors,
  getHomeFeed,
};

