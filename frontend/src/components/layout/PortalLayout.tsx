import { useState } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  LogOut,
  ShoppingBag,
  User,
  Menu,
  X,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

const NAV_LINKS = [
  { id: 'storefront', label: 'Storefront', path: '/portal/dashboard?tab=storefront' },
  { id: 'quotations', label: 'Quotations', path: '/portal/dashboard?tab=quotations' },
  { id: 'orders', label: 'Orders & Tracking', path: '/portal/dashboard?tab=orders' },
  { id: 'billing', label: 'Billing & Subscriptions', path: '/portal/dashboard?tab=billing' },
  // { id: 'profile', label: 'Profile', path: '/portal/profile' },
];

export function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const customer = JSON.parse(localStorage.getItem('portalCustomer') || '{}');
  const activeTab = searchParams.get('tab') || 'storefront';
  const isQuotationDetail = location.pathname.includes('/portal/quotations/');

  const handleLogout = () => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalCustomer');
    navigate('/login');
  };

  const handleLinkClick = (link: typeof NAV_LINKS[0]) => {
    navigate(link.path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors duration-200">
      {/* Full Width Elevated Navbar */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-zinc-800/90 transition-colors shadow-xs">
        <div className="w-full px-5 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Left: Brand / Logo */}
          <div
            onClick={() => navigate('/portal/dashboard?tab=storefront')}
            className="flex items-center gap-3 cursor-pointer shrink-0 w-56 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 dark:bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-tight">
                DealFlow360
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-zinc-500">
                Customer Direct
              </span>
            </div>
          </div>

          {/* Center: Simple Clickable Text Links */}
          <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-10 flex-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.id === 'profile'
                  ? location.pathname === '/portal/profile'
                  : !isQuotationDetail && location.pathname === '/portal/dashboard' && activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className={`relative py-1 text-[15px] transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-slate-950 dark:text-white font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-medium'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-slate-900 dark:bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-3.5 shrink-0 w-56">
            <ThemeToggle />

            {/* Profile Quick Link Pill */}
            <button
              onClick={() => navigate('/portal/profile')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition cursor-pointer"
              title="View Company Profile"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {customer?.companyName ? customer.companyName.charAt(0).toUpperCase() : 'E'}
              </div>
              <div className="hidden lg:block text-left leading-none">
                <p className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[105px]">
                  {customer?.companyName || 'Profile'}
                </p>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {customer?.tier || 'Gold'} Tier
                </span>
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900/50 transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Simple Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-6 py-4 space-y-3 shadow-lg animate-in slide-in-from-top duration-150">
            <div className="space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  link.id === 'profile'
                    ? location.pathname === '/portal/profile'
                    : !isQuotationDetail && location.pathname === '/portal/dashboard' && activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-900'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[180px]">{customer?.companyName || 'Enterprise Client'}</span>
              <button
                onClick={handleLogout}
                className="text-rose-600 hover:underline flex items-center gap-1 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 bg-slate-50 dark:bg-zinc-950 transition-colors">
        <Outlet />
      </main>

      {/* Clean, Simple Footer */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 dark:text-zinc-600 border-t border-slate-200 dark:border-zinc-800 transition-colors">
        DealFlow360 Customer Portal · Enterprise Direct Commerce
      </footer>
    </div>
  );
}
