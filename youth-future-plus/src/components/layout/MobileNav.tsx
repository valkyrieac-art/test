import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { navItems } from './navItems';

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold',
                  isActive ? 'text-brand-700' : 'text-slate-500',
                )
              }
            >
              <Icon size={21} strokeWidth={2.2} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
