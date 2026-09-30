import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarClock, Clock3, CheckCircle2, XCircle, IndianRupee, Wallet } from 'lucide-react';
import { fetchDailySummary } from '../../features/admin/adminSlice';
import { PageHeader, StatCard } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/FormField';
import { TableSkeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/StateViews';

const AdminDailySummary = () => {
  const dispatch = useDispatch();
  const { dailySummary } = useSelector((state) => state.admin);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    dispatch(fetchDailySummary(date));
  }, [dispatch, date]);

  return (
    <div>
      <PageHeader
        title="Daily operations"
        description="How much business came through the platform on a given day."
        actions={
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        }
      />

      {!dailySummary ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total bookings" value={dailySummary.totalBookings} icon={CalendarClock} tone="aqua" />
            <StatCard label="Pending" value={dailySummary.pending} icon={Clock3} tone="amber" />
            <StatCard label="Confirmed" value={dailySummary.confirmed} icon={CheckCircle2} tone="aqua" />
            <StatCard label="In progress" value={dailySummary.inProgress} icon={Clock3} tone="aqua" />
            <StatCard label="Completed" value={dailySummary.completed} icon={CheckCircle2} tone="green" />
            <StatCard label="Cancelled / Rejected" value={dailySummary.cancelled} icon={XCircle} tone="red" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StatCard label="Gross booking value (completed)" value={`₹${dailySummary.grossBookingValue}`} icon={IndianRupee} tone="volt" />
            <StatCard label="Platform commission" value={`₹${dailySummary.platformCommission}`} icon={Wallet} tone="aqua" />
            <StatCard label="Vendor payable" value={`₹${dailySummary.vendorPayable}`} icon={Wallet} tone="green" />
          </div>

          <h2 className="font-display font-semibold text-lg text-white mb-4">Vendor breakdown (completed bookings)</h2>
          {dailySummary.vendorBreakdown.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No completed bookings for this date" description="Try a different date." />
          ) : (
            <div className="space-y-2">
              {dailySummary.vendorBreakdown.map((v) => (
                <div key={v.businessName} className="flex items-center justify-between bg-ink-card border border-white/10 rounded-xl2 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{v.businessName}</p>
                    <p className="text-xs text-slate-400">{v.bookings} booking{v.bookings !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-display font-bold text-white">₹{v.grossBookingValue}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDailySummary;
