import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Plus,
  CalendarX,
  Loader2,
  Car,
  Store,
  Navigation,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';
import { fetchVehicleTypes } from '../features/booking/catalogSlice';
import { fetchMyVehicles, addVehicle } from '../features/booking/vehicleSlice';
import { updateBookingDraft, submitBooking, resetBookingDraft } from '../features/booking/bookingSlice';
import axiosClient from '../api/axiosClient';
import Button from '../components/ui/Button';
import { Field, TextInput, Select } from '../components/ui/FormField';
import ShopImage from '../components/ShopImage';
import RatingStars from '../components/RatingStars';

const STEPS = ['Vehicle', 'Service', 'Shop', 'Schedule', 'Confirm'];

const emptyVehicleForm = { vehicleType: '', nickname: '', make: '', model: '', registrationNumber: '' };

const BookService = () => {
  const { serviceId: paramServiceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { draft, submitStatus, submitError } = useSelector((state) => state.booking);
  const { vehicleTypes } = useSelector((state) => state.catalog);
  const { items: vehicles } = useSelector((state) => state.vehicles);
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(0);

  // Vehicles state
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Services catalog state
  const [availableServices, setAvailableServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceObj, setSelectedServiceObj] = useState(draft.service || null);
  const [serviceSearch, setServiceSearch] = useState('');

  // Vendor discovery state
  const [nearbyVendors, setNearbyVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [selectedVendorObj, setSelectedVendorObj] = useState(draft.vendor || null);

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [locationMessage, setLocationMessage] = useState('');

  // Availability state
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Initial load
  useEffect(() => {
    dispatch(fetchVehicleTypes());
    dispatch(fetchMyVehicles());

    // Fetch catalog services
    setServicesLoading(true);
    axiosClient
      .get('/catalog/services')
      .then((res) => {
        const servicesList = res.data.data || [];
        setAvailableServices(servicesList);

        // If serviceId passed in URL, pre-select it
        if (paramServiceId) {
          const matched = servicesList.find((s) => s._id === paramServiceId);
          if (matched) {
            setSelectedServiceObj(matched);
            dispatch(updateBookingDraft({ serviceId: matched._id, service: matched }));
          } else {
            axiosClient.get(`/catalog/services/${paramServiceId}`).then((sRes) => {
              const singleService = sRes.data.data?.service;
              if (singleService) {
                setSelectedServiceObj(singleService);
                dispatch(updateBookingDraft({ serviceId: singleService._id, service: singleService }));
              }
            });
          }
        }
      })
      .finally(() => setServicesLoading(false));
  }, [dispatch, paramServiceId]);

  // Handle Geolocation
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationMessage('Location access is unavailable in this browser. Please select your shop manually below.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
        setLocationMessage('Showing shops nearest to your current location.');
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationStatus('denied');
        setLocationMessage('Location access was denied or is unavailable. Please select your shop manually below.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Fetch vendors providing selected service whenever service or location changes
  useEffect(() => {
    if (selectedServiceObj?._id) {
      setVendorsLoading(true);
      const params = { serviceId: selectedServiceObj._id };
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
      }
      axiosClient
        .get('/catalog/nearby-vendors', { params })
        .then((res) => {
          setNearbyVendors(res.data.data || []);
        })
        .catch(() => setNearbyVendors([]))
        .finally(() => setVendorsLoading(false));
    }
  }, [selectedServiceObj, userLocation]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!draft.scheduledDate || !selectedServiceObj?._id) {
      setAvailability(null);
      return;
    }
    setAvailabilityLoading(true);
    axiosClient
      .get(`/catalog/services/${selectedServiceObj._id}/availability`, { params: { date: draft.scheduledDate } })
      .then((res) => {
        setAvailability(res.data.data);
        const stillAvailable = res.data.data.slots.some((s) => s.label === draft.scheduledTimeSlot && s.available);
        if (!stillAvailable && draft.scheduledTimeSlot) {
          dispatch(updateBookingDraft({ scheduledTimeSlot: null }));
        }
      })
      .catch(() => setAvailability({ isWorkingDay: false, isUnavailableDate: false, slots: [] }))
      .finally(() => setAvailabilityLoading(false));
  }, [draft.scheduledDate, selectedServiceObj, dispatch]);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const normalizedServiceSearch = serviceSearch.trim().toLowerCase();
  const filteredServices = normalizedServiceSearch
    ? availableServices.filter((srv) => srv.name?.toLowerCase().includes(normalizedServiceSearch))
    : availableServices;

  const canProceedFromVehicle = !!draft.vehicleId;
  const canProceedFromService = !!selectedServiceObj;
  const canProceedFromVendor = !!selectedVendorObj;
  const canProceedFromSchedule = !!draft.scheduledDate && !!draft.scheduledTimeSlot;

  const handleSaveVehicle = async () => {
    if (!vehicleForm.vehicleType) {
      toast.error('Select a vehicle type');
      return;
    }
    setSavingVehicle(true);
    const result = await dispatch(addVehicle(vehicleForm));
    setSavingVehicle(false);
    if (addVehicle.fulfilled.match(result)) {
      dispatch(updateBookingDraft({ vehicleId: result.payload._id }));
      setAddingVehicle(false);
      setVehicleForm(emptyVehicleForm);
      toast.success('Vehicle added');
    } else {
      toast.error(result.payload || 'Could not add vehicle');
    }
  };

  const handleSelectService = (srv) => {
    setSelectedServiceObj(srv);
    setSelectedVendorObj(null);
    dispatch(updateBookingDraft({ serviceId: srv._id, service: srv, vendorId: null, vendor: null }));
  };

  const handleSelectVendor = (vendor) => {
    setSelectedVendorObj(vendor);
    dispatch(updateBookingDraft({ vendorId: vendor._id, vendor }));
  };

  const handleConfirm = async () => {
    const payload = {
      serviceId: selectedServiceObj._id,
      vendorId: selectedVendorObj._id,
      vehicleId: draft.vehicleId,
      scheduledDate: draft.scheduledDate,
      scheduledTimeSlot: draft.scheduledTimeSlot,
      specialInstructions: draft.specialInstructions,
    };
    const result = await dispatch(submitBooking(payload));
    if (submitBooking.fulfilled.match(result)) {
      navigate(`/booking-confirmed/${result.payload._id}`);
      dispatch(resetBookingDraft());
    } else {
      toast.error(result.payload || 'Could not create booking');
    }
  };

  const selectedVehicle = vehicles.find((v) => v._id === draft.vehicleId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Book Car Wash Service</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select your vehicle, choose a service, pick a nearby shop, and confirm your slot.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center mb-10 overflow-x-auto pb-2">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center flex-1 min-w-[90px] last:flex-none">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => idx < step && setStep(idx)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                  idx < step
                    ? 'bg-volt-500 border-volt-500 text-ink cursor-pointer'
                    : idx === step
                    ? 'border-volt-500 text-volt-400 bg-volt-500/10'
                    : 'border-white/10 text-slate-500'
                }`}
              >
                {idx < step ? <Check size={16} /> : idx + 1}
              </button>
              <span className={`text-xs mt-1.5 font-medium ${idx === step ? 'text-white font-semibold' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 ${idx < step ? 'bg-volt-500' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-ink-card border border-white/10 shadow-card rounded-xl2 p-6 sm:p-8">
        {/* ================= STEP 1: SELECT VEHICLE ================= */}
        {step === 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg text-white">Step 1 — Select your vehicle</h2>
                <p className="text-xs text-slate-400">Choose which vehicle you want to get washed.</p>
              </div>
            </div>

            {vehicles.length > 0 && !addingVehicle && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {vehicles.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => dispatch(updateBookingDraft({ vehicleId: v._id }))}
                    className={`focus-ring text-left border-2 rounded-xl p-4 flex items-start gap-3.5 transition-all ${
                      draft.vehicleId === v._id
                        ? 'border-volt-500 bg-volt-500/10 shadow-sm'
                        : 'border-white/10 hover:border-white/30 bg-ink/40'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${draft.vehicleId === v._id ? 'bg-volt-500 text-ink' : 'bg-white/10 text-slate-300'}`}>
                      <Car size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {v.nickname || `${v.make} ${v.model}`.trim() || v.vehicleType?.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {v.vehicleType?.name} {v.registrationNumber && `· ${v.registrationNumber}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!addingVehicle ? (
              <button
                onClick={() => setAddingVehicle(true)}
                className="focus-ring flex items-center gap-2 text-sm font-semibold text-volt-400 hover:text-volt-300 bg-volt-500/10 border border-volt-500/30 rounded-xl px-4 py-3 w-full justify-center"
              >
                <Plus size={16} /> Add a new vehicle
              </button>
            ) : (
              <div className="border border-white/10 rounded-xl p-5 space-y-4 bg-ink/50">
                <h3 className="text-sm font-semibold text-white">Add vehicle details</h3>
                <Field label="Vehicle type" required>
                  <Select value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm((f) => ({ ...f, vehicleType: e.target.value }))}>
                    <option value="">Select type</option>
                    {vehicleTypes.map((vt) => <option key={vt._id} value={vt._id}>{vt.name}</option>)}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Make">
                    <TextInput placeholder="Tata / Honda" value={vehicleForm.make} onChange={(e) => setVehicleForm((f) => ({ ...f, make: e.target.value }))} />
                  </Field>
                  <Field label="Model">
                    <TextInput placeholder="Nexon / City" value={vehicleForm.model} onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Registration number">
                  <TextInput placeholder="TS09AB1234" value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((f) => ({ ...f, registrationNumber: e.target.value }))} />
                </Field>
                <div className="flex gap-2 pt-2">
                  <Button variant="dark" size="sm" loading={savingVehicle} onClick={handleSaveVehicle}>Save vehicle</Button>
                  <Button variant="ghost" size="sm" onClick={() => setAddingVehicle(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: SELECT SERVICE ================= */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <h2 className="font-display font-semibold text-lg text-white">Step 2 — Select car wash service</h2>
              <p className="text-xs text-slate-400">Choose the wash or detailing package you need.</p>
            </div>

            {!servicesLoading && availableServices.length > 0 && (
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  inputMode="search"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search services (e.g. wash, ceramic, detailing)..."
                  aria-label="Search services"
                  className="w-full bg-ink/40 border border-white/10 rounded-xl2 pl-10 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus-ring"
                />
                {serviceSearch && (
                  <button
                    type="button"
                    onClick={() => setServiceSearch('')}
                    aria-label="Clear service search"
                    className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            )}

            {servicesLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-sm">
                <Loader2 size={18} className="animate-spin text-volt-400" /> Loading available services...
              </div>
            ) : availableServices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No active services found in the catalog.</p>
            ) : filteredServices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                No services found for "{serviceSearch}".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredServices.map((srv) => {
                  const isSelected = selectedServiceObj?._id === srv._id;
                  return (
                    <button
                      key={srv._id}
                      onClick={() => handleSelectService(srv)}
                      className={`focus-ring text-left border-2 rounded-xl p-4 flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-volt-500 bg-volt-500/10 shadow-sm'
                          : 'border-white/10 hover:border-white/30 bg-ink/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-display font-semibold text-white text-base leading-snug">{srv.name}</h3>
                          <span className="text-sm font-bold text-volt-400 whitespace-nowrap">₹{srv.basePrice}</span>
                        </div>
                        {srv.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{srv.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {srv.durationMinutes || 30} mins
                        </span>
                        {isSelected && (
                          <span className="text-volt-400 font-semibold flex items-center gap-0.5">
                            <Check size={12} /> Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: SELECT VENDOR / SHOP ================= */}
        {step === 2 && (
          <div>
            <div className="mb-4">
              <h2 className="font-display font-semibold text-lg text-white">Step 3 — Choose nearby car wash shop</h2>
              <p className="text-xs text-slate-400">
                Showing verified shops offering <strong className="text-volt-400">{selectedServiceObj?.name}</strong>.
              </p>

              {/* Location Status Alert */}
              <div className="mt-3 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Navigation size={13} className={userLocation ? 'text-aqua-400' : 'text-slate-400'} />
                  {locationMessage || (userLocation ? 'Sorted by geographic distance.' : 'Requesting location...')}
                </span>
                {!userLocation && (
                  <button
                    onClick={requestLocation}
                    className="text-aqua-400 hover:text-aqua-300 font-semibold underline text-[11px]"
                  >
                    Use Location
                  </button>
                )}
              </div>
            </div>

            {vendorsLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-sm">
                <Loader2 size={18} className="animate-spin text-volt-400" /> Finding nearby car wash shops...
              </div>
            ) : nearbyVendors.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10 p-6">
                <Store size={32} className="mx-auto text-slate-500 mb-2" />
                <p className="text-sm text-slate-300 font-medium">No nearby shops found for this service.</p>
                <p className="text-xs text-slate-500 mt-1">Try selecting a different service or expanding your search area.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nearbyVendors.map((v) => {
                  const isSelected = selectedVendorObj?._id === v._id;
                  const distanceText = v.distanceKm != null ? `${v.distanceKm} km away` : null;

                  return (
                    <button
                      key={v._id}
                      onClick={() => handleSelectVendor(v)}
                      className={`focus-ring text-left border-2 rounded-xl overflow-hidden flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-volt-500 bg-volt-500/10 shadow-card'
                          : 'border-white/10 hover:border-white/30 bg-ink/40'
                      }`}
                    >
                      <div className="h-28 relative bg-slate-800">
                        <ShopImage src={v.coverImageUrl} alt={v.businessName} />
                        {distanceText && (
                          <span className="absolute top-2 right-2 bg-ink/80 backdrop-blur-md border border-white/15 text-aqua-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Navigation size={9} /> {distanceText}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-semibold text-white text-base leading-snug">{v.businessName}</h3>
                            <RatingStars rating={v.ratingAverage} size={12} />
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                            <MapPin size={12} className="flex-shrink-0 text-slate-400" />
                            <span className="truncate">{v.businessAddress || v.city}</span>
                          </p>
                          {v.workingHours?.start && v.workingHours?.end && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                              <Clock size={11} className="flex-shrink-0" /> {v.workingHours.start} - {v.workingHours.end}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">
                            Starts ₹{v.startingPrice || selectedServiceObj?.basePrice}
                          </span>
                          {isSelected && (
                            <span className="text-xs text-volt-400 font-semibold flex items-center gap-1">
                              <Check size={13} /> Selected Shop
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: SELECT DATE & TIME SLOT ================= */}
        {step === 3 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-white mb-1">Step 4 — Select Date & Available Time Slot</h2>
            <p className="text-xs text-slate-400 mb-5">
              Operating hours for <strong className="text-white">{selectedVendorObj?.businessName}</strong>: {selectedVendorObj?.workingHours?.start || '09:00'} - {selectedVendorObj?.workingHours?.end || '19:00'}
            </p>

            <label className="block text-sm font-medium text-white mb-1.5">Date</label>
            <input
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={draft.scheduledDate || ''}
              onChange={(e) => dispatch(updateBookingDraft({ scheduledDate: e.target.value }))}
              className="focus-ring w-full sm:w-64 bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white mb-5"
            />

            <label className="block text-sm font-medium text-white mb-2">Available Time Slot</label>
            <p className="text-xs text-slate-500 mb-3">
              Slots take into account shop operating hours, service duration ({selectedServiceObj?.durationMinutes || 30} mins), and existing bookings.
            </p>

            {!draft.scheduledDate ? (
              <p className="text-sm text-slate-400 bg-white/5 rounded-lg px-4 py-3 mb-6">
                Choose a date above to see available time slots.
              </p>
            ) : availabilityLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-6 mb-6">
                <Loader2 size={16} className="animate-spin text-volt-400" /> Calculating real-time slot availability...
              </div>
            ) : availability?.isUnavailableDate ? (
              <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-6">
                <CalendarX size={16} className="flex-shrink-0 mt-0.5" />
                This shop is closed on the selected date. Please pick another date.
              </div>
            ) : availability && !availability.isWorkingDay ? (
              <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 mb-6">
                <CalendarX size={16} className="flex-shrink-0 mt-0.5" />
                This shop does not open on the selected day of the week. Please choose another date.
              </div>
            ) : availability && availability.slots.every((s) => !s.available) ? (
              <div className="flex items-start gap-2 text-sm text-slate-400 bg-white/5 rounded-lg px-4 py-3 mb-6">
                <CalendarX size={16} className="flex-shrink-0 mt-0.5" />
                No slots available for this date. Every slot is either booked or past the lead time.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {availability?.slots.map((slot) => (
                  <button
                    key={slot.label}
                    disabled={!slot.available}
                    onClick={() => dispatch(updateBookingDraft({ scheduledTimeSlot: slot.label }))}
                    className={`focus-ring border-2 rounded-lg py-2.5 px-2 text-xs font-medium transition-colors ${
                      !slot.available
                        ? 'border-white/5 text-slate-600 cursor-not-allowed line-through'
                        : draft.scheduledTimeSlot === slot.label
                        ? 'border-volt-500 bg-volt-500/10 text-volt-400 font-semibold'
                        : 'border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}

            <label className="block text-sm font-medium text-white mb-1.5">Special instructions for the shop (optional)</label>
            <textarea
              value={draft.specialInstructions}
              onChange={(e) => dispatch(updateBookingDraft({ specialInstructions: e.target.value }))}
              rows={3}
              className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
              placeholder="e.g. Heavy mud on wheels"
            />
          </div>
        )}

        {/* ================= STEP 5: CONFIRM BOOKING ================= */}
        {step === 4 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-white mb-4">Step 5 — Confirm Booking Details</h2>

            <dl className="divide-y divide-white/10 text-sm bg-ink/40 rounded-xl border border-white/10 p-4">
              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Selected Vehicle</dt>
                <dd className="font-semibold text-white">
                  {selectedVehicle?.nickname || `${selectedVehicle?.make || ''} ${selectedVehicle?.model || ''}`.trim() || selectedVehicle?.vehicleType?.name}
                  {selectedVehicle?.registrationNumber ? ` (${selectedVehicle.registrationNumber})` : ''}
                </dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Service Package</dt>
                <dd className="font-semibold text-white">{selectedServiceObj?.name}</dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Shop / Vendor</dt>
                <dd className="font-semibold text-white text-right">
                  {selectedVendorObj?.businessName}<br />
                  <span className="text-xs text-slate-400 font-normal">{selectedVendorObj?.businessAddress}, {selectedVendorObj?.city}</span>
                </dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Scheduled Date & Time</dt>
                <dd className="font-semibold text-white">{draft.scheduledDate} · {draft.scheduledTimeSlot}</dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Service Duration</dt>
                <dd className="font-semibold text-white">{selectedServiceObj?.durationMinutes || 30} minutes</dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Estimated Amount</dt>
                <dd className="font-bold text-volt-400 text-base">₹{selectedServiceObj?.basePrice}</dd>
              </div>

              <div className="flex justify-between py-3">
                <dt className="text-slate-400 font-medium">Payment Method</dt>
                <dd className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={14} /> Pay Cash at Shop (Unpaid until visit)
                </dd>
              </div>
            </dl>

            <div className="bg-volt-500/10 border border-volt-500/30 rounded-xl p-4 mt-5 text-xs text-slate-300">
              <p className="font-semibold text-volt-400 mb-1">In-Shop Service Policy:</p>
              Please drive your vehicle to the selected shop address at the booked date and time. Pay cash directly at the shop after the service is complete.
            </div>

            {submitError && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3.5 py-2.5 mt-4">{submitError}</p>
            )}
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="focus-ring flex items-center gap-1.5 text-sm font-medium text-slate-400 disabled:opacity-0 px-4 py-2"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <Button
            variant="dark"
            icon={ChevronRight}
            iconPosition="right"
            onClick={goNext}
            disabled={
              (step === 0 && !canProceedFromVehicle) ||
              (step === 1 && !canProceedFromService) ||
              (step === 2 && !canProceedFromVendor) ||
              (step === 3 && !canProceedFromSchedule)
            }
          >
            Continue
          </Button>
        ) : (
          <Button variant="primary" size="lg" loading={submitStatus === 'loading'} onClick={handleConfirm}>
            {submitStatus === 'loading' ? 'Creating Booking...' : 'Confirm & Create Booking'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookService;

