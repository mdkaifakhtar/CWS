/**
 * Computes the platform-commission breakdown for a booking amount at a given
 * commission rate. The rate is always the platform's *current* setting at
 * the moment this is called — callers must snapshot the result onto the
 * booking/settlement record rather than recomputing later, so historical
 * records don't silently change if the commission % is edited afterward.
 */
const computeCommissionBreakdown = (bookingAmount, commissionRate) => {
  const commissionAmount = Math.round((bookingAmount * commissionRate) / 100);
  const vendorPayableAmount = bookingAmount - commissionAmount;
  return { commissionRate, commissionAmount, vendorPayableAmount };
};

module.exports = { computeCommissionBreakdown };
