import { Sparkles } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-mint-500 text-white shadow-soft">
        <Sparkles size={22} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mint-600">Youth Challenge Project</p>
        <h1 className={compact ? 'truncate text-base font-black text-slate-950 sm:text-lg' : 'text-xl font-black text-slate-950'}>
          청소년미래도전프로젝트
        </h1>
        {!compact ? <p className="text-sm font-semibold text-slate-500">활동관리 시스템</p> : null}
      </div>
    </div>
  );
}
