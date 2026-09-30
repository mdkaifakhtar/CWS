const Notification = require('../models/Notification');

/**
 * Notify a single specific user (e.g. a vendor about their own application).
 */
const notifyUser = async ({ recipient, type, title, message = '', link = '' }) => {
  return Notification.create({ recipient, type, title, message, link });
};

/**
 * Notify every user of a role at once (e.g. all admins about a new vendor
 * application). Stored as a single role-targeted notification rather than
 * fanning out to every admin User document — simpler and scales fine for
 * an admin team, while `GET /api/notifications` resolves it per-viewer.
 */
const notifyRole = async ({ recipientRole, type, title, message = '', link = '' }) => {
  return Notification.create({ recipientRole, type, title, message, link });
};

module.exports = { notifyUser, notifyRole };
