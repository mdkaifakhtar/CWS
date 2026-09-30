import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, ShieldCheck, Clock3, Sparkles, ArrowRight, Star, Lock, CheckCircle2 } from 'lucide-react';
import { fetchHomeFeed } from '../features/booking/catalogSlice';
import ServiceCard from '../components/ServiceCard';
import VendorCard from '../components/VendorCard';
import { CardSkeletonGrid } from '../components/StateViews';
import Button from '../components/ui/Button';

const FLOATING_BADGES = [
  { label: 'Verified vendors only', icon: Star, offset: 'left-2 top-[14%]' },
  { label: 'Fair, transparent pricing', icon: Lock, offset: 'left-6 top-[38%]' },
  { label: 'Pay only after the job', icon: CheckCircle2, offset: 'left-3 top-[62%]', accent: true },
];

const HOW_IT_WORKS = [
  {
    title: '1. Select Vehicle',
    description: 'Pick your saved vehicle or add a vehicle to get started.',
    icon: Sparkles,
  },
  {
    title: '2. Select Service',
    description: 'Choose from Basic Wash, Premium Detailing, or Waterless Wash.',
    icon: Sparkles,
  },
  {
    title: '3. Choose Nearby Shop',
    description: 'Discover verified car wash shops sorted by distance from your location.',
    icon: MapPin,
  },
  {
    title: '4. Pick Date & Slot',
    description: 'Select an available date and time slot based on real shop availability.',
    icon: Clock3,
  },
  {
    title: '5. Visit & Pay Cash',
    description: 'Bring your vehicle to the shop at the booked time and pay cash upon completion.',
    icon: ShieldCheck,
  },
];


const HeroPhoto = () => (
  <div className="relative w-full h-full">
    <img
      src="/images/hero-car-wash.jpg"
      alt="Close-up of a car being foam-washed"
      className="w-full h-full object-cover"
    />
    {/* Gradient overlays for badge/CTA legibility over the photo */}
    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
    <div className="absolute inset-0 bg-gradient-to-r from-ink/50 via-transparent to-transparent" />
  </div>
);

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { home } = useSelector((state) => state.catalog);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchHomeFeed()).finally(() => setLoading(false));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(location ? `/services?city=${encodeURIComponent(location)}` : '/services');
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-14 pb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left: headline + search */}
            <div className="lg:col-span-7">
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-volt-500" /> Trusted car wash shops, near you
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="font-display font-bold text-[clamp(1.9rem,8vw,2.4rem)] leading-[1.05] sm:text-6xl lg:text-[3.6rem] text-white uppercase tracking-tight"
              >
                Where your car <br /> finds its <span className="text-volt-500">glow</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="text-slate-400 mt-5 max-w-lg text-base"
              >
                Compare verified local shops, pick a service, and book a time slot in under two minutes. Visit the shop and pay there.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSearch}
                className="mt-8 max-w-lg relative"
              >
                <div className="relative flex items-center bg-white rounded-full shadow-lg p-1.5">
                  <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
                    {location && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-volt-500/40 animate-ripple" />
                    )}
                    <span className="relative z-10 w-9 h-9 rounded-full bg-mist text-ink flex items-center justify-center">
                      <MapPin size={16} />
                    </span>
                  </div>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your city or locality"
                    className="focus-ring flex-1 bg-transparent border-none outline-none px-2 text-sm sm:text-base text-ink placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="focus-ring flex items-center gap-1.5 bg-volt-500 hover:bg-volt-400 text-ink text-sm font-semibold px-5 py-2.5 rounded-full transition-colors flex-shrink-0"
                  >
                    <Search size={15} /> Search
                  </button>
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="hidden lg:inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full text-white mt-8"
              >
                <span className="text-volt-400 font-semibold">Excellent</span>
                <span className="flex text-volt-400">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={11} fill="currentColor" />)}
                </span>
                <span className="text-slate-400">rated by customers</span>
              </motion.div>
            </div>

            {/* Right: hero photo panel with staggered trust badges */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="relative rounded-[1.75rem] overflow-hidden aspect-[16/10] sm:aspect-[5/5.2] lg:aspect-[4/4.8] border border-white/10"
              >
                <HeroPhoto />

                {/* mobile rating pill (desktop version shown in left column) */}
                <span className="lg:hidden absolute top-4 right-4 inline-flex items-center gap-1.5 bg-ink/80 backdrop-blur border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full text-white">
                  <span className="text-volt-400 font-semibold">Excellent</span>
                  <span className="flex text-volt-400">
                    {[1, 2, 3].map((i) => <Star key={i} size={10} fill="currentColor" />)}
                  </span>
                </span>

                {FLOATING_BADGES.map((b) => (
                  <span
                    key={b.label}
                    className={`hidden sm:inline-flex absolute ${b.offset} items-center gap-1.5 bg-ink/85 backdrop-blur border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full text-white shadow-lg max-w-[75%]`}
                  >
                    <b.icon size={13} className={b.accent ? 'text-green-400' : 'text-volt-500'} /> {b.label}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden sm:block absolute -bottom-5 -right-3 sm:right-2"
              >
                <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/services')}>
                  Schedule a wash
                </Button>
              </motion.div>
            </div>
          </div>

          {/* mobile-only CTA, since the overlapping button is hidden on small screens */}
          <div className="sm:hidden mt-6">
            <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full" onClick={() => navigate('/services')}>
              Schedule a wash
            </Button>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative z-10">
        <div className="bg-ink-card rounded-[1.75rem] shadow-card border border-white/10 p-5 sm:p-6 flex gap-3 overflow-x-auto">
          {(home.categories || []).map((cat) => (
            <button
              key={cat._id}
              onClick={() => navigate(`/services?category=${cat._id}`)}
              className="focus-ring flex-shrink-0 flex flex-col items-center gap-2 px-4 py-2 rounded-2xl hover:bg-white/5 transition-colors"
            >
              <span className="w-11 h-11 rounded-full bg-aqua-500/10 text-aqua-400 flex items-center justify-center font-display font-bold">
                {cat.name[0]}
              </span>
              <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">Popular right now</h2>
            <p className="text-slate-400 text-sm mt-1">Frequently booked services across all vendors.</p>
          </div>
          <button
            onClick={() => navigate('/services')}
            className="focus-ring hidden sm:flex items-center gap-1 text-sm font-semibold text-aqua-400 hover:text-aqua-300"
          >
            View all <ArrowRight size={15} />
          </button>
        </div>

        {loading ? (
          <CardSkeletonGrid count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {(home.popularServices || []).map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <h2 className="font-display font-bold text-2xl text-white text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((step, idx) => (
            <div key={step.title} className="relative bg-ink-card rounded-2xl border border-white/10 p-6">
              <span className="font-mono text-xs text-aqua-400 font-semibold">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="w-11 h-11 rounded-full bg-aqua-500/10 text-aqua-400 flex items-center justify-center mt-3 mb-4">
                <step.icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED VENDORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-20">
        <h2 className="font-display font-bold text-2xl text-white mb-6">Top-rated vendors near you</h2>
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(home.featuredVendors || []).map((v) => (
            <VendorCard key={v._id} vendor={v} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-card border-t border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white uppercase tracking-tight">
            Have a vehicle that needs a wash today?
          </h2>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">
            Browse services from vendors covering your area and book a slot right now.
          </p>
          <div className="mt-6 flex justify-center">
            <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" onClick={() => navigate('/services')}>
              Book a car wash
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
