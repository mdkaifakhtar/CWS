const asyncHandler = require('express-async-handler');
const PlatformSettings = require('../models/PlatformSettings');

// @desc    Get platform settings (commission %, lead time, etc.)
// @route   GET /api/admin/settings
const getSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings();
  res.json({ success: true, data: settings });
});

// @desc    Update platform settings
// @route   PUT /api/admin/settings
const updateSettings = asyncHandler(async (req, res) => {
  const { commissionPercent } = req.body;

  if (commissionPercent !== undefined && (commissionPercent < 0 || commissionPercent > 100)) {
    res.status(400);
    throw new Error('commissionPercent must be between 0 and 100');
  }

  const settings = await PlatformSettings.getSettings();
  if (commissionPercent !== undefined) settings.commissionPercent = commissionPercent;
  await settings.save();

  res.json({ success: true, data: settings });
});

module.exports = { getSettings, updateSettings };
