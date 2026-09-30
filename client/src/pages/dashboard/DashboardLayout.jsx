import { LayoutDashboard, CalendarClock, Car, User, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import DashboardShell from '../../components/ui/DashboardShell';

const links = [
  { to: '/dashboard', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/bookings', label: 'My bookings', icon: CalendarClock },
  { to: '/dashboard/vehicles', label: 'My vehicles', icon: Car },
  { to: '/dashboard/reviews', label: 'My reviews', icon: Star },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  return <DashboardShell title="My dashboard" subtitle={user?.name} links={links} />;
};

export default DashboardLayout;
