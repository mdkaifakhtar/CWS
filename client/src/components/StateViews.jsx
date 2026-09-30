export const CardSkeleton = () => (
  <div className="bg-ink-card rounded-xl2 border border-white/10 overflow-hidden animate-pulse">
    <div className="h-36 bg-white/5" />
    <div className="p-4 space-y-2">
      <div className="h-3 w-1/3 bg-white/5 rounded" />
      <div className="h-4 w-2/3 bg-white/5 rounded" />
      <div className="h-3 w-1/2 bg-white/5 rounded" />
      <div className="h-4 w-1/4 bg-white/5 rounded mt-3" />
    </div>
  </div>
);

export const CardSkeletonGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-ink-card border border-dashed border-white/10 rounded-xl2">
    {Icon && (
      <div className="w-14 h-14 rounded-full bg-aqua-500/10 text-aqua-400 flex items-center justify-center mb-4">
        <Icon size={26} />
      </div>
    )}
    <h3 className="font-display font-semibold text-white text-lg">{title}</h3>
    {description && <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
