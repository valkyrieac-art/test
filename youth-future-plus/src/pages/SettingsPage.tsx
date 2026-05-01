import { FormEvent, useEffect, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../contexts/auth';
import { createBudget, listBudgets } from '../services/budgetService';
import type { Budget } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

export function SettingsPage() {
  const { profile, signOut } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '2026 청소년미래플러스 지원금',
    total_amount: '',
    starts_on: '',
    ends_on: '',
  });

  async function refreshBudgets() {
    setLoading(true);
    try {
      setBudgets(await listBudgets());
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshBudgets();
  }, []);

  async function handleBudgetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createBudget({
        name: form.name,
        total_amount: Number(form.total_amount),
        starts_on: form.starts_on || null,
        ends_on: form.ends_on || null,
        is_active: true,
      });
      setForm({ ...form, total_amount: '' });
      await refreshBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : '예산 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title="설정" description="계정 권한과 지원금 예산을 확인합니다." />
      {error ? <ErrorMessage message={error} /> : null}

      <section className="panel p-5">
        <h2 className="text-lg font-bold text-slate-950">내 계정</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info label="이름" value={profile?.full_name ?? '-'} />
          <Info label="이메일" value={profile?.email ?? '-'} />
          <Info label="권한" value={profile?.role === 'admin' ? '관리자' : '조회 사용자'} />
        </div>
        <Button variant="secondary" className="mt-5 w-full sm:w-auto" onClick={signOut}>
          <LogOut size={18} />
          로그아웃
        </Button>
      </section>

      <AdminOnly>
        <section className="panel p-5">
          <h2 className="text-lg font-bold text-slate-950">예산 등록</h2>
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleBudgetSubmit}>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="field-label">예산명</span>
              <input className="field-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="field-label">총 예산</span>
              <input
                className="field-input"
                type="number"
                min="0"
                step="1"
                value={form.total_amount}
                onChange={(event) => setForm({ ...form, total_amount: event.target.value })}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">시작일</span>
              <input className="field-input" type="date" value={form.starts_on} onChange={(event) => setForm({ ...form, starts_on: event.target.value })} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="field-label">종료일</span>
              <input className="field-input" type="date" value={form.ends_on} onChange={(event) => setForm({ ...form, ends_on: event.target.value })} />
            </label>
            <Button className="sm:col-span-2" type="submit" disabled={saving}>
              <Plus size={18} />
              {saving ? '저장 중...' : '활성 예산으로 등록'}
            </Button>
          </form>
        </section>
      </AdminOnly>

      <section className="panel p-5">
        <h2 className="text-lg font-bold text-slate-950">예산 목록</h2>
        {loading ? (
          <Loading />
        ) : (
          <div className="mt-4 space-y-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{budget.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(budget.starts_on)} - {formatDate(budget.ends_on)}
                    </p>
                  </div>
                  {budget.is_active ? <span className="rounded-full bg-mint-100 px-3 py-1 text-xs font-bold text-mint-600">활성</span> : null}
                </div>
                <p className="mt-3 text-xl font-bold text-brand-700">{formatCurrency(budget.total_amount)}</p>
              </div>
            ))}
            {budgets.length === 0 ? <p className="text-sm text-slate-500">등록된 예산이 없습니다.</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-all font-semibold text-slate-900">{value}</p>
    </div>
  );
}
