const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Minimum lead time between "now" and the earliest bookable slot. Prevents
// customers from booking a slot that's only minutes away, which no vendor
// could realistically prepare for.
const MIN_LEAD_TIME_HOURS = 2;

const SLOT_DEFS = [
  { start: 8, end: 9, label: '08:00 AM - 09:00 AM' },
  { start: 9, end: 10, label: '09:00 AM - 10:00 AM' },
  { start: 10, end: 11, label: '10:00 AM - 11:00 AM' },
  { start: 11, end: 12, label: '11:00 AM - 12:00 PM' },
  { start: 14, end: 15, label: '02:00 PM - 03:00 PM' },
  { start: 15, end: 16, label: '03:00 PM - 04:00 PM' },
  { start: 16, end: 17, label: '04:00 PM - 05:00 PM' },
  { start: 17, end: 18, label: '05:00 PM - 06:00 PM' },
];

const parseHour = (hhmm) => {
  if (!hhmm) return null;
  const [h] = hhmm.split(':').map(Number);
  return h;
};

const isSameCalendarDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Computes which of the fixed slot windows are actually bookable for a vendor
 * on a given date, taking into account:
 *  - the vendor's configured working days (empty array = every day, for
 *    backward compatibility with vendors that never set this)
 *  - the vendor's configured working hours (falls back to 08:00–18:00 covering
 *    the full slot range if unset)
 *  - the vendor's marked unavailable dates
 *  - slots already taken by other active bookings for that vendor on that date
 *  - a minimum lead time (MIN_LEAD_TIME_HOURS) from the current moment —
 *    applies naturally to "today" and has no effect on future dates, since
 *    those are already well beyond the lead time
 *
 * Returns { isWorkingDay, isUnavailableDate, slots: [{ label, available }] }
 */
const computeAvailableSlots = ({ vendor, dateStr, bookedSlotLabels = [], now = new Date() }) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayName = DAY_NAMES[date.getDay()];

  const effectiveWorkingDays = vendor.workingDays && vendor.workingDays.length > 0 ? vendor.workingDays : DAY_NAMES;
  const isWorkingDay = effectiveWorkingDays.includes(dayName);

  const isUnavailableDate = (vendor.unavailableDates || []).some((d) => isSameCalendarDay(new Date(d), date));

  const startHour = parseHour(vendor.workingHours?.start) ?? 8;
  const endHour = parseHour(vendor.workingHours?.end) ?? 18;

  const earliestBookableMoment = new Date(now.getTime() + MIN_LEAD_TIME_HOURS * 60 * 60 * 1000);

  const slots = SLOT_DEFS.filter((s) => s.start >= startHour && s.end <= endHour).map((s) => {
    const alreadyBooked = bookedSlotLabels.includes(s.label);
    const slotStartMoment = new Date(date);
    slotStartMoment.setHours(s.start, 0, 0, 0);
    const withinLeadTime = slotStartMoment < earliestBookableMoment;
    return {
      label: s.label,
      available: !alreadyBooked && !withinLeadTime,
    };
  });

  return {
    isWorkingDay,
    isUnavailableDate,
    slots: isWorkingDay && !isUnavailableDate ? slots : [],
  };
};

module.exports = { computeAvailableSlots, DAY_NAMES, MIN_LEAD_TIME_HOURS };
