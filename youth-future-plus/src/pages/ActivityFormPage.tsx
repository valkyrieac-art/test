import { FormEvent, KeyboardEvent, useEffect, useState, type ReactNode } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { createActivity, getActivity, updateActivity } from '../services/activityService';
import { uploadAttachment } from '../services/storageService';
import type { ActivityInput } from '../types';

const today = new Date().toISOString().slice(0, 10);

export function ActivityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    date: today,
    place: '',
    title: '',
    content: '',
    photo_url: '',
    note: '',
  });
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getActivity(id)
      .then((activity) => {
        setForm({
          date: activity.date,
          place: activity.place,
          title: activity.title,
          content: activity.content,
          photo_url: activity.photo_url ?? '',
          note: activity.note ?? '',
        });
        setParticipants(activity.attendees ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '활동내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <PageHeader title="권한 없음" />
        <ErrorMessage message="관리자만 활동내역을 작성하거나 수정할 수 있습니다." />
      </div>
    );
  }

  function addParticipant() {
    const name = participantName.trim().replace(/\s+/g, ' ');
    if (!name) return;
    setParticipants((current) => (current.some((item) => item === name) ? current : [...current, name]));
    setParticipantName('');
  }

  function handleParticipantKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addParticipant();
  }

  function removeParticipant(name: string) {
    setParticipants((current) => current.filter((item) => item !== name));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const attendeeList = participants.map((name) => name.trim()).filter(Boolean);
      if (attendeeList.length === 0) {
        setError('참여인원을 1명 이상 등록하세요.');
        setSaving(false);
        return;
      }

      let photoUrl = form.photo_url || null;
      if (file) photoUrl = await uploadAttachment(file, 'activities');

      const input: ActivityInput = {
        date: form.date,
        attendees: attendeeList,
        place: form.place,
        title: form.title,
        content: form.content,
        photo_url: photoUrl,
        note: form.note || null,
      };

      const saved = id ? await updateActivity(id, input) : await createActivity(input);
      navigate(`/activities/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title={isEdit ? '활동내역 수정' : '활동내역 등록'} />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <form className="panel flex flex-col gap-5 p-5" onSubmit={handleSubmit}>
          <FormField label="날짜">
            <input className="field-input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </FormField>
          <FormField label="참여인원">
            <div className="flex gap-2">
              <input
                className="field-input min-w-0 flex-1"
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                onKeyDown={handleParticipantKeyDown}
                placeholder="이름 입력 후 추가"
              />
              <Button type="button" variant="secondary" onClick={addParticipant}>
                <UserPlus size={18} />
                추가
              </Button>
            </div>
            <div className="flex flex-col gap-1 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>등록된 참여인원 {participants.length}명</span>
              <span>중복 이름은 한 번만 저장됩니다.</span>
            </div>
            {participants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {participants.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-3 py-1 text-sm font-bold text-mint-700">
                    {name}
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-mint-700 hover:bg-mint-100"
                      onClick={() => removeParticipant(name)}
                      aria-label={`${name} 삭제`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </FormField>
          <FormField label="장소">
            <input className="field-input" value={form.place} onChange={(event) => setForm({ ...form, place: event.target.value })} required />
          </FormField>
          <FormField label="회의/활동 제목">
            <input className="field-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </FormField>
          <FormField label="회의내용 또는 활동내용">
            <textarea
              className="field-input min-h-40 py-3"
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              required
            />
          </FormField>
          <FormField label="사진 첨부">
            <input className="field-input py-3" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </FormField>
          <FormField label="비고">
            <textarea className="field-input min-h-28 py-3" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </FormField>
          <div className="flex gap-2">
            <Button className="flex-1" type="submit" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              취소
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">{label}</span>
      {children}
    </div>
  );
}
