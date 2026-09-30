import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, XCircle, Wallet, Wrench, Clock3 } from 'lucide-react';
import { fetchVendorDashboard } from '../../features/vendor/vendorSlice';
import { StatCard } from '../../components/ui/Card';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/StateViews';
import { TableSkeleton } from '../../components/ui/Loading';

const VendorOverview = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((state) => state.vendor);

  useEffect(() => {
    dispatch(fetchVendorDashboard());
  }, [dispatch]);

  if (!dashboard) return <TableSkeleton rows={4} />;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total bookings" value={dashboard.totalBookings} icon={CalendarClock} tone="aqua" />
        <StatCard label="Pending requests" value={dashboard.pendingBookings} icon={Clock3} tone="amber" />
        <StatCard label="Completed" value={dashboard.completedBookings} icon={CheckCircle2} tone="green" />
        <StatCard label="Cancelled / rejected" value={dashboard.cancelledBookings} icon={XCircle} tone="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="This month's bookings" value={dashboard.monthlyBookings} icon={CalendarClock} tone="aqua" />
        <StatCard label="Total earnings (completed)" value={`₹${dashboard.totalEarnings}`} icon={Wallet} tone="volt" />
        <StatCard label="Active services" value={`${dashboard.activeServices} / ${dashboard.totalServices}`} icon={Wrench} tone="aqua" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-white">Recent bookings</h2>
        <Link to="/vendor/bookings" className="text-sm font-semibold text-aqua-400 hover:text-aqua-300">
          View all
        </Link>
      </div>

      {!dashboard.recentBookings?.length ? (
        <EmptyState icon={CalendarClock} title="No bookings yet" description="New booking requests from customers will show up here." />
      ) : (
        <div className="space-y-3">
          {dashboard.recentBookings.map((b) => (
            <Link
              key={b._id}
              to={`/vendor/bookings/${b._id}`}
              className="flex items-center justify-between bg-ink-card border border-white/10 rounded-xl2 p-4 hover:border-aqua-200 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-white">{b.service?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{b.user?.name} · {b.user?.phone}</p>
              </div>
              <BookingStatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorOverview;
