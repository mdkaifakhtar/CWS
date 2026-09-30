export const Badge = ({ children, tone = 'slate', className = '' }) => {
  const tones = {
    slate: 'bg-white/10 text-slate-300',
    aqua: 'bg-aqua-500/15 text-aqua-300',
    volt: 'bg-volt-500/15 text-volt-400',
    amber: 'bg-amber-500/15 text-amber-400',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
};

const BOOKING_STATUS_TONE = {
  Pending: 'amber',
  Confirmed: 'aqua',
  'In Progress': 'aqua',
  Completed: 'green',
  Cancelled: 'red',
  Rejected: 'red',
};

export const BookingStatusBadge = ({ status }) => (
  <Badge tone={BOOKING_STATUS_TONE[status] || 'slate'}>{status}</Badge>
);

const VENDOR_STATUS_TONE = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  suspended: 'red',
};

export const VendorStatusBadge = ({ status }) => (
  <Badge tone={VENDOR_STATUS_TONE[status] || 'slate'} className="capitalize">
    {status}
  </Badge>
);
