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
import { listActivities } from '../services/activityService';
import type { Activity } from '../types';
import { compactText, formatDate } from '../utils/format';

export function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      listActivities(search)
        .then(setActivities)
        .catch((err) => setError(err instanceof Error ? err.message : '활동내역을 불러오지 못했습니다.'))
        .finally(() => setLoading(false));
    }, 180);

    return () => window.clearTimeout(timer);
  }, [search]);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [activities],
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="활동내역"
        description="회의와 활동 기록을 날짜순으로 관리합니다."
        actions={
          <AdminOnly>
            <Link to="/activities/new">
              <Button>
                <Plus size={19} />
                등록
              </Button>
            </Link>
          </AdminOnly>
        }
      />
      <SearchBar value={search} onChange={setSearch} placeholder="제목, 장소, 내용 검색" />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : sortedActivities.length === 0 ? (
        <EmptyState title="활동내역이 없습니다." description="관리자 계정으로 로그인하면 새 활동을 등록할 수 있습니다." />
      ) : (
        <section className="grid gap-3 lg:grid-cols-2">
          {sortedActivities.map((activity) => (
            <Link key={activity.id} to={`/activities/${activity.id}`} className="panel block p-4 transition hover:border-brand-200 hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-700">{formatDate(activity.date)}</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-950">{activity.title}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-mint-600">
                  참여 {activity.attendees.length}명
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{activity.place}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{compactText(activity.content, 120)}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
