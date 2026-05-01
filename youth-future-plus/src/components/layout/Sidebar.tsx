import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut } from 'lucide-react';
import { navItems } from './navItems';
import { useAuth } from '../../contexts/auth';
import { Button } from '../ui/Button';
import { BrandMark } from './BrandMark';

export function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
      <BrandMark />
      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-12 items-center gap-3 rounded-lg px-4 text-base font-semibold transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
                )
              }
            >
              <Icon size={21} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="rounded-lg bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{profile?.full_name ?? '사용자'}</p>
        <p className="mt-1 break-all text-xs text-slate-500">{profile?.email}</p>
        <p className="mt-2 inline-flex rounded-full bg-mint-100 px-2 py-1 text-xs font-bold text-mint-600">
          {profile?.role === 'admin' ? '관리자' : '조회 사용자'}
        </p>
        <Button variant="secondary" className="mt-4 w-full" onClick={signOut}>
          <LogOut size={18} />
          로그아웃
        </Button>
      </div>
    </aside>
  );
}
