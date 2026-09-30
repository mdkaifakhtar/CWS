import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { logout } from '../features/auth/authSlice';
import NotificationBell from './NotificationBell';
import BrandLogo from './BrandLogo';

const navPillClass = ({ isActive }) =>
  `px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
    isActive ? 'bg-volt-500 text-ink' : 'text-slate-300 hover:text-white'
  }`;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setOpen(false);
  };

  const roleHome = user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/dashboard';

  return (
    <div className="sticky top-0 z-40 px-3 sm:px-4 pt-3">
      <header
        className={`relative max-w-7xl mx-auto bg-ink/95 backdrop-blur border border-white/10 shadow-lg transition-[border-radius] duration-150 ${
          open ? 'rounded-[28px]' : 'rounded-full'
        }`}
      >
        <div className="h-[72px] flex items-center justify-between px-3 sm:px-4">
          <BrandLogo size="md" />

          <nav className="hidden md:flex items-center gap-0.5 bg-white/5 rounded-full p-1">
            <NavLink to="/" end className={navPillClass}>
              Home
            </NavLink>
            <NavLink to="/services" className={navPillClass}>
              Services
            </NavLink>
            <NavLink to="/vendor/register" className={navPillClass}>
              Become a vendor
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <Link
                  to={roleHome}
                  className="focus-ring flex items-center gap-1.5 text-sm font-medium text-white px-4 py-2 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
                >
                  <LayoutDashboard size={15} /> {user.name.split(' ')[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="focus-ring flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-full"
                >
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="focus-ring text-sm font-medium text-white px-4 py-2 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="focus-ring text-sm font-semibold text-ink bg-volt-500 hover:bg-volt-400 px-4 py-2 rounded-full transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden focus-ring p-2 rounded-full text-white"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 z-40 cursor-default"
            />
            <div className="md:hidden absolute top-full inset-x-0 mt-2 bg-ink/95 backdrop-blur border border-white/10 rounded-[28px] shadow-lg px-4 py-4 space-y-1 z-50">
            <NavLink to="/" end onClick={() => setOpen(false)} className={navPillClass}>
              Home
            </NavLink>
            <NavLink to="/services" onClick={() => setOpen(false)} className={navPillClass}>
              Services
            </NavLink>
            <NavLink to="/vendor/register" onClick={() => setOpen(false)} className={navPillClass}>
              Become a vendor
            </NavLink>
            <div className="pt-3 mt-2 border-t border-white/10">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={roleHome}
                    onClick={() => setOpen(false)}
                    className="focus-ring flex items-center gap-1.5 text-sm font-medium text-white px-4 py-2.5 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  <div className="flex items-center gap-1">
                    <NotificationBell />
                    <button
                      onClick={handleLogout}
                      aria-label="Logout"
                      className="focus-ring flex items-center justify-center w-10 h-10 rounded-full text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      <LogOut size={17} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="focus-ring flex-1 text-center text-sm font-medium text-white px-4 py-2.5 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="focus-ring flex-1 text-center text-sm font-semibold text-ink bg-volt-500 hover:bg-volt-400 px-4 py-2.5 rounded-full transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
            </div>
          </>
        )}
      </header>
    </div>
  );
};

export default Navbar;
