import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, XCircle, Star } from 'lucide-react';
import { fetchDashboardSummary } from '../../features/booking/userSlice';
import { StatusBadge } from '../../components/BookingStatusTracker';
import { EmptyState } from '../../components/StateViews';
import { StatCard } from '../../components/ui/Card';

const METRIC_CARDS = [
  { key: 'totalBookings', label: 'Total bookings', icon: CalendarClock, tone: 'aqua' },
  { key: 'completedBookings', label: 'Completed', icon: CheckCircle2, tone: 'green' },
  { key: 'cancelledBookings', label: 'Cancelled', icon: XCircle, tone: 'red' },
  { key: 'reviewsGiven', label: 'Reviews given', icon: Star, tone: 'amber' },
];

const DashboardOverview = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  return (
    <div>
      <p className="text-slate-400 mb-6">Welcome back, {user?.name?.split(' ')[0]}.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {METRIC_CARDS.map(({ key, label, icon, tone }) => (
          <StatCard key={key} label={label} value={dashboard?.[key] ?? '—'} icon={icon} tone={tone} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-white">Recent bookings</h2>
        <Link to="/dashboard/bookings" className="text-sm font-semibold text-aqua-400 hover:text-aqua-300">
          View all
        </Link>
      </div>

      {!dashboard?.recentBookings?.length ? (
        <EmptyState
          icon={CalendarClock}
          title="No bookings yet"
          description="Once you book a service it'll show up here."
          action={
            <Link to="/services" className="focus-ring bg-volt-500 text-ink text-sm font-semibold px-5 py-2.5 rounded-full">
              Browse services
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {dashboard.recentBookings.map((b) => (
            <Link
              key={b._id}
              to={`/dashboard/bookings/${b._id}`}
              className="flex items-center justify-between bg-ink-card border border-white/10 rounded-xl2 p-4 hover:border-aqua-500/40 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-white">{b.service?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{b.vendor?.businessName} · {b.vendor?.city}</p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
