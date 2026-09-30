import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { fetchVendorPerformance } from '../../features/admin/adminSlice';
import { PageHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/FormField';
import { VendorStatusBadge } from '../../components/ui/Badge';
import { Table, TableSkeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/StateViews';

const SORT_OPTIONS = [
  { value: 'bookings', label: 'Highest bookings' },
  { value: 'revenue', label: 'Highest revenue' },
  { value: 'pendingCollection', label: 'Highest pending collection' },
];

const AdminVendorPerformance = () => {
  const dispatch = useDispatch();
  const { vendorPerformance } = useSelector((state) => state.admin);
  const [sortBy, setSortBy] = useState('bookings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchVendorPerformance({ sortBy })).finally(() => setLoading(false));
  }, [dispatch, sortBy]);

  return (
    <div>
      <PageHeader
        title="Vendor performance"
        description="Bookings and revenue across every vendor on the platform."
        actions={
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-auto">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : vendorPerformance.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No vendors yet" />
      ) : (
        <Table
          columns={[
            { key: 'name', label: 'Vendor', render: (r) => (
              <Link to={`/admin/vendors/${r.vendor._id}`} className="text-white font-medium hover:text-aqua-400">
                {r.vendor.businessName}
              </Link>
            ) },
            { key: 'status', label: 'Status', render: (r) => <VendorStatusBadge status={r.vendor.approvalStatus} /> },
            { key: 'total', label: 'Total', render: (r) => r.totalBookings },
            { key: 'today', label: 'Today', render: (r) => r.todayBookings },
            { key: 'month', label: 'This month', render: (r) => r.monthBookings },
            { key: 'completed', label: 'Completed', render: (r) => r.completedBookings },
            { key: 'gross', label: 'Gross', render: (r) => `₹${r.grossBookingValue}` },
            { key: 'payable', label: 'Payable', render: (r) => `₹${r.vendorPayable}` },
            { key: 'pending', label: 'Pending collection', render: (r) => <span className="text-amber-400">₹{r.pendingCollection}</span> },
          ]}
          rows={vendorPerformance.map((r) => ({ ...r, _id: r.vendor._id }))}
        />
      )}
    </div>
  );
};

export default AdminVendorPerformance;
