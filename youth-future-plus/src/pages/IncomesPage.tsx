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
import { listIncomes } from '../services/incomeService';
import type { Income } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { getIncomeByCategory, getMonthlyIncomes, getTotalIncome } from '../utils/statistics';

export function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      listIncomes(search)
        .then(setIncomes)
        .catch((err) => setError(err instanceof Error ? err.message : '수입내역을 불러오지 못했습니다.'))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [search]);

  const totalIncome = useMemo(() => getTotalIncome(incomes), [incomes]);
  const categorySummary = useMemo(() => getIncomeByCategory(incomes).filter((item) => item.amount > 0), [incomes]);
  const monthlySummary = useMemo(() => getMonthlyIncomes(incomes), [incomes]);

  return (
    <div className="page-shell">
      <PageHeader
        title="수입내역"
        description="지원금, 후원금, 환불 등 들어온 금액을 관리합니다."
        actions={
          <AdminOnly>
            <Link to="/incomes/new">
              <Button>
                <Plus size={19} />
                등록
              </Button>
            </Link>
          </AdminOnly>
        }
      />
      <SearchBar value={search} onChange={setSearch} placeholder="입금처, 목적, 분류 검색" />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label="총 수입" value={formatCurrency(totalIncome)} />
            <StatCard label="수입 건수" value={`${incomes.length}건`} />
            <StatCard label="최근 수입" value={incomes[0] ? formatCurrency(incomes[0].amount) : formatCurrency(0)} />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <SummaryPanel title="분류별 수입 합계" items={categorySummary.map((item) => [item.name, formatCurrency(item.amount)])} />
            <SummaryPanel title="월별 수입 합계" items={monthlySummary.map((item) => [item.month, formatCurrency(item.amount)])} />
          </section>

          {incomes.length === 0 ? (
            <EmptyState title="수입내역이 없습니다." description="관리자 계정으로 로그인하면 새 수입을 등록할 수 있습니다." />
          ) : (
            <section className="grid gap-3 lg:grid-cols-2">
              {incomes.map((income) => (
                <Link key={income.id} to={`/incomes/${income.id}`} className="panel block p-4 transition hover:border-mint-200 hover:shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-mint-600">{formatDate(income.received_on)}</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-950">{income.purpose}</h2>
                    </div>
                    <p className="shrink-0 text-lg font-bold text-mint-600">{formatCurrency(income.amount)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {income.source} · {income.category}
                  </p>
                  {income.note ? <p className="mt-3 text-sm text-slate-600">{income.note}</p> : null}
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
