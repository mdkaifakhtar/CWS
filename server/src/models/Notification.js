const mongoose = require('mongoose');

/**
 * A generic, reusable notification. `recipient` targets a specific user
 * (e.g. a vendor's own User doc). `recipientRole` targets every user of a
 * role at once (used for admin notifications, since "all admins" should see
 * a new vendor application, not one specific admin).
 *
 * Exactly one of `recipient` / `recipientRole` should be set.
 */
const NOTIFICATION_TYPES = [
  'vendor_application_submitted',
  'vendor_resubmitted',
  'vendor_approved',
  'vendor_rejected',
  'vendor_suspended',
  'vendor_restored',
  'booking_created',
  'booking_accepted',
  'booking_rejected',
  'booking_scheduled',
  'booking_started',
  'booking_completed',
  'booking_cancelled',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    recipientRole: { type: String, enum: ['user', 'vendor', 'admin'], index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // frontend route to deep-link to, e.g. /admin/vendors/:id
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.statics.TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model('Notification', notificationSchema);
