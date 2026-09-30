import { Link } from 'react-router-dom';
import resolveImageUrl from '../utils/resolveImageUrl';
import { Clock, MapPin, Navigation } from 'lucide-react';
import RatingStars from './RatingStars';
import { Badge } from './ui/Badge';

const ServiceCard = ({ service }) => {
  const discounted = service.discountPercent > 0;
  const finalPrice = discounted
    ? Math.round(service.basePrice * (1 - service.discountPercent / 100))
    : service.basePrice;

  return (
    <Link
      to={`/services/${service._id}`}
      className="group block bg-ink-card rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow duration-200 overflow-hidden border border-white/10"
    >
      <div className="relative h-36 bg-gradient-to-br from-aqua-500/15 to-aqua-700/10 flex items-center justify-center overflow-hidden">
        {service.images?.[0] ? (
          <img src={resolveImageUrl(service.images[0])} alt={service.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-aqua-400 text-2xl">{service.name?.[0]}</span>
        )}
        {service.vendor && (
          <span className="absolute top-2 right-2">
            <Badge tone={service.vendor.isOpenNow ? 'green' : 'slate'}>
              {service.vendor.isOpenNow ? 'Open now' : 'Closed'}
            </Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-aqua-400 uppercase tracking-wide mb-1">
          {service.category?.name}
        </p>
        <h3 className="font-display font-semibold text-white group-hover:text-aqua-400 transition-colors">
          {service.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <MapPin size={12} /> {service.vendor?.businessName} · {service.vendor?.city}
          {typeof service.distanceKm === 'number' && (
            <span className="flex items-center gap-0.5 text-aqua-400 ml-1">
              <Navigation size={10} /> {service.distanceKm} km
            </span>
          )}
        </p>

        <div className="flex items-center justify-between mt-3">
          <RatingStars rating={service.ratingAverage} count={service.ratingCount} />
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} /> {service.durationMinutes} min
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display font-bold text-white">₹{finalPrice}</span>
          {discounted && (
            <>
              <span className="text-xs text-slate-400 line-through">₹{service.basePrice}</span>
              <span className="text-xs font-semibold text-amber-400">{service.discountPercent}% off</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
