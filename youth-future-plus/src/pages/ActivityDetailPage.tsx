import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { deleteActivity, getActivity } from '../services/activityService';
import type { Activity } from '../types';
import { formatDate } from '../utils/format';

export function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getActivity(id)
      .then(setActivity)
      .catch((err) => setError(err instanceof Error ? err.message : '활동내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!id || !window.confirm('이 활동내역을 삭제할까요?')) return;
    setDeleting(true);
    try {
      await deleteActivity(id);
      navigate('/activities');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setDeleting(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="활동 상세"
        actions={
          activity ? (
            <AdminOnly>
              <Link to={`/activities/${activity.id}/edit`}>
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
      ) : activity ? (
        <article className="panel overflow-hidden">
          {activity.photo_url ? (
            <img src={activity.photo_url} alt={activity.title} className="h-64 w-full object-cover sm:h-80" />
          ) : null}
          <div className="space-y-5 p-5">
            <div>
              <p className="text-sm font-bold text-brand-700">{formatDate(activity.date)}</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-950">{activity.title}</h1>
            </div>
            <InfoRow label="장소" value={activity.place} />
            <InfoRow label="참석자" value={activity.attendees.join(', ')} />
            <div>
              <p className="field-label">회의/활동 내용</p>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 leading-7 text-slate-700">{activity.content}</p>
            </div>
            <InfoRow label="비고" value={activity.note || '-'} />
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
