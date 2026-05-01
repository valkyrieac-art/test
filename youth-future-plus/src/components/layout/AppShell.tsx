import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../contexts/auth';
import { BrandMark } from './BrandMark';

export function AppShell() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandMark compact />
            <div className="rounded-full bg-slate-100 px-3 py-1 text-right text-xs font-bold text-slate-600">
              {profile?.role === 'admin' ? '관리자' : '조회'}
            </div>
          </div>
        </div>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
