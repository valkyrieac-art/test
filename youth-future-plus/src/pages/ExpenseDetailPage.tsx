import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { deleteExpense, getExpense } from '../services/expenseService';
import type { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

export function ExpenseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getExpense(id)
      .then(setExpense)
      .catch((err) => setError(err instanceof Error ? err.message : '지출내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id || !window.confirm('이 지출내역을 삭제할까요?')) return;
    setDeleting(true);
    try {
      await deleteExpense(id);
      navigate('/expenses');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setDeleting(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="지출 상세"
        actions={
          expense ? (
            <AdminOnly>
              <Link to={`/expenses/${expense.id}/edit`}>
                <Button variant="secondary">
                  <Pencil size={18} />
                  수정
                </Button>
              </Link>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={18} />
                삭제
              </Button>
            </AdminOnly>
          ) : null
        }
      />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : expense ? (
        <article className="panel overflow-hidden">
          {expense.receipt_url ? (
            <img src={expense.receipt_url} alt="영수증" className="h-64 w-full object-cover sm:h-80" />
          ) : null}
          <div className="space-y-5 p-5">
            <div>
              <p className="text-sm font-bold text-brand-700">{formatDate(expense.spent_on)}</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">{expense.purpose}</h1>
              <p className="mt-2 text-3xl font-bold text-slate-950">{formatCurrency(expense.amount)}</p>
            </div>
            <InfoRow label="사용처" value={expense.vendor} />
            <InfoRow label="지출분류" value={expense.category} />
            <InfoRow label="비고" value={expense.note || '-'} />
          </div>
        </article>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="mt-2 text-base text-slate-800">{value}</p>
    </div>
  );
}
