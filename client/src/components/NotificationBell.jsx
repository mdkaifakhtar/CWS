import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../features/notifications/notificationSlice';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useSelector((state) => state.notifications);
  const { token } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Belt-and-suspenders: this component only renders when Navbar sees a
    // logged-in user, but guarding here too means the poll stops the
    // instant `token` clears (e.g. after a 401 logs the session out),
    // instead of firing one more doomed request first.
    if (!token) return undefined;

    dispatch(fetchUnreadCount());
    // Lightweight polling so the badge stays fresh without a websocket layer.
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 30000);
    return () => clearInterval(interval);
  }, [dispatch, token]);

  useEffect(() => {
    if (open && token) dispatch(fetchNotifications({ limit: 10 }));
  }, [open, dispatch, token]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleClick = (n) => {
    if (!n.isRead) dispatch(markNotificationRead(n._id));
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="focus-ring relative p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-volt-500 text-ink text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-ink-card border border-white/10 rounded-2xl shadow-cardHover overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllNotificationsRead())}
                className="focus-ring flex items-center gap-1 text-xs font-medium text-aqua-400 hover:text-aqua-300"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8 px-4">You're all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${
                    !n.isRead ? 'bg-volt-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-volt-500 mt-1.5 flex-shrink-0" />}
                    <div className={n.isRead ? 'ml-3.5' : ''}>
                      <p className="text-sm font-medium text-white leading-snug">{n.title}</p>
                      {n.message && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{n.message}</p>}
                      <p className="text-[11px] text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
