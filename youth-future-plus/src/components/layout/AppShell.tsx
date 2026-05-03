import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../contexts/auth';
import { BrandMark } from './BrandMark';

export function AppShell() {
  const { profile, loginId } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const accountLabel = `${profile?.full_name ?? '참여자'} (${loginId ?? '-'})`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="lg:pl-72">
        <div className="sticky top-0 z-20 hidden border-b border-slate-200 bg-white/95 px-8 py-4 backdrop-blur lg:block">
          <div className="flex items-center justify-end">
            <UserBadge name={profile?.full_name ?? '사용자'} role={isAdmin ? '관리자' : '참여자'} />
          </div>
        </div>
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <BrandMark compact />
              {!isAdmin ? <p className="mt-1 truncate text-xs font-bold text-slate-600">{accountLabel}</p> : null}
            </div>
            <UserBadge name={profile?.full_name ?? '사용자'} role={isAdmin ? '관리자' : '참여자'} compact />
          </div>
        </div>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}

function UserBadge({ name, role, compact = false }: { name: string; role: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? 'min-w-0 rounded-full bg-slate-100 px-3 py-1 text-right text-xs font-bold text-slate-600'
          : 'min-w-0 rounded-full bg-slate-100 px-4 py-2 text-right text-sm font-bold text-slate-700'
      }
    >
      <span className={compact ? 'block max-w-32 truncate' : 'block max-w-56 truncate'}>{name}</span>
      <span className={compact ? 'block text-[10px] text-slate-500' : 'block text-xs text-slate-500'}>{role}</span>
    </div>
  );
}
