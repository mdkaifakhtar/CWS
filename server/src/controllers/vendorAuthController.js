const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const generateToken = require('../utils/generateToken');
const { isValidEmail, isValidPhone } = require('../utils/validators');
const { notifyRole } = require('../utils/notify');

// @desc    Register a new vendor account + business profile in one step (KYC intake)
// @route   POST /api/vendor/register
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  const {
    // owner details
    ownerName,
    ownerPhone,
    ownerEmail,
    ownerAddress,
    // account credentials
    email,
    phone,
    password,
    // business details
    businessName,
    businessRegistrationNumber,
    businessAddress,
    city,
    state,
    pincode,
    latitude,
    longitude,
    serviceAreas,
  } = req.body;

  const required = { ownerName, email, phone, password, businessName, businessAddress, city };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Missing required field(s): ${missing.join(', ')}`);
  }

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error('Enter a valid business email address');
  }
  if (!isValidPhone(phone)) {
    res.status(400);
    throw new Error('Enter a valid business phone number');
  }
  if (ownerPhone && !isValidPhone(ownerPhone)) {
    res.status(400);
    throw new Error('Enter a valid owner mobile number');
  }
  if (ownerEmail && !isValidEmail(ownerEmail)) {
    res.status(400);
    throw new Error('Enter a valid owner email address');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email or phone already exists');
  }

  const user = await User.create({
    name: ownerName,
    email,
    phone,
    password,
    role: 'vendor',
  });

  const vendor = await Vendor.create({
    owner: user._id,
    businessName,
    businessRegistrationNumber,
    ownerName,
    ownerPhone,
    ownerEmail,
    ownerAddress,
    phone,
    email,
    businessAddress,
    city,
    state,
    pincode,
    location:
      latitude !== undefined && longitude !== undefined
        ? { latitude: Number(latitude), longitude: Number(longitude) }
        : undefined,
    serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [],
    approvalStatus: 'pending',
  });

  user.vendorProfile = vendor._id;
  await user.save();

  // Admin notification: a new vendor application is waiting for approval.
  await notifyRole({
    recipientRole: 'admin',
    type: 'vendor_application_submitted',
    title: `New vendor application: ${vendor.businessName}`,
    message: `${vendor.ownerName} submitted an application for "${vendor.businessName}" in ${vendor.city}.`,
    link: `/admin/vendors/${vendor._id}`,
  });

  res.status(201).json({
    success: true,
    data: { user: user.toSafeObject(), vendor },
    token: generateToken(user._id),
  });
});

module.exports = { registerVendor };
