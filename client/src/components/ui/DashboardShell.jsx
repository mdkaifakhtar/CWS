import { NavLink, Outlet } from 'react-router-dom';

/**
 * Shared dashboard shell: page title + a sidebar nav card + content outlet.
 * Used identically by the customer, vendor, and admin panels so all three
 * feel like one product rather than three differently-styled dashboards.
 */
const DashboardShell = ({ title, subtitle, links, banner }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div className="mb-8">
      <h1 className="font-display font-bold text-2xl text-white">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>

    {banner}

    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      <nav className="bg-ink-card border border-white/10 rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible h-fit">
        {links.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `focus-ring flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive ? 'bg-volt-500 text-ink' : 'text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  </div>
);

export default DashboardShell;
