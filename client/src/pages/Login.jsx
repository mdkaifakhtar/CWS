import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BrandLogo from '../components/BrandLogo';
import { motion } from 'framer-motion';
import { loginUser, clearAuthError } from '../features/auth/authSlice';
import Button from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/FormField';

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) return;
    if (location.state?.from?.pathname) {
      navigate(location.state.from.pathname, { replace: true });
      return;
    }
    const roleHome = user?.role === 'admin' ? '/admin' : user?.role === 'vendor' ? '/vendor' : '/dashboard';
    navigate(roleHome, { replace: true });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const onSubmit = async (values) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.data.name.split(' ')[0]}`);
    } else {
      toast.error(result.payload || 'Login failed');
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
          <h1 className="font-display font-bold text-2xl text-white">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Log in to manage your bookings</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-ink-card border border-white/10 shadow-card rounded-[1.5rem] p-6 sm:p-8 space-y-5"
        >
          <Field label="Email or mobile number" error={errors.identifier?.message}>
            <TextInput placeholder="you@example.com" {...register('identifier', { required: 'This field is required' })} />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <TextInput type="password" placeholder="••••••••" {...register('password', { required: 'Password is required' })} />
          </Field>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" variant="dark" size="lg" className="w-full" loading={status === 'loading'}>
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          New to SplashPoint?{' '}
          <Link to="/register" className="text-aqua-400 font-semibold hover:text-aqua-300">
            Create an account
          </Link>
        </p>

        <div className="mt-6 bg-ink-card border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-400">
          Demo login — email: <span className="font-mono text-white">demo.user@example.com</span> · password:{' '}
          <span className="font-mono text-white">password123</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
