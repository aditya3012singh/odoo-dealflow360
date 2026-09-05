import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, User } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

export function PortalLayout() {
  const navigate = useNavigate();
  const customer = JSON.parse(localStorage.getItem('portalCustomer') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('portalToken');
    localStorage.removeItem('portalCustomer');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-200">
      {/* Portal Navbar */}
      <header className="bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-white dark:text-black" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">DealFlow360</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
              Customer Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
              <span className="text-xs text-slate-600 dark:text-zinc-400 hidden sm:inline">{customer?.companyName || 'Customer'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 bg-slate-50 dark:bg-zinc-950 transition-colors">
        <Outlet />
      </main>

      <footer className="text-center py-4 text-[11px] text-slate-400 dark:text-zinc-600 border-t border-slate-200 dark:border-zinc-800 transition-colors">
        DealFlow360 Customer Portal · Secure & Encrypted
      </footer>
    </div>
  );
}
