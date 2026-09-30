const asyncHandler = require('express-async-handler');
const Vendor = require('../models/Vendor');

// Attaches req.vendor = the Vendor business profile owned by req.user.
// Must run after protect + authorize('vendor').
const loadVendorProfile = asyncHandler(async (req, res, next) => {
  if (!req.user.vendorProfile) {
    res.status(400);
    throw new Error('This account has no vendor business profile linked to it');
  }

  const vendor = await Vendor.findById(req.user.vendorProfile);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor profile not found');
  }

  req.vendor = vendor;
  next();
});

// Blocks write actions (creating services, responding to bookings, etc.)
// unless the vendor has been approved by admin and is not suspended/deactivated.
// Must run after loadVendorProfile.
const requireApprovedVendor = (req, res, next) => {
  if (!req.vendor) {
    res.status(500);
    throw new Error('requireApprovedVendor used without loadVendorProfile');
  }

  if (req.vendor.approvalStatus !== 'approved' || !req.vendor.isActive) {
    res.status(403);
    throw new Error(
      `Your vendor account is currently "${req.vendor.approvalStatus}". This action requires an approved, active account.`
    );
  }
  next();
};

module.exports = { loadVendorProfile, requireApprovedVendor };
