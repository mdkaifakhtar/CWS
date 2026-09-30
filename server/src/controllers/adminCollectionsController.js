const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');
const Booking = require('../models/Booking');
const CollectionEntry = require('../models/CollectionEntry');

// @desc    Vendor-wise collection ledger: gross / commission / payable /
//          collected (sum of all recorded CollectionEntry rows) / pending.
//          "Collected" is tracked at the vendor level as a running ledger
//          balance, not allocated to individual bookings — settlements are
//          typically lump sums covering many bookings at once.
// @route   GET /api/admin/collections
const getCollectionsOverview = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find({ approvalStatus: { $ne: 'rejected' } }).select('businessName city');

  const rows = await Promise.all(
    vendors.map(async (v) => {
      const [revenueAgg, collectedAgg, completedCount] = await Promise.all([
        Booking.aggregate([
          { $match: { vendor: v._id, status: 'Completed' } },
          { $group: { _id: null, gross: { $sum: '$priceQuoted' }, commission: { $sum: '$commissionAmount' }, payable: { $sum: '$vendorPayableAmount' } } },
        ]),
        CollectionEntry.aggregate([{ $match: { vendor: v._id } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Booking.countDocuments({ vendor: v._id, status: 'Completed' }),
      ]);

      const revenue = revenueAgg[0] || { gross: 0, commission: 0, payable: 0 };
      const collected = collectedAgg[0]?.total || 0;
      const pending = revenue.payable - collected;

      return {
        vendor: { _id: v._id, businessName: v.businessName, city: v.city },
        completedBookings: completedCount,
        grossBookingValue: revenue.gross,
        platformCommission: revenue.commission,
        vendorPayable: revenue.payable,
        collected,
        pendingCollection: pending,
        status: pending <= 0 ? 'Collected' : collected > 0 ? 'Partially Collected' : 'Pending',
      };
    })
  );

  res.json({ success: true, data: rows.filter((r) => r.completedBookings > 0) });
});

// @desc    A single vendor's full collection history (every recorded entry)
// @route   GET /api/admin/collections/:vendorId
const getVendorCollectionHistory = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.vendorId).select('businessName city');
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  const [entries, revenueAgg] = await Promise.all([
    CollectionEntry.find({ vendor: vendor._id }).populate('collectedBy', 'name').sort({ collectedAt: -1 }),
    Booking.aggregate([
      { $match: { vendor: vendor._id, status: 'Completed' } },
      { $group: { _id: null, gross: { $sum: '$priceQuoted' }, commission: { $sum: '$commissionAmount' }, payable: { $sum: '$vendorPayableAmount' } } },
    ]),
  ]);

  const revenue = revenueAgg[0] || { gross: 0, commission: 0, payable: 0 };
  const collected = entries.reduce((sum, e) => sum + e.amount, 0);

  res.json({
    success: true,
    data: {
      vendor,
      grossBookingValue: revenue.gross,
      platformCommission: revenue.commission,
      vendorPayable: revenue.payable,
      collected,
      pendingCollection: revenue.payable - collected,
      entries,
    },
  });
});

// @desc    Record a collection against a vendor (audited — never overwrites,
//          always appends a new entry)
// @route   POST /api/admin/collections/:vendorId
const recordCollection = asyncHandler(async (req, res) => {
  const { amount, notes } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('A positive collection amount is required');
  }

  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  const entry = await CollectionEntry.create({
    vendor: vendor._id,
    amount,
    notes: notes || '',
    collectedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: entry });
});

module.exports = { getCollectionsOverview, getVendorCollectionHistory, recordCollection };
