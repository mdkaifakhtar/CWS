import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-volt-500 hover:bg-volt-400 text-ink font-semibold rounded-full',
  dark: 'bg-white hover:bg-slate-100 text-ink font-semibold rounded-full',
  outline: 'border border-white/15 hover:bg-white/5 text-white font-medium rounded-lg',
  outlineDark: 'border border-white/15 hover:bg-white/5 text-white font-medium rounded-full',
  ghost: 'text-slate-300 hover:bg-white/5 font-medium rounded-lg',
  danger: 'border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold rounded-lg',
  aqua: 'bg-aqua-500 hover:bg-aqua-600 text-white font-semibold rounded-lg',
};

const SIZES = {
  sm: 'text-xs px-3.5 py-1.5 gap-1.5',
  md: 'text-sm px-5 py-2.5 gap-2',
  lg: 'text-sm px-7 py-3.5 gap-2',
};

/**
 * Shared Button — the single source of truth for button styling across the app.
 * variant: primary | dark | outline | outlineDark | ghost | danger | aqua
 * size: sm | md | lg
 */
const Button = forwardRef(
  (
    { variant = 'primary', size = 'md', loading = false, icon: Icon, iconPosition = 'left', className = '', children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`focus-ring inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={15} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={15} />}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
