export const Card = ({ children, className = '', padded = true }) => (
  <div className={`bg-ink-card border border-white/10 rounded-xl2 shadow-card ${padded ? 'p-6' : ''} ${className}`}>
    {children}
  </div>
);

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
    <div>
      {eyebrow && (
        <p className="text-xs font-semibold text-volt-500 uppercase tracking-wide mb-1.5">{eyebrow}</p>
      )}
      <h1 className="font-display font-bold text-2xl text-white">{title}</h1>
      {description && <p className="text-sm text-slate-400 mt-1.5 max-w-xl">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, tone = 'aqua', trend }) => {
  const tones = {
    aqua: 'text-aqua-300 bg-aqua-500/10',
    volt: 'text-volt-400 bg-volt-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
  };
  return (
    <div className="bg-ink-card border border-white/10 rounded-xl2 p-5">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone] || tones.aqua}`}>
            <Icon size={17} />
          </div>
        )}
        {trend && <span className="text-xs font-semibold text-green-400">{trend}</span>}
      </div>
      <p className="font-display font-bold text-2xl text-white mt-3">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
};
