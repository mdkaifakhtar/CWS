import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star } from 'lucide-react';
import { fetchMyReviews } from '../../features/booking/userSlice';
import { EmptyState } from '../../components/StateViews';
import RatingStars from '../../components/RatingStars';

const MyReviews = () => {
  const dispatch = useDispatch();
  const { reviews } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchMyReviews());
  }, [dispatch]);

  return (
    <div>
      <h2 className="font-display font-semibold text-lg text-white mb-6">My reviews</h2>
      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="You haven't reviewed anything yet"
          description="Reviews you write after a completed booking will show up here."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-ink-card border border-white/10 rounded-xl2 p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-semibold text-white">{r.service?.name}</p>
                <RatingStars rating={r.rating} />
              </div>
              <p className="text-xs text-slate-400">{r.vendor?.businessName}</p>
              {r.comment && <p className="text-sm text-slate-300 mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;
