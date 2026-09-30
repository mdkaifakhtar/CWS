import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock3, MapPin } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { StatusBadge } from '../components/BookingStatusTracker';
import Button from '../components/ui/Button';

const BookingConfirmation = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    axiosClient.get(`/bookings/${id}`).then((res) => setBooking(res.data.data.booking));
  }, [id]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-5">
        <Clock3 size={32} />
      </div>
      <h1 className="font-display font-bold text-2xl text-white">Booking request sent!</h1>
      <p className="text-slate-400 mt-2">
        Please wait for the shop to confirm your booking. Once confirmed, bring your vehicle in at
        the selected time.
      </p>

      {booking && (
        <div className="bg-ink-card border border-white/10 shadow-card rounded-xl2 p-6 mt-8 text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-sm font-semibold text-white">{booking.bookingCode}</span>
            <StatusBadge status={booking.status} />
          </div>
          <dl className="divide-y divide-white/10 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-400">Service</dt>
              <dd className="font-medium text-white">{booking.service?.name}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-400">Shop</dt>
              <dd className="font-medium text-white">{booking.vendor?.businessName}</dd>
            </div>
            <div className="py-2.5">
              <dt className="text-slate-400 flex items-center gap-1 mb-1">
                <MapPin size={12} /> Shop location
              </dt>
              <dd className="font-medium text-white text-xs">
                {booking.vendor?.businessAddress}, {booking.vendor?.city}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-400">Scheduled</dt>
              <dd className="font-medium text-white">
                {new Date(booking.scheduledDate).toLocaleDateString()} · {booking.scheduledTimeSlot}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-400">Amount payable</dt>
              <dd className="font-semibold text-white">₹{booking.priceQuoted} (at the shop)</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 mt-8">
        <Link to="/dashboard/bookings">
          <Button variant="dark">View my bookings</Button>
        </Link>
        <Link to="/services" className="focus-ring text-sm font-medium text-slate-400 px-5 py-2.5">
          Browse more shops
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
