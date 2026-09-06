import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import { ThemeToggle } from '../../components/common/ThemeToggle';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Corporate email address is required')
    .email('Please enter a valid corporate email format (e.g. rep@dealflow360.com)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const rawFrom = (location.state as any)?.from?.pathname;
  const from = rawFrom && rawFrom !== '/workspace' && rawFrom !== '/login' ? rawFrom : '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onSubmit = async (data: LoginFormData) => {
    dispatch(login(data));
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Minimal Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-xs">
            DF
          </div>
          <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
            DealFlow360
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
            Workspace
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Centered Minimal Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[380px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-7 shadow-sm transition-colors">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign in to Workspace
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Sales operations & revenue lifecycle platform
            </p>
          </div>


          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Corporate Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@dealflow360.com"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                  errors.email
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                }`}
              />
              {errors.email && (
                <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Workspace Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter workspace password"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                    errors.password
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-600 dark:text-rose-400 text-[11px] mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to customer portal */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-850 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Customer Portal Login →
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-slate-400 dark:text-zinc-600">
        DealFlow360 · Sales Operations
      </footer>
    </div>
  );
}
