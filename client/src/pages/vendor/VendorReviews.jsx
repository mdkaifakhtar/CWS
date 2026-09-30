import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star } from 'lucide-react';
import { fetchVendorReviews } from '../../features/vendor/vendorSlice';
import { PageHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/StateViews';
import RatingStars from '../../components/RatingStars';

const VendorReviews = () => {
  const dispatch = useDispatch();
  const { reviews, profile } = useSelector((state) => state.vendor);

  useEffect(() => {
    dispatch(fetchVendorReviews());
  }, [dispatch]);

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={profile ? `Average rating: ${profile.ratingAverage?.toFixed(1) || '—'} from ${profile.ratingCount || 0} reviews` : ''}
      />

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Reviews from customers will appear here after completed bookings." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-ink-card border border-white/10 rounded-xl2 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-white">{r.user?.name}</p>
                <RatingStars rating={r.rating} />
              </div>
              <p className="text-xs text-slate-400">{r.service?.name}</p>
              {r.comment && <p className="text-sm text-slate-300 mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
