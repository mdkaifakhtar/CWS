import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';
import { motion } from 'framer-motion';
import { registerUser, clearAuthError } from '../features/auth/authSlice';
import Button from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/FormField';

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const onSubmit = async (values) => {
    const { confirmPassword, ...payload } = values;
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Welcome to SplashPoint.');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size="lg" linkTo="/" className="mb-3" />
          <h1 className="font-display font-bold text-2xl text-white">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Book your first car wash in minutes</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-ink-card border border-white/10 shadow-card rounded-[1.5rem] p-6 sm:p-8 space-y-4"
        >
          <Field label="Full name" error={errors.name?.message}>
            <TextInput placeholder="Jordan Lee" {...register('name', { required: 'Name is required' })} />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <TextInput
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
          </Field>

          <Field label="Mobile number" error={errors.phone?.message}>
            <TextInput
              placeholder="98765 43210"
              {...register('phone', {
                required: 'Mobile number is required',
                minLength: { value: 10, message: 'Enter a valid mobile number' },
              })}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <TextInput
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
          </Field>

          <Field label="Confirm password" error={errors.confirmPassword?.message}>
            <TextInput
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
            />
          </Field>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" variant="dark" size="lg" className="w-full" loading={status === 'loading'}>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-aqua-400 font-semibold hover:text-aqua-300">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
