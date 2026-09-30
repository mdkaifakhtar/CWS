import { LayoutDashboard, Store, CalendarClock, TrendingUp, Wallet, Settings } from 'lucide-react';
import DashboardShell from '../../components/ui/DashboardShell';

const links = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/daily', label: 'Daily operations', icon: CalendarClock },
  { to: '/admin/vendors', label: 'Vendors', icon: Store },
  { to: '/admin/performance', label: 'Vendor performance', icon: TrendingUp },
  { to: '/admin/collections', label: 'Collections', icon: Wallet },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const AdminDashboardLayout = () => <DashboardShell title="Admin panel" subtitle="Platform overview and vendor management" links={links} />;

export default AdminDashboardLayout;
