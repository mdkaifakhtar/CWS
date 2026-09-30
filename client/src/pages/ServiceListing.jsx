import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, MapPin, SearchX, Navigation, Loader2, Search, X } from 'lucide-react';
import { searchServices, fetchCategories } from '../features/booking/catalogSlice';
import ServiceCard from '../components/ServiceCard';
import { CardSkeletonGrid, EmptyState } from '../components/StateViews';
import { TextInput, Select } from '../components/ui/FormField';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: '', label: 'Most relevant' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'priceLowToHigh', label: 'Price: low to high' },
  { value: 'priceHighToLow', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];

const ServiceListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { searchResults, pagination, status, categories } = useSelector((state) => state.catalog);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const city = searchParams.get('city') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const lat = searchParams.get('lat') || '';
  const lng = searchParams.get('lng') || '';
  const page = Number(searchParams.get('page') || 1);
  const [locating, setLocating] = useState(false);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredResults = normalizedSearch
    ? searchResults.filter((s) => {
        const haystack = [
          s.name,
          s.vendor?.businessName,
          s.vendor?.city,
          s.category?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : searchResults;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(searchServices({ city, category, sort, minPrice, maxPrice, minRating, lat, lng, page, limit: 12 }));
  }, [dispatch, city, category, sort, minPrice, maxPrice, minRating, lat, lng, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location services are not available in this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = new URLSearchParams(searchParams);
        next.set('lat', position.coords.latitude);
        next.set('lng', position.coords.longitude);
        next.set('sort', 'distance');
        next.delete('city');
        next.delete('page');
        setSearchParams(next);
        setLocating(false);
        toast.success('Showing vendors near your current location');
      },
      () => {
        setLocating(false);
        toast.error('Could not access your location. Check your browser permissions.');
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            {city ? `Car wash services in ${city}` : 'All car wash services'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{filteredResults.length} services available</p>
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="focus-ring sm:hidden flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium self-start"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shops, areas or services..."
          aria-label="Search shops, areas or services"
          className="w-full bg-ink-card border border-white/10 rounded-xl2 pl-11 pr-10 py-3 text-sm text-white placeholder:text-slate-500 focus-ring"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        {/* FILTERS */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
          <div className="bg-ink-card border border-white/10 rounded-xl2 p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Location
            </label>
            <div className="relative mb-2">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput
                defaultValue={city}
                onBlur={(e) => updateParam('city', e.target.value)}
                placeholder="City"
                className="pl-8"
              />
            </div>
            <button
              onClick={handleUseMyLocation}
              disabled={locating}
              className="focus-ring w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-aqua-400 hover:text-aqua-300 border border-white/10 hover:border-aqua-500/40 rounded-lg py-2 transition-colors disabled:opacity-60"
            >
              {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
              {locating ? 'Locating…' : 'Use my current location'}
            </button>
            {lat && lng && (
              <p className="text-[11px] text-slate-500 mt-2">Sorted by distance from your location.</p>
            )}
          </div>

          <div className="bg-ink-card border border-white/10 rounded-xl2 p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Category
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="category"
                  checked={!category}
                  onChange={() => updateParam('category', '')}
                  className="accent-aqua-500"
                />
                All categories
              </label>
              {categories.map((c) => (
                <label key={c._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="category"
                    checked={category === c._id}
                    onChange={() => updateParam('category', c._id)}
                    className="accent-aqua-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-ink-card border border-white/10 rounded-xl2 p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Price range (₹)
            </label>
            <div className="flex items-center gap-2">
              <TextInput
                type="number"
                defaultValue={minPrice}
                onBlur={(e) => updateParam('minPrice', e.target.value)}
                placeholder="Min"
              />
              <span className="text-slate-400">–</span>
              <TextInput
                type="number"
                defaultValue={maxPrice}
                onBlur={(e) => updateParam('maxPrice', e.target.value)}
                placeholder="Max"
              />
            </div>
          </div>

          <div className="bg-ink-card border border-white/10 rounded-xl2 p-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Minimum rating
            </label>
            <div className="flex gap-2">
              {[4, 3, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => updateParam('minRating', minRating === String(r) ? '' : String(r))}
                  className={`focus-ring text-xs font-semibold px-3 py-1.5 rounded-full border ${
                    minRating === String(r)
                      ? 'bg-aqua-500/100 border-aqua-500 text-white'
                      : 'border-white/10 text-slate-300'
                  }`}
                >
                  {r}+ ★
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* RESULTS */}
        <div>
          <div className="flex justify-end mb-5">
            <Select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="w-auto">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              {lat && lng && <option value="distance">Nearest to me</option>}
            </Select>
          </div>

          {status === 'loading' ? (
            <CardSkeletonGrid count={9} />
          ) : filteredResults.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={normalizedSearch ? `No shops found for "${search}"` : 'No services matched your filters'}
              description={
                normalizedSearch
                  ? 'Try a different shop name, area, or service.'
                  : 'Try widening your price range, clearing filters, or searching a nearby city.'
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredResults.map((s) => (
                  <ServiceCard key={s._id} service={s} />
                ))}
              </div>

              {!normalizedSearch && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateParam('page', String(i + 1))}
                      className={`focus-ring w-9 h-9 rounded-lg text-sm font-medium ${
                        page === i + 1 ? 'bg-volt-500 text-ink' : 'border border-white/10 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceListing;
