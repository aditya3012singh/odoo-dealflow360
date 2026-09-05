import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import { ThemeToggle } from '../../components/common/ThemeToggle';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_USERS = [
  { label: 'Sales Rep', email: 'rep@dealflow360.com' },
  { label: 'Manager', email: 'manager@dealflow360.com' },
  { label: 'Finance', email: 'finance@dealflow360.com' },
  { label: 'Admin', email: 'admin@dealflow360.com' },
];

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: 'password123' },
  });

  const currentEmail = watch('email');

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

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
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

          {/* Quick Demo Fill Buttons */}
          <div className="mb-5">
            <div className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-2 text-center uppercase tracking-wider">
              Quick demo login
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillDemo(u.email)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                    currentEmail === u.email
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-black'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@dealflow360.com"
                className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
              />
              {errors.email && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 rounded-lg text-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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
