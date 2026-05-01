import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { listActivities } from '../services/activityService';
import { listExpenses } from '../services/expenseService';
import { listIncomes } from '../services/incomeService';
import type { Activity, Expense, Income } from '../types';
import { formatCurrency } from '../utils/format';
import {
  getActivityByAttendee,
  getExpenseByCategory,
  getIncomeByCategory,
  getMonthlyActivities,
  getMonthlyExpenses,
  getMonthlyIncomes,
} from '../utils/statistics';

const chartColors = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];

export function StatsPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listActivities(), listExpenses(), listIncomes()])
      .then(([activityData, expenseData, incomeData]) => {
        setActivities(activityData);
        setExpenses(expenseData);
        setIncomes(incomeData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '통계 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const monthlyActivities = useMemo(() => getMonthlyActivities(activities), [activities]);
  const monthlyExpenses = useMemo(() => getMonthlyExpenses(expenses), [expenses]);
  const monthlyIncomes = useMemo(() => getMonthlyIncomes(incomes), [incomes]);
  const categoryExpenses = useMemo(() => getExpenseByCategory(expenses).filter((item) => item.amount > 0), [expenses]);
  const categoryIncomes = useMemo(() => getIncomeByCategory(incomes).filter((item) => item.amount > 0), [incomes]);
  const attendeeActivities = useMemo(() => getActivityByAttendee(activities), [activities]);

  return (
    <div className="page-shell">
      <PageHeader title="통계" description="활동 참여, 수입, 지출 흐름을 월별·분류별로 확인합니다." />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title="월별 활동 횟수">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyActivities}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="활동 횟수" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="월별 수입금액">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyIncomes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Number(value) / 10000}만`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" name="수입금액" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="월별 지출금액">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Number(value) / 10000}만`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" name="지출금액" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="분류별 수입금액">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryIncomes} dataKey="amount" nameKey="name" outerRadius={92} label>
                  {categoryIncomes.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="분류별 지출금액">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryExpenses} dataKey="amount" nameKey="name" outerRadius={92} label>
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="참석자별 활동 참여 횟수">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendeeActivities} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={70} />
                <Tooltip />
                <Bar dataKey="count" name="참여 횟수" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </section>
      )}
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel p-4">
      <h2 className="mb-4 text-base font-bold text-slate-950">{title}</h2>
      {children}
    </div>
  );
}
