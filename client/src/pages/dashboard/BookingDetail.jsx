import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { MapPin, Phone, ArrowLeft, Star } from 'lucide-react';
import { fetchBookingDetail, cancelBooking } from '../../features/booking/bookingSlice';
import { submitReview } from '../../features/booking/userSlice';
import BookingStatusTracker, { StatusBadge } from '../../components/BookingStatusTracker';

const NON_CANCELLABLE = ['In Progress', 'Completed', 'Cancelled', 'Rejected'];

const BookingDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { activeBooking, statusHistory } = useSelector((state) => state.booking);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    dispatch(fetchBookingDetail(id));
  }, [dispatch, id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    setCancelling(true);
    const result = await dispatch(cancelBooking({ id, reason: 'Cancelled by customer' }));
    setCancelling(false);
    if (cancelBooking.fulfilled.match(result)) {
      toast.success('Booking cancelled');
    } else {
      toast.error(result.payload || 'Could not cancel booking');
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      toast.error('Please select a star rating');
      return;
    }
    const result = await dispatch(submitReview({ bookingId: id, rating, comment }));
    if (submitReview.fulfilled.match(result)) {
      toast.success('Thanks for your feedback!');
      setReviewed(true);
    } else {
      toast.error(result.payload || 'Could not submit review');
    }
  };

  if (!activeBooking) {
    return <div className="text-center text-slate-400 py-16">Loading booking…</div>;
  }

  const b = activeBooking;

  return (
    <div>
      <Link to="/dashboard/bookings" className="focus-ring flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      <div className="bg-ink-card border border-white/10 shadow-card rounded-xl2 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-slate-400">{b.bookingCode}</p>
            <h1 className="font-display font-bold text-xl text-white mt-1">{b.service?.name}</h1>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <BookingStatusTracker status={b.status} />

        {(b.status === 'Pending' || b.status === 'Confirmed') && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3.5 py-2.5 mt-6">
            {b.status === 'Pending'
              ? 'Waiting for the shop to confirm your booking.'
              : "Your booking is confirmed — please bring your vehicle to the shop at your booked time."}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Shop</h3>
            <p className="text-sm font-medium text-white">{b.vendor?.businessName}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <Phone size={12} /> {b.vendor?.phone}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Shop location</h3>
            <p className="text-sm text-white flex items-start gap-1.5">
              <MapPin size={13} className="mt-0.5 flex-shrink-0" />
              {b.vendor?.businessAddress}, {b.vendor?.city}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Scheduled</h3>
            <p className="text-sm text-white">
              {new Date(b.scheduledDate).toLocaleDateString()} · {b.scheduledTimeSlot}
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
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Amount</h3>
            <p className="text-sm text-white">₹{b.priceQuoted} · Pay at the shop</p>
          </div>
          {b.specialInstructions && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm text-white">{b.specialInstructions}</p>
            </div>
          )}
        </div>

        {!NON_CANCELLABLE.includes(b.status) && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="focus-ring mt-6 text-sm font-semibold text-red-400 hover:text-red-400 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {cancelling ? 'Cancelling…' : 'Cancel booking'}
          </button>
        )}
      </div>

      {b.status === 'Completed' && !reviewed && (
        <div className="bg-ink-card border border-white/10 rounded-xl2 p-6">
          <h3 className="font-display font-semibold text-white mb-3">Rate this service</h3>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setRating(i)} className="focus-ring">
                <Star
                  size={26}
                  fill={i <= rating ? '#F4A100' : 'none'}
                  className={i <= rating ? 'text-amber-500' : 'text-slate-300'}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Tell others about your experience (optional)"
            className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 mb-4"
          />
          <button
            onClick={handleSubmitReview}
            className="focus-ring bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
          >
            Submit review
          </button>
        </div>
      )}

      {statusHistory?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Status history</h3>
          <div className="space-y-2">
            {statusHistory.map((log) => (
              <div key={log._id} className="flex items-center justify-between text-xs text-slate-400 bg-ink-card border border-white/10 rounded-lg px-3.5 py-2.5">
                <span className="font-medium text-white">{log.status}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
