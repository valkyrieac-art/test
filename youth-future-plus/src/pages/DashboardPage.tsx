import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CircleDollarSign, ClipboardList, Wallet } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { INITIAL_ACTIVITY_BUDGET } from '../config/budget';
import { listActivities } from '../services/activityService';
import { listExpenses } from '../services/expenseService';
import type { Activity, Expense } from '../types';
import { compactText, formatCurrency, formatDate } from '../utils/format';
import { getThisMonthActivities, getTotalExpense } from '../utils/statistics';

export function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listActivities(), listExpenses()])
      .then(([activityData, expenseData]) => {
        setActivities(activityData);
        setExpenses(expenseData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '대시보드 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const totalExpense = useMemo(() => getTotalExpense(expenses), [expenses]);
  const remainingBudget = INITIAL_ACTIVITY_BUDGET - totalExpense;

  return (
    <div className="page-shell">
      <PageHeader
        title="대시보드"
        description="활동, 지출, 남은 예산을 한눈에 확인합니다."
        actions={
          <AdminOnly>
            <Link to="/activities/new">
              <Button>활동 등록</Button>
            </Link>
            <Link to="/expenses/new">
              <Button variant="secondary">지출 등록</Button>
            </Link>
          </AdminOnly>
        }
      />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="전체 활동" value={`${activities.length}회`} icon={<ClipboardList size={20} />} />
            <StatCard label="이번 달 활동" value={`${getThisMonthActivities(activities)}회`} icon={<CalendarDays size={20} />} />
            <StatCard className="col-span-2 md:col-span-1" label="활동비 예산" value={formatCurrency(INITIAL_ACTIVITY_BUDGET)} icon={<Wallet size={20} />} />
            <StatCard label="총 지출" value={formatCurrency(totalExpense)} icon={<CircleDollarSign size={20} />} />
            <StatCard label="남은 예산" value={formatCurrency(remainingBudget)} icon={<Wallet size={20} />} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <RecentPanel title="최근 활동내역" empty="등록된 활동이 없습니다.">
              {activities.slice(0, 5).map((activity) => (
                <Link key={activity.id} to={`/activities/${activity.id}`} className="block rounded-lg border border-slate-100 p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900">{activity.title}</p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm text-slate-500">{formatDate(activity.date)}</span>
                      <span className="rounded-full bg-mint-50 px-2 py-0.5 text-xs font-bold text-mint-600">참여 {activity.attendees.length}명</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{activity.place}</p>
                  <p className="mt-2 text-sm text-slate-600">{compactText(activity.content)}</p>
                </Link>
              ))}
            </RecentPanel>

            <RecentPanel title="최근 지출내역" empty="등록된 지출이 없습니다.">
              {expenses.slice(0, 5).map((expense) => (
                <Link key={expense.id} to={`/expenses/${expense.id}`} className="block rounded-lg border border-slate-100 p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900">{expense.purpose}</p>
                    <span className="shrink-0 font-bold text-brand-700">{formatCurrency(expense.amount)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(expense.spent_on)} · {expense.vendor} · {expense.category}
                  </p>
                </Link>
              ))}
            </RecentPanel>
          </section>
        </>
      )}
    </div>
  );
}

function RecentPanel({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="panel p-4">
      <h2 className="mb-3 text-lg font-bold text-slate-950">{title}</h2>
      <div className="flex flex-col gap-3">{hasItems ? children : <EmptyState title={empty} />}</div>
    </div>
  );
}
