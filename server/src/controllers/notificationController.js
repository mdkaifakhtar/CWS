const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// Every notification visible to this user: addressed to them directly,
// OR broadcast to their role.
const scopeFilter = (user) => ({
  $or: [{ recipient: user._id }, { recipientRole: user.role }],
});

// @desc    List notifications for the logged-in user (their own + their role's)
// @route   GET /api/notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const pageSize = Math.min(50, Number(limit));

  const filter = scopeFilter(req.user);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { total, page: pageNum, pages: Math.ceil(total / pageSize) || 1 },
  });
});

// @desc    Get just the unread count (for a nav badge, polled lightly)
// @route   GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ ...scopeFilter(req.user), isRead: false });
  res.json({ success: true, data: { count } });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, ...scopeFilter(req.user) });
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

// @desc    Mark all of the current user's notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...scopeFilter(req.user), isRead: false }, { isRead: true });
  res.json({ success: true });
});

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };
