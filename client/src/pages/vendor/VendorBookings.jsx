import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { fetchVendorBookings } from '../../features/vendor/vendorSlice';
import { PageHeader } from '../../components/ui/Card';
import { BookingStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/StateViews';
import { TableSkeleton } from '../../components/ui/Loading';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Rejected', value: 'Rejected' },
];

const VendorBookings = () => {
  const dispatch = useDispatch();
  const { bookings, status } = useSelector((state) => state.vendor);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    dispatch(fetchVendorBookings({ status: filter || undefined }));
  }, [dispatch, filter]);

  return (
    <div>
      <PageHeader title="Bookings" description="Manage incoming requests and update job status as work progresses." />

      <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`focus-ring flex-shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
              filter === f.value ? 'bg-ink border-ink text-white' : 'border-white/10 text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {status === 'loading' ? (
        <TableSkeleton rows={5} />
      ) : bookings.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No bookings found" description="Try a different filter." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link
              key={b._id}
              to={`/vendor/bookings/${b._id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-ink-card border border-white/10 rounded-xl2 p-4 hover:border-aqua-200 transition-colors"
            >
              <div>
                <p className="font-mono text-xs text-slate-400 mb-1">{b.bookingCode}</p>
                <p className="text-sm font-semibold text-white">{b.service?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {b.user?.name} · {new Date(b.scheduledDate).toLocaleDateString()} · {b.scheduledTimeSlot}
                </p>
              </div>
              <BookingStatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorBookings;
