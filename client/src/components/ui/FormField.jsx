import { forwardRef } from 'react';

const fieldBase =
  'focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 disabled:bg-white/5 disabled:text-slate-500 transition-colors';

export const Field = ({ label, error, hint, required, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-slate-200 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export const TextInput = forwardRef(({ error, className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`${fieldBase} ${error ? 'border-red-400/60' : ''} ${className}`}
    {...props}
  />
));
TextInput.displayName = 'TextInput';

export const TextArea = forwardRef(({ error, className = '', rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={`${fieldBase} resize-none ${error ? 'border-red-400/60' : ''} ${className}`}
    {...props}
  />
));
TextArea.displayName = 'TextArea';

export const Select = forwardRef(({ error, className = '', children, ...props }, ref) => (
  <select ref={ref} className={`${fieldBase} bg-ink ${error ? 'border-red-400/60' : ''} ${className}`} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';
