import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import { registerVendor, clearAuthError } from '../../features/auth/authSlice';
import Button from '../../components/ui/Button';
import { Field, TextInput, TextArea } from '../../components/ui/FormField';

const PHONE_PATTERN = { value: /^(\+?\d{1,3}[- ]?)?\d{10}$/, message: 'Enter a valid 10-digit mobile number' };
const EMAIL_PATTERN = { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' };

const SectionHeading = ({ children }) => (
  <h3 className="font-display font-semibold text-sm text-volt-400 uppercase tracking-wide pt-2">{children}</h3>
);

const VendorRegister = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user?.role === 'vendor') navigate('/vendor', { replace: true });
  }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      serviceAreas: values.serviceAreas ? values.serviceAreas.split(',').map((s) => s.trim()) : [],
    };
    const result = await dispatch(registerVendor(payload));
    if (registerVendor.fulfilled.match(result)) {
      toast.success('Application submitted! Upload your documents next — admin review is pending.');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex flex-col items-center mb-8 text-center">
        <span className="w-12 h-12 rounded-xl bg-volt-500 text-ink flex items-center justify-center mb-3">
          <Store size={22} />
        </span>
        <h1 className="font-display font-bold text-2xl text-white">Register your business</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Join SplashPoint as a vendor. Your application — including documents you'll upload after this
          step — is reviewed by our team before you can start listing services.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-ink-card border border-white/10 shadow-card rounded-xl2 p-6 sm:p-8 space-y-5">
        <SectionHeading>Owner details</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required error={errors.ownerName?.message}>
            <TextInput placeholder="Jordan Lee" {...register('ownerName', { required: 'Owner name is required' })} />
          </Field>
          <Field label="Mobile number" required error={errors.ownerPhone?.message}>
            <TextInput placeholder="98765 43210" {...register('ownerPhone', { pattern: PHONE_PATTERN })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Personal email" error={errors.ownerEmail?.message} hint="Optional, if different from your login email">
            <TextInput type="email" placeholder="jordan@personal.com" {...register('ownerEmail', { pattern: EMAIL_PATTERN })} />
          </Field>
          <Field label="Owner address" error={errors.ownerAddress?.message}>
            <TextInput placeholder="Your residential address" {...register('ownerAddress')} />
          </Field>
        </div>

        <SectionHeading>Account credentials</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Login email" required error={errors.email?.message}>
            <TextInput type="email" placeholder="you@business.com" {...register('email', { required: 'Email is required', pattern: EMAIL_PATTERN })} />
          </Field>
          <Field label="Login mobile number" required error={errors.phone?.message}>
            <TextInput placeholder="98765 43210" {...register('phone', { required: 'Mobile number is required', pattern: PHONE_PATTERN })} />
          </Field>
        </div>
        <Field label="Password" required error={errors.password?.message}>
          <TextInput
            type="password"
            placeholder="••••••••"
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
          />
        </Field>

        <SectionHeading>Business details</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Business / shop name" required error={errors.businessName?.message}>
            <TextInput placeholder="Shine Auto Care" {...register('businessName', { required: 'Business name is required' })} />
          </Field>
          <Field label="Business registration number" hint="Optional if not yet registered" error={errors.businessRegistrationNumber?.message}>
            <TextInput placeholder="e.g. UDYAM-XX-00-0000000" {...register('businessRegistrationNumber')} />
          </Field>
        </div>

        <Field label="Complete business address" required error={errors.businessAddress?.message}>
          <TextArea rows={2} placeholder="Shop no. / street / area" {...register('businessAddress', { required: 'Business address is required' })} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="City" required error={errors.city?.message}>
            <TextInput placeholder="Hyderabad" {...register('city', { required: 'City is required' })} />
          </Field>
          <Field label="State" error={errors.state?.message}>
            <TextInput placeholder="Telangana" {...register('state')} />
          </Field>
          <Field label="PIN / ZIP code" error={errors.pincode?.message}>
            <TextInput placeholder="500081" {...register('pincode')} />
          </Field>
        </div>

        <Field label="Service areas" hint="Comma-separated localities you cover">
          <TextInput placeholder="Madhapur, Gachibowli" {...register('serviceAreas')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Latitude" hint="Optional — helps customers find you nearby" error={errors.latitude?.message}>
            <TextInput type="number" step="any" placeholder="17.4448" {...register('latitude')} />
          </Field>
          <Field label="Longitude" hint="Optional" error={errors.longitude?.message}>
            <TextInput type="number" step="any" placeholder="78.3498" {...register('longitude')} />
          </Field>
        </div>

        <p className="text-xs text-slate-500 bg-white/5 rounded-lg px-3.5 py-2.5">
          You'll upload your business license, ID proof, and address proof from your vendor dashboard
          right after this step — admin review starts once at least one document is submitted.
        </p>

        {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={status === 'loading'}>
          Submit for approval
        </Button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already a registered vendor?{' '}
        <Link to="/login" className="text-aqua-400 font-semibold hover:text-aqua-300">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default VendorRegister;
