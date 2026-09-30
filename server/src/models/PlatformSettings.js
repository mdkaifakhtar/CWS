const mongoose = require('mongoose');

// A single-document collection — there is exactly one settings record,
// fetched/updated via a fixed key rather than an _id lookup.
const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
    minLeadTimeHours: { type: Number, default: 2, min: 0 },
  },
  { timestamps: true }
);

platformSettingsSchema.statics.getSettings = async function getSettings() {
  let settings = await this.findOne({ key: 'default' });
  if (!settings) {
    settings = await this.create({ key: 'default' });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
