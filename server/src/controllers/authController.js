const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (customer)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error('Name, email, phone and password are all required');
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email or phone already exists');
  }

  const user = await User.create({ name, email, phone, password, role: 'user' });

  res.status(201).json({
    success: true,
    data: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @desc    Login with email/phone + password
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier = email OR phone

  if (!identifier || !password) {
    res.status(400);
    throw new Error('Email/phone and password are required');
  }

  const cleanIdentifier = identifier.trim();
  const user = await User.findOne({
    $or: [{ email: cleanIdentifier.toLowerCase() }, { phone: cleanIdentifier }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact support.');
  }

  res.json({
    success: true,
    data: user.toSafeObject(),
    token: generateToken(user._id),
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject() });
});

// @desc    Update profile (name, avatar)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  if (name !== undefined) req.user.name = name;
  if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;
  await req.user.save();
  res.json({ success: true, data: req.user.toSafeObject() });
});

// @desc    Change the currently authenticated user's/admin's own password
// @route   PUT /api/auth/change-password
// @access  Private (any authenticated role — user, vendor, or admin)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    res.status(400);
    throw new Error('Current password, new password and confirmation are all required');
  }

  if (newPassword.trim().length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  if (newPassword !== confirmNewPassword) {
    res.status(400);
    throw new Error('New passwords do not match');
  }

  // req.user came from the JWT via the `protect` middleware — never trust a
  // userId supplied by the client, only ever act on the authenticated user.
  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error('New password must be different from the current password');
  }

  user.password = newPassword; // hashed by the pre-save hook
  user.passwordChangedAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again with your new password.',
  });
});

// @desc    Change the currently authenticated admin's own email
// @route   PUT /api/auth/change-email
// @access  Private (admin only)
const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail, currentPassword } = req.body;

  if (!newEmail || !currentPassword) {
    res.status(400);
    throw new Error('New email and current password are required');
  }

  const normalizedEmail = newEmail.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    res.status(400);
    throw new Error('Enter a valid email address');
  }

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  if (normalizedEmail === user.email) {
    res.status(400);
    throw new Error('This is already your current email address');
  }

  const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
  if (existing) {
    res.status(400);
    throw new Error('This email address is already in use by another account');
  }

  user.email = normalizedEmail;
  await user.save();

  // The JWT payload only carries the user id (not the email), so the
  // current session keeps working — no forced re-login is required here.
  res.json({
    success: true,
    data: user.toSafeObject(),
    message: 'Email updated. Use your new email address the next time you log in.',
  });
});

module.exports = { registerUser, loginUser, getMe, updateMe, changePassword, changeEmail };
