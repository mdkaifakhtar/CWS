import { useEffect, useState } from 'react';
import resolveImageUrl from '../utils/resolveImageUrl';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, MapPin, Check, ArrowLeft } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import RatingStars from '../components/RatingStars';
import { startBookingDraft } from '../features/booking/bookingSlice';

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/catalog/services/${id}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('This service could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookNow = () => {
    if (!data) return;
    dispatch(startBookingDraft({ serviceId: data.service._id, service: data.service }));
    if (!token) {
      navigate('/login', { state: { from: { pathname: `/book/${data.service._id}` } } });
    } else {
      navigate(`/book/${data.service._id}`);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">Loading service…</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">{error}</p>
        <Link to="/services" className="text-aqua-400 font-semibold mt-3 inline-block">
          Browse other services
        </Link>
      </div>
    );
  }

  const { service, reviews } = data;
  const discounted = service.discountPercent > 0;
  const finalPrice = discounted
    ? Math.round(service.basePrice * (1 - service.discountPercent / 100))
    : service.basePrice;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => navigate(-1)}
        className="focus-ring flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <div className="h-64 rounded-xl2 bg-gradient-to-br from-aqua-100 to-aqua-50 flex items-center justify-center overflow-hidden mb-6">
            {service.images?.[0] ? (
              <img src={resolveImageUrl(service.images[0])} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-aqua-500 text-5xl font-bold">{service.name[0]}</span>
            )}
          </div>

          <p className="text-xs font-semibold text-aqua-400 uppercase tracking-wide">{service.category?.name}</p>
          <h1 className="font-display font-bold text-3xl text-white mt-1">{service.name}</h1>

          <div className="flex items-center gap-4 mt-3">
            <RatingStars rating={service.ratingAverage} count={service.ratingCount} size={16} />
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Clock size={14} /> {service.durationMinutes} minutes
            </span>
          </div>

          <p className="text-slate-300 mt-5 leading-relaxed">{service.description}</p>

          {service.includedItems?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display font-semibold text-white mb-3">What's included</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {service.includedItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-aqua-500/10 text-aqua-400 flex items-center justify-center flex-shrink-0">
                      <Check size={12} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <h3 className="font-display font-semibold text-white mb-4">Customer reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-400">No reviews yet for this service.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r._id} className="border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{r.user?.name}</span>
                      <RatingStars rating={r.rating} size={13} />
                    </div>
                    {r.comment && <p className="text-sm text-slate-300 mt-1.5">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-ink-card border border-white/10 shadow-card rounded-xl2 p-6">
            <Link
              to={`/vendors/${service.vendor._id}`}
              className="flex items-center gap-3 mb-5 group"
            >
              <span className="w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center font-display font-bold flex-shrink-0">
                {service.vendor.businessName[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-aqua-400">
                  {service.vendor.businessName}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {service.vendor.city}
                </p>
              </div>
            </Link>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display font-bold text-3xl text-white">₹{finalPrice}</span>
              {discounted && (
                <span className="text-sm text-slate-400 line-through">₹{service.basePrice}</span>
              )}
            </div>
            {discounted && (
              <p className="text-xs font-semibold text-amber-400 mb-4">{service.discountPercent}% off applied</p>
            )}
            <p className="text-xs text-slate-400 mb-5">
              Final price may vary slightly by vehicle type, confirmed at checkout.
            </p>

            <button
              onClick={handleBookNow}
              className="focus-ring w-full bg-aqua-500/100 hover:bg-aqua-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Book now
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ServiceDetail;
