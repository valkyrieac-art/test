import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../contexts/auth';

export function AppShell() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <p className="text-sm font-semibold text-brand-700">청소년미래플러스</p>
          <p className="text-xs text-slate-500">{profile?.full_name ?? profile?.email ?? '사용자'}</p>
        </div>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
