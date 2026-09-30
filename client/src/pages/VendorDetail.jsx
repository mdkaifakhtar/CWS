import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, PackageX, Clock, Phone, Mail } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import RatingStars from '../components/RatingStars';
import ServiceCard from '../components/ServiceCard';
import ShopImage from '../components/ShopImage';
import { EmptyState } from '../components/StateViews';

const VendorDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosClient.get(`/catalog/vendors/${id}`).then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-slate-400">Loading vendor…</div>;
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-slate-400">Vendor not found.</div>
    );
  }

  const { vendor, services, reviews } = data;

  return (
    <div>
      <div className="bg-ink border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/services" className="focus-ring flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-6">
            <ArrowLeft size={15} /> Back to services
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-full md:w-56 h-36 rounded-2xl overflow-hidden shadow-card border border-white/10 flex-shrink-0 bg-slate-800">
              <ShopImage src={vendor.coverImageUrl} alt={vendor.businessName} />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">{vendor.businessName}</h1>
              <p className="text-slate-300 text-sm flex items-center gap-1.5 mt-2">
                <MapPin size={14} className="text-aqua-400 flex-shrink-0" />
                {vendor.businessAddress}, {vendor.city}{vendor.state ? `, ${vendor.state}` : ''} {vendor.pincode}
              </p>
              {vendor.workingHours?.start && vendor.workingHours?.end && (
                <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                  <Clock size={13} className="text-slate-400 flex-shrink-0" /> Working Hours: {vendor.workingHours.start} - {vendor.workingHours.end} ({vendor.workingDays?.join(', ') || 'All Days'})
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <RatingStars rating={vendor.ratingAverage} count={vendor.ratingCount} />
                {vendor.phone && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone size={11} /> {vendor.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          {vendor.description && <p className="text-slate-300 text-sm mt-6 max-w-3xl leading-relaxed">{vendor.description}</p>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display font-bold text-xl text-white mb-5">Services by {vendor.businessName}</h2>
        {services.length === 0 ? (
          <EmptyState icon={PackageX} title="No active services" description="This vendor hasn't listed any services yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {services.map((s) => (
              <ServiceCard key={s._id} service={{ ...s, vendor }} />
            ))}
          </div>
        )}

        <h2 className="font-display font-bold text-xl text-white mb-5">Customer reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400">No reviews yet.</p>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {reviews.map((r) => (
              <div key={r._id} className="border border-white/10 rounded-xl2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{r.user?.name}</span>
                  <RatingStars rating={r.rating} size={13} />
                </div>
                {r.comment && <p className="text-sm text-slate-300 mt-1.5">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetail;
