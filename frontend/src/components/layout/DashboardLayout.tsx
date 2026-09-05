import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
