import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { fetchMyBookings } from '../../features/booking/bookingSlice';
import { StatusBadge } from '../../components/BookingStatusTracker';
import { EmptyState } from '../../components/StateViews';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const MyBookings = () => {
  const dispatch = useDispatch();
  const { myBookings } = useSelector((state) => state.booking);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    dispatch(fetchMyBookings({ status: filter || undefined }));
  }, [dispatch, filter]);

  return (
    <div>
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

      {myBookings.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No bookings found" description="Try a different filter, or book a new service." />
      ) : (
        <div className="space-y-3">
          {myBookings.map((b) => (
            <Link
              key={b._id}
              to={`/dashboard/bookings/${b._id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-ink-card border border-white/10 rounded-xl2 p-4 hover:border-aqua-200 transition-colors"
            >
              <div>
                <p className="font-mono text-xs text-slate-400 mb-1">{b.bookingCode}</p>
                <p className="text-sm font-semibold text-white">{b.service?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {b.vendor?.businessName} · {new Date(b.scheduledDate).toLocaleDateString()} · {b.scheduledTimeSlot}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
