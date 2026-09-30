import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Users, Store, Clock3, Wrench, CalendarClock, CheckCircle2 } from 'lucide-react';
import { fetchAdminDashboard } from '../../features/admin/adminSlice';
import { StatCard } from '../../components/ui/Card';
import { VendorStatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Loading';

const AdminOverview = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (!dashboard) return <TableSkeleton rows={4} />;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total customers" value={dashboard.totalUsers} icon={Users} tone="aqua" />
        <StatCard label="Total vendors" value={dashboard.totalVendors} icon={Store} tone="aqua" />
        <StatCard label="Pending approvals" value={dashboard.pendingVendorApprovals} icon={Clock3} tone="amber" />
        <StatCard label="Total services" value={dashboard.totalServices} icon={Wrench} tone="aqua" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total bookings" value={dashboard.totalBookings} icon={CalendarClock} tone="aqua" />
        <StatCard label="Completed bookings" value={dashboard.completedBookings} icon={CheckCircle2} tone="green" />
        <StatCard label="Suspended vendors" value={dashboard.suspendedVendors} icon={Store} tone="red" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-white">Recently registered vendors</h2>
        <Link to="/admin/vendors" className="text-sm font-semibold text-aqua-400 hover:text-aqua-300">
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {(dashboard.recentVendors || []).map((v) => (
          <Link
            key={v._id}
            to={`/admin/vendors/${v._id}`}
            className="flex items-center justify-between bg-ink-card border border-white/10 rounded-xl2 p-4 hover:border-aqua-200 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-white">{v.businessName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{v.city}</p>
            </div>
            <VendorStatusBadge status={v.approvalStatus} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
