import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { SearchBar } from '../components/SearchBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { INITIAL_ACTIVITY_BUDGET } from '../config/budget';
import { listExpenses } from '../services/expenseService';
import type { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { getExpenseByCategory, getMonthlyExpenses, getTotalExpense } from '../utils/statistics';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      listExpenses(search)
        .then(setExpenses)
        .catch((err) => setError(err instanceof Error ? err.message : '지출내역을 불러오지 못했습니다.'))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [search]);

  const totalExpense = useMemo(() => getTotalExpense(expenses), [expenses]);
  const remainingBudget = INITIAL_ACTIVITY_BUDGET - totalExpense;
  const categorySummary = useMemo(() => getExpenseByCategory(expenses).filter((item) => item.amount > 0), [expenses]);
  const monthlySummary = useMemo(() => getMonthlyExpenses(expenses), [expenses]);

  return (
    <div className="page-shell">
      <PageHeader
        title="지출내역"
        description="최초 활동비 2,500,000원 안에서 지출만 등록하고 관리합니다."
        actions={
          <AdminOnly>
            <Link to="/expenses/new">
              <Button>
                <Plus size={19} />
                등록
              </Button>
            </Link>
          </AdminOnly>
        }
      />
      <SearchBar value={search} onChange={setSearch} placeholder="사용처, 목적, 분류 검색" />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard className="col-span-2 md:col-span-1" label="활동비 예산" value={formatCurrency(INITIAL_ACTIVITY_BUDGET)} />
            <StatCard label="총 지출" value={formatCurrency(totalExpense)} />
            <StatCard label="남은 예산" value={formatCurrency(remainingBudget)} />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <SummaryPanel title="분류별 지출 합계" items={categorySummary.map((item) => [item.name, formatCurrency(item.amount)])} />
            <SummaryPanel title="월별 지출 합계" items={monthlySummary.map((item) => [item.month, formatCurrency(item.amount)])} />
          </section>

          {expenses.length === 0 ? (
            <EmptyState title="지출내역이 없습니다." description="관리자 계정으로 로그인하면 새 지출을 등록할 수 있습니다." />
          ) : (
            <section className="grid gap-3 lg:grid-cols-2">
              {expenses.map((expense) => (
                <Link key={expense.id} to={`/expenses/${expense.id}`} className="panel block p-4 transition hover:border-brand-200 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand-700">{formatDate(expense.spent_on)}</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-950">{expense.purpose}</h2>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-slate-950">{formatCurrency(expense.amount)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {expense.vendor} · {expense.category}
                  </p>
                  {expense.note ? <p className="mt-3 text-sm text-slate-600">{expense.note}</p> : null}
                </Link>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SummaryPanel({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div className="panel p-4">
      <h2 className="mb-3 text-base font-bold text-slate-950">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">표시할 데이터가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {items.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">{label}</span>
              <span className="font-bold text-slate-950">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
