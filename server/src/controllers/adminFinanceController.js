const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');

const dayBounds = (dateStr) => {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(`${dateStr}T23:59:59.999`);
  return { start, end };
};

// @desc    Daily operations summary for a given date (defaults to today).
//          Counts are by scheduledDate (when the shop visit happens);
//          financial totals only include Completed bookings for that date,
//          since commission/payable are only meaningful once a booking is
//          actually completed.
// @route   GET /api/admin/finance/daily-summary?date=YYYY-MM-DD
const getDailySummary = asyncHandler(async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
  const { start, end } = dayBounds(dateStr);
  const scheduledFilter = { scheduledDate: { $gte: start, $lte: end } };

  const [statusCounts, financials, vendorBreakdown] = await Promise.all([
    Booking.aggregate([
      { $match: scheduledFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { ...scheduledFilter, status: 'Completed' } },
      {
        $group: {
          _id: null,
          grossBookingValue: { $sum: '$priceQuoted' },
          platformCommission: { $sum: '$commissionAmount' },
          vendorPayable: { $sum: '$vendorPayableAmount' },
          completedCount: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { ...scheduledFilter, status: 'Completed' } },
      {
        $group: {
          _id: '$vendor',
          bookings: { $sum: 1 },
          grossBookingValue: { $sum: '$priceQuoted' },
        },
      },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: '$vendor' },
      { $project: { businessName: '$vendor.businessName', bookings: 1, grossBookingValue: 1 } },
      { $sort: { grossBookingValue: -1 } },
    ]),
  ]);

  const countMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
  const totalBookings = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const fin = financials[0] || { grossBookingValue: 0, platformCommission: 0, vendorPayable: 0, completedCount: 0 };

  res.json({
    success: true,
    data: {
      date: dateStr,
      totalBookings,
      pending: countMap.Pending || 0,
      confirmed: countMap.Confirmed || 0,
      inProgress: countMap['In Progress'] || 0,
      completed: countMap.Completed || 0,
      cancelled: (countMap.Cancelled || 0) + (countMap.Rejected || 0),
      grossBookingValue: fin.grossBookingValue,
      platformCommission: fin.platformCommission,
      vendorPayable: fin.vendorPayable,
      vendorBreakdown,
    },
  });
});

// @desc    Complete booking ledger with filters
// @route   GET /api/admin/finance/ledger
// query: dateFrom, dateTo, vendor, status, q, page, limit
const getBookingLedger = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, vendor, status, q, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (dateFrom || dateTo) {
    filter.scheduledDate = {};
    if (dateFrom) filter.scheduledDate.$gte = new Date(`${dateFrom}T00:00:00`);
    if (dateTo) filter.scheduledDate.$lte = new Date(`${dateTo}T23:59:59.999`);
  }
  if (vendor) filter.vendor = vendor;
  if (status) filter.status = status;
  if (q) filter.bookingCode = new RegExp(q, 'i');

  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(100, Number(limit));

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name phone')
      .populate('vendor', 'businessName')
      .populate('service', 'name')
      .populate('vehicle', 'registrationNumber make model')
      .sort({ scheduledDate: -1, createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Booking.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: bookings,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Vendor performance — bookings/revenue over multiple windows, sortable
// @route   GET /api/admin/finance/vendor-performance
// query: sortBy = bookings | revenue | pendingCollection
const getVendorPerformance = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const vendors = await Vendor.find().select('businessName city approvalStatus');

  const results = await Promise.all(
    vendors.map(async (v) => {
      const [total, today, week, month, completed, cancelled, pending, revenueAgg, collectedAgg] = await Promise.all([
        Booking.countDocuments({ vendor: v._id }),
        Booking.countDocuments({ vendor: v._id, scheduledDate: { $gte: startOfToday } }),
        Booking.countDocuments({ vendor: v._id, scheduledDate: { $gte: startOfWeek } }),
        Booking.countDocuments({ vendor: v._id, scheduledDate: { $gte: startOfMonth } }),
        Booking.countDocuments({ vendor: v._id, status: 'Completed' }),
        Booking.countDocuments({ vendor: v._id, status: { $in: ['Cancelled', 'Rejected'] } }),
        Booking.countDocuments({ vendor: v._id, status: { $in: ['Pending', 'Confirmed', 'In Progress'] } }),
        Booking.aggregate([
          { $match: { vendor: v._id, status: 'Completed' } },
          { $group: { _id: null, gross: { $sum: '$priceQuoted' }, commission: { $sum: '$commissionAmount' }, payable: { $sum: '$vendorPayableAmount' } } },
        ]),
        mongoose.model('CollectionEntry').aggregate([
          { $match: { vendor: v._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      const revenue = revenueAgg[0] || { gross: 0, commission: 0, payable: 0 };
      const collected = collectedAgg[0]?.total || 0;

      return {
        vendor: { _id: v._id, businessName: v.businessName, city: v.city, approvalStatus: v.approvalStatus },
        totalBookings: total,
        todayBookings: today,
        weekBookings: week,
        monthBookings: month,
        completedBookings: completed,
        cancelledBookings: cancelled,
        pendingBookings: pending,
        grossBookingValue: revenue.gross,
        platformCommission: revenue.commission,
        vendorPayable: revenue.payable,
        collected,
        pendingCollection: revenue.payable - collected,
      };
    })
  );

  const sortBy = req.query.sortBy || 'bookings';
  const sortMap = {
    bookings: (a, b) => b.totalBookings - a.totalBookings,
    revenue: (a, b) => b.grossBookingValue - a.grossBookingValue,
    pendingCollection: (a, b) => b.pendingCollection - a.pendingCollection,
  };
  results.sort(sortMap[sortBy] || sortMap.bookings);

  res.json({ success: true, data: results });
});

module.exports = { getDailySummary, getBookingLedger, getVendorPerformance };
