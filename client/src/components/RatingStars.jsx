import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, count, size = 14 }) => {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1 text-amber-400">
      <span className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            fill={i <= rounded ? 'currentColor' : 'none'}
            strokeWidth={1.5}
            className={i <= rounded ? '' : 'text-slate-300'}
          />
        ))}
      </span>
      {rating > 0 && <span className="text-xs font-medium text-slate-300">{rating.toFixed(1)}</span>}
      {typeof count === 'number' && <span className="text-xs text-slate-400">({count})</span>}
    </span>
  );
};

export default RatingStars;
