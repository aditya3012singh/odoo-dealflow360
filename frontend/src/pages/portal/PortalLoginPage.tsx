import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../../components/common/ThemeToggle';

const KNOWN_DEMO_TOKENS: Record<string, string> = {
  'procurement@acme.com': 'acme_portal_demo_token_2026',
  'buyer@betatech.io': 'beta_portal_demo_token_2026',
};

const DEMO_ACCOUNTS = [
  { label: 'Acme Global', email: 'procurement@acme.com', company: 'Acme Global Industries' },
  { label: 'Beta Technologies', email: 'buyer@betatech.io', company: 'Beta Technologies Corp' },
];

export function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!companyName.trim()) {
      setError('Please enter your company name.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/portal/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            companyName: companyName.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid email or company name.');
        return;
      }

      const rawToken = KNOWN_DEMO_TOKENS[email.trim().toLowerCase()];
      if (!rawToken) {
        setError('Portal token not found. Please contact your sales rep.');
        return;
      }

      localStorage.setItem('portalToken', rawToken);
      localStorage.setItem('portalCustomer', JSON.stringify(data.data));
      navigate('/portal/dashboard');
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoCompany: string) => {
    setEmail(demoEmail);
    setCompanyName(demoCompany);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-black text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Minimal Top Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white">
            DealFlow360
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
            Customer Portal
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Centered Minimal Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[380px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-7 shadow-sm transition-colors">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Customer Portal
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Sign in to view, negotiate, and confirm your quotes
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="mb-5">
            <div className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 mb-2 text-center uppercase tracking-wider">
              Quick demo login
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => fillDemo(d.email, d.company)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition cursor-pointer ${
                    email === d.email
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-black'
                      : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {d.label}
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="procurement@acme.com"
                className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Global Industries"
                className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to workspace */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-850 text-center">
            <button
              type="button"
              onClick={() => navigate('/workspace')}
              className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              Employee Workspace Login →
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-slate-400 dark:text-zinc-600">
        DealFlow360 · Customer Portal
      </footer>
    </div>
  );
}
