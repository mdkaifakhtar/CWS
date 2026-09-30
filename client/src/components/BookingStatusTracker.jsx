import { Check, X } from 'lucide-react';
import { BookingStatusBadge } from './ui/Badge';

const HAPPY_PATH = ['Pending', 'Confirmed', 'In Progress', 'Completed'];

// Re-exported for backward compatibility with existing imports across the app.
export const StatusBadge = BookingStatusBadge;

const BookingStatusTracker = ({ status }) => {
  if (status === 'Cancelled' || status === 'Rejected') {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
        <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <X size={14} />
        </span>
        {status}
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.indexOf(status);

  return (
    <div className="flex items-center w-full overflow-x-auto pb-2">
      {HAPPY_PATH.map((step, idx) => {
        const done = idx < currentIndex;
        const current = idx === currentIndex;
        return (
          <div key={step} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center w-24 text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold ${
                  done
                    ? 'bg-aqua-500 border-aqua-500 text-white'
                    : current
                    ? 'border-aqua-500 text-aqua-400 bg-ink-card'
                    : 'border-white/10 text-slate-300 bg-ink-card'
                }`}
              >
                {done ? <Check size={14} /> : idx + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] leading-tight ${
                  current ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </div>
            {idx < HAPPY_PATH.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-14 -mt-5 ${done ? 'bg-aqua-500' : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookingStatusTracker;
