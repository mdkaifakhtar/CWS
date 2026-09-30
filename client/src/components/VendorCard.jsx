import { Link } from 'react-router-dom';
import { MapPin, Clock, Navigation } from 'lucide-react';
import RatingStars from './RatingStars';
import ShopImage from './ShopImage';

const VendorCard = ({ vendor }) => {
  const distanceStr =
    vendor?.distanceKm != null
      ? `${vendor.distanceKm} km away`
      : vendor?.distance != null
      ? `${Number(vendor.distance).toFixed(1)} km away`
      : null;

  return (
    <Link
      to={`/vendors/${vendor._id}`}
      className="group flex flex-col flex-shrink-0 snap-start w-[72vw] max-w-[280px] sm:w-64 bg-ink-card rounded-xl2 shadow-card hover:shadow-cardHover transition-all border border-white/10 overflow-hidden"
    >
      <div className="h-36 relative overflow-hidden bg-slate-800">
        <ShopImage src={vendor.coverImageUrl} alt={vendor.businessName} />
        {distanceStr && (
          <span className="absolute top-2.5 right-2.5 bg-ink/80 backdrop-blur-md border border-white/15 text-aqua-300 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Navigation size={10} /> {distanceStr}
          </span>
        )}
        {vendor.isOpenNow !== undefined && (
          <span
            className={`absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              vendor.isOpenNow
                ? 'bg-emerald-500/90 text-white'
                : 'bg-slate-700/90 text-slate-300'
            }`}
          >
            {vendor.isOpenNow ? 'Open Now' : 'Closed'}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-semibold text-white group-hover:text-aqua-400 transition-colors truncate text-base">
            {vendor.businessName}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
            <MapPin size={12} className="flex-shrink-0 text-slate-400" />
            <span className="truncate">{vendor.businessAddress || vendor.city}</span>
          </p>
          {vendor.workingHours?.start && vendor.workingHours?.end && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <Clock size={11} className="flex-shrink-0" /> {vendor.workingHours.start} - {vendor.workingHours.end}
            </p>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <RatingStars rating={vendor.ratingAverage} count={vendor.ratingCount} />
          {vendor.servicesCount > 0 && (
            <span className="text-[11px] text-slate-400 font-medium">
              {vendor.servicesCount} services
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VendorCard;

