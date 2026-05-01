import type { ReactNode } from 'react';

export function StatCard({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {icon ? <div className="rounded-lg bg-brand-50 p-2 text-brand-700">{icon}</div> : null}
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
