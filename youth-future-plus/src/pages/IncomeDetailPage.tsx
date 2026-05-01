import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { deleteIncome, getIncome } from '../services/incomeService';
import type { Income } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

export function IncomeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [income, setIncome] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getIncome(id)
      .then(setIncome)
      .catch((err) => setError(err instanceof Error ? err.message : '수입내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id || !window.confirm('이 수입내역을 삭제할까요?')) return;
    setDeleting(true);
    try {
      await deleteIncome(id);
      navigate('/incomes');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setDeleting(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="수입 상세"
        actions={
          income ? (
            <AdminOnly>
              <Link to={`/incomes/${income.id}/edit`}>
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
      ) : income ? (
        <article className="panel overflow-hidden">
          {income.document_url ? (
            <img src={income.document_url} alt="수입 증빙" className="h-64 w-full object-cover sm:h-80" />
          ) : null}
          <div className="space-y-5 p-5">
            <div>
              <p className="text-sm font-bold text-mint-600">{formatDate(income.received_on)}</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">{income.purpose}</h1>
              <p className="mt-2 text-3xl font-bold text-mint-600">{formatCurrency(income.amount)}</p>
            </div>
            <InfoRow label="입금처" value={income.source} />
            <InfoRow label="수입분류" value={income.category} />
            <InfoRow label="비고" value={income.note || '-'} />
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
