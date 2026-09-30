import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, Phone, Check, X } from 'lucide-react';
import { fetchVendorBookingDetail, updateVendorBookingStatus } from '../../features/vendor/vendorSlice';
import { Card } from '../../components/ui/Card';
import { BookingStatusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import BookingStatusTracker from '../../components/BookingStatusTracker';

// Defines what the vendor can do from each status — mirrors the backend's
// ALLOWED_TRANSITIONS map so the UI never offers an action the API will reject.
const ACTIONS_BY_STATUS = {
  Pending: [
    { label: 'Confirm booking', next: 'Confirmed', variant: 'primary', icon: Check },
    { label: 'Reject', next: 'Rejected', variant: 'danger', icon: X, requireReason: true },
  ],
  Confirmed: [{ label: 'Start service', next: 'In Progress', variant: 'primary' }],
  'In Progress': [{ label: 'Mark completed', next: 'Completed', variant: 'primary', icon: Check }],
};

const VendorBookingDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { activeBooking, bookingStatusHistory } = useSelector((state) => state.vendor);
  const [pendingAction, setPendingAction] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVendorBookingDetail(id));
  }, [dispatch, id]);

  if (!activeBooking) {
    return <div className="text-center text-slate-400 py-16">Loading booking…</div>;
  }

  const b = activeBooking;
  const availableActions = ACTIONS_BY_STATUS[b.status] || [];

  const handleAction = async () => {
    setSubmitting(true);
    const result = await dispatch(updateVendorBookingStatus({ id, status: pendingAction.next, reason }));
    setSubmitting(false);
    if (updateVendorBookingStatus.fulfilled.match(result)) {
      toast.success(`Booking updated to "${pendingAction.next}"`);
      setPendingAction(null);
      setReason('');
    } else {
      toast.error(result.payload || 'Could not update booking');
    }
  };

  return (
    <div>
      <Link to="/vendor/bookings" className="focus-ring flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-slate-400">{b.bookingCode}</p>
            <h1 className="font-display font-bold text-xl text-white mt-1">{b.service?.name}</h1>
          </div>
          <BookingStatusBadge status={b.status} />
        </div>

        <BookingStatusTracker status={b.status} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-white/10">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Customer</h3>
            <p className="text-sm font-medium text-white">{b.user?.name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <Phone size={12} /> {b.user?.phone}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vehicle</h3>
            <p className="text-sm text-white">
              {b.vehicle?.nickname || `${b.vehicle?.make || ''} ${b.vehicle?.model || ''}`.trim() || b.vehicleType?.name}
              {b.vehicle?.registrationNumber ? ` · ${b.vehicle.registrationNumber}` : ''}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Scheduled</h3>
            <p className="text-sm text-white">
              {new Date(b.scheduledDate).toLocaleDateString()} · {b.scheduledTimeSlot}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Amount & Payment</h3>
            <p className="text-sm font-bold text-white">
              ₹{b.priceQuoted}{' '}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-1 ${b.paymentStatus === 'collected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {b.paymentStatus === 'collected' ? 'Cash Collected' : 'Payment Unpaid'}
              </span>
            </p>
            {b.status === 'Completed' && (
              <p className="text-xs text-slate-400 mt-1">
                (₹{b.commissionAmount} commission · ₹{b.vendorPayableAmount} payable to you)
              </p>
            )}
          </div>
          {b.specialInstructions && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Instructions</h3>
              <p className="text-sm text-white">{b.specialInstructions}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <Button
                key={action.next}
                variant={action.variant}
                icon={action.icon}
                onClick={() => setPendingAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>

          {b.status === 'Completed' && b.paymentStatus !== 'collected' && (
            <Button
              variant="primary"
              size="sm"
              icon={Check}
              onClick={async () => {
                try {
                  const { data } = await axiosClient.put(`/vendor/bookings/${id}/collect-payment`);
                  toast.success('Cash payment recorded as collected!');
                  dispatch(fetchVendorBookingDetail(id));
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Could not record collection');
                }
              }}
            >
              Mark Cash Payment Collected
            </Button>
          )}
        </div>
      </Card>

      {bookingStatusHistory?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Status history</h3>
          <div className="space-y-2">
            {bookingStatusHistory.map((log) => (
              <div key={log._id} className="flex items-center justify-between text-xs text-slate-400 bg-ink-card border border-white/10 rounded-lg px-3.5 py-2.5">
                <span className="font-medium text-white">{log.status}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        onClose={() => { setPendingAction(null); setReason(''); }}
        onConfirm={handleAction}
        loading={submitting}
        variant={pendingAction?.variant === 'danger' ? 'danger' : 'dark'}
        title={pendingAction?.label}
        description={
          pendingAction?.requireReason
            ? 'Please provide a reason for the customer.'
            : `Move this booking to "${pendingAction?.next}"?`
        }
        confirmLabel={pendingAction?.label}
        requireReason={!!pendingAction?.requireReason}
        reason={reason}
        onReasonChange={setReason}
      />
    </div>
  );
};

export default VendorBookingDetail;
