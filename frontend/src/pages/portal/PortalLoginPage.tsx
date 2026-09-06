import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, UserPlus, Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { ThemeToggle } from '../../components/common/ThemeToggle';

const KNOWN_DEMO_TOKENS: Record<string, string> = {
  'procurement@acme.com': 'acme_portal_demo_token_2026',
  'buyer@betatech.io': 'beta_portal_demo_token_2026',
};

export function PortalLoginPage() {
  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regCompany, setRegCompany] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Validation & Server feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Validate email format
  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errors: Record<string, string> = {};

    if (!loginEmail.trim()) {
      errors.loginEmail = 'Business Email is required.';
    } else if (!isValidEmail(loginEmail)) {
      errors.loginEmail = 'Please enter a valid corporate email format.';
    }

    if (!loginPassword) {
      errors.loginPassword = 'Password is required.';
    } else if (loginPassword.length < 6) {
      errors.loginPassword = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/portal/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginEmail.trim().toLowerCase(),
            password: loginPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.message || 'Invalid email or password.');
        return;
      }

      const rawToken = data.data?.portalToken || KNOWN_DEMO_TOKENS[loginEmail.trim().toLowerCase()];
      if (!rawToken) {
        setServerError('Portal session token could not be established.');
        return;
      }

      localStorage.setItem('portalToken', rawToken);
      localStorage.setItem('portalCustomer', JSON.stringify(data.data));
      navigate('/portal/dashboard');
    } catch {
      setServerError('Unable to connect to login service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const errors: Record<string, string> = {};

    if (!regCompany.trim()) {
      errors.regCompany = 'Company Legal Name is required.';
    } else if (regCompany.trim().length < 2) {
      errors.regCompany = 'Company Name must be at least 2 characters.';
    }

    if (!regName.trim()) {
      errors.regName = 'Contact Person Name is required.';
    } else if (regName.trim().length < 2) {
      errors.regName = 'Contact Name must be at least 2 characters.';
    }

    if (!regEmail.trim()) {
      errors.regEmail = 'Corporate Business Email is required.';
    } else if (!isValidEmail(regEmail)) {
      errors.regEmail = 'Please provide a valid corporate email format.';
    }

    if (!regPhone.trim()) {
      errors.regPhone = 'Contact phone number is required.';
    } else if (regPhone.replace(/\D/g, '').length < 10) {
      errors.regPhone = 'Please enter a valid phone number (at least 10 digits).';
    }

    if (!regPassword) {
      errors.regPassword = 'Password is required.';
    } else if (regPassword.length < 6) {
      errors.regPassword = 'Password must be at least 6 characters.';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(regPassword)) {
      errors.regPassword = 'Password must contain at least 1 letter and 1 number.';
    }

    if (!regConfirmPassword) {
      errors.regConfirmPassword = 'Confirm Password is required.';
    } else if (regConfirmPassword !== regPassword) {
      errors.regConfirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/portal/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regName.trim(),
            companyName: regCompany.trim(),
            email: regEmail.trim().toLowerCase(),
            phone: regPhone.trim(),
            password: regPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.message || 'Failed to register account.');
        return;
      }

      const rawToken = data.data?.portalToken;
      if (rawToken) {
        localStorage.setItem('portalToken', rawToken);
        localStorage.setItem('portalCustomer', JSON.stringify(data.data));
        navigate('/portal/dashboard');
      } else {
        setIsRegister(false);
        setLoginEmail(regEmail);
        setLoginPassword(regPassword);
      }
    } catch {
      setServerError('Unable to connect to registration service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Minimal Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-tight">
              DealFlow360
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500">
              Customer Direct Portal
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Centered Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[430px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm transition-colors">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isRegister ? 'Create Customer Account' : 'Customer Portal Login'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {isRegister
                ? 'Join DealFlow360 to browse enterprise catalogs, request quotes, and track orders'
                : 'Sign in to view, negotiate, and confirm your quotes'}
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {!isRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (fieldErrors.loginEmail) setFieldErrors({ ...fieldErrors, loginEmail: '' });
                  }}
                  placeholder="procurement@acme.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                    fieldErrors.loginEmail
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                  }`}
                />
                {fieldErrors.loginEmail && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.loginEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (fieldErrors.loginPassword) setFieldErrors({ ...fieldErrors, loginPassword: '' });
                    }}
                    placeholder="Enter your account password"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                      fieldErrors.loginPassword
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.loginPassword && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.loginPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  value={regCompany}
                  onChange={(e) => {
                    setRegCompany(e.target.value);
                    if (fieldErrors.regCompany) setFieldErrors({ ...fieldErrors, regCompany: '' });
                  }}
                  placeholder="e.g. Tata Technologies Ltd"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                    fieldErrors.regCompany
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                  }`}
                />
                {fieldErrors.regCompany && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.regCompany}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Authorized Contact Person *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (fieldErrors.regName) setFieldErrors({ ...fieldErrors, regName: '' });
                  }}
                  placeholder="e.g. Aarav Mehta"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                    fieldErrors.regName
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                  }`}
                />
                {fieldErrors.regName && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.regName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Corporate Business Email *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    if (fieldErrors.regEmail) setFieldErrors({ ...fieldErrors, regEmail: '' });
                  }}
                  placeholder="e.g. procurement@tatatech.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                    fieldErrors.regEmail
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                  }`}
                />
                {fieldErrors.regEmail && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.regEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Telephone / Mobile *
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => {
                    setRegPhone(e.target.value);
                    if (fieldErrors.regPhone) setFieldErrors({ ...fieldErrors, regPhone: '' });
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                    fieldErrors.regPhone
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                  }`}
                />
                {fieldErrors.regPhone && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.regPhone}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Create Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (fieldErrors.regPassword) setFieldErrors({ ...fieldErrors, regPassword: '' });
                    }}
                    placeholder="Min. 6 chars (letters & numbers)"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                      fieldErrors.regPassword
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.regPassword && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.regPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      if (fieldErrors.regConfirmPassword) setFieldErrors({ ...fieldErrors, regConfirmPassword: '' });
                    }}
                    placeholder="Re-enter your password"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs border bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none transition ${
                      fieldErrors.regConfirmPassword
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-zinc-800 focus:border-slate-900 dark:focus:border-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.regConfirmPassword && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                    {fieldErrors.regConfirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Customer Account</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle between Sign In and Create Account */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 text-center">
            {!isRegister ? (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setServerError('');
                    setFieldErrors({});
                  }}
                  className="font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setServerError('');
                    setFieldErrors({});
                  }}
                  className="font-semibold text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  Sign in to existing account
                </button>
              </p>
            )}
          </div>

          {/* Switch to workspace */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-center">
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="text-[11px] text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition cursor-pointer"
            >
              Employee Workspace Login →
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-slate-400 dark:text-zinc-600">
        DealFlow360 · Customer Direct Commerce Portal
      </footer>
    </div>
  );
}
