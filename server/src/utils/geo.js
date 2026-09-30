const { DAY_NAMES } = require('./slotGenerator');

/**
 * Great-circle distance between two lat/lng points, in kilometers.
 */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Whether a vendor is currently within their configured working hours/days.
 * Used for a lightweight "open now" / "closed" indicator on listings —
 * distinct from actual slot booking availability (which also checks lead
 * time and existing bookings).
 */
const isVendorOpenNow = (vendor, now = new Date()) => {
  const dayName = DAY_NAMES[now.getDay()];
  const workingDays = vendor.workingDays && vendor.workingDays.length > 0 ? vendor.workingDays : DAY_NAMES;
  if (!workingDays.includes(dayName)) return false;

  const [startH, startM = 0] = (vendor.workingHours?.start || '08:00').split(':').map(Number);
  const [endH, endM = 0] = (vendor.workingHours?.end || '18:00').split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  return minutesNow >= startH * 60 + startM && minutesNow <= endH * 60 + endM;
};

module.exports = { haversineKm, isVendorOpenNow };
