import type { ReactNode } from 'react';
import clsx from 'clsx';

export function StatCard({ label, value, icon, className }: { label: string; value: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {icon ? <div className="rounded-lg bg-brand-50 p-2 text-brand-700">{icon}</div> : null}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
