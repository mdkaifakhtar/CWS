import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Store, FileCheck2, Wrench, CalendarClock, Star, AlertTriangle, Clock, Ban } from 'lucide-react';
import { fetchVendorProfile } from '../../features/vendor/vendorSlice';
import DashboardShell from '../../components/ui/DashboardShell';

const links = [
  { to: '/vendor', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/vendor/profile', label: 'Shop profile & photos', icon: Store },
  { to: '/vendor/services', label: 'Services', icon: Wrench },
  { to: '/vendor/bookings', label: 'Bookings', icon: CalendarClock },
  { to: '/vendor/reviews', label: 'Reviews', icon: Star },
];

const STATUS_BANNERS = {
  pending: {
    icon: Clock,
    tone: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    title: 'Your account is pending admin review',
    message: "Our team is reviewing your business registration and shop details. You can update your shop profile and photos in the meantime.",
  },
  rejected: {
    icon: AlertTriangle,
    tone: 'bg-red-500/10 border-red-500/30 text-red-400',
    title: 'Your application was rejected',
    message: null,
  },
  suspended: {
    icon: Ban,
    tone: 'bg-red-500/10 border-red-500/30 text-red-400',
    title: 'Your account has been suspended',
    message: null,
  },
};

const VendorDashboardLayout = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.vendor);

  useEffect(() => {
    dispatch(fetchVendorProfile());
  }, [dispatch]);

  const banner = profile && profile.approvalStatus !== 'approved' ? STATUS_BANNERS[profile.approvalStatus] : null;

  const bannerEl = banner && (
    <div className={`flex items-start gap-3 border rounded-2xl px-5 py-4 mb-8 ${banner.tone}`}>
      <banner.icon size={20} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm">{banner.title}</p>
        <p className="text-sm mt-0.5 opacity-90">
          {profile.approvalStatus === 'rejected' && (profile.rejectionReason || 'Please contact support for details.')}
          {profile.approvalStatus === 'suspended' && (profile.suspensionReason || 'Please contact support for details.')}
          {profile.approvalStatus === 'pending' && banner.message}
        </p>
      </div>
    </div>
  );

  return <DashboardShell title="Vendor dashboard" subtitle={profile?.businessName} links={links} banner={bannerEl} />;
};

export default VendorDashboardLayout;
