import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { createIncome, getIncome, updateIncome } from '../services/incomeService';
import { uploadAttachment } from '../services/storageService';
import type { IncomeCategory, IncomeInput } from '../types';

const today = new Date().toISOString().slice(0, 10);
const categories: IncomeCategory[] = ['지원금', '후원금', '환불', '이월금', '기타'];

export function IncomeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    received_on: today,
    amount: '',
    source: '',
    purpose: '',
    category: '지원금' as IncomeCategory,
    document_url: '',
    note: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getIncome(id)
      .then((income) =>
        setForm({
          received_on: income.received_on,
          amount: String(income.amount),
          source: income.source,
          purpose: income.purpose,
          category: income.category,
          document_url: income.document_url ?? '',
          note: income.note ?? '',
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : '수입내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <PageHeader title="권한 없음" />
        <ErrorMessage message="관리자만 수입내역을 작성하거나 수정할 수 있습니다." />
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      let documentUrl = form.document_url || null;
      if (file) documentUrl = await uploadAttachment(file, 'income-documents');

      const input: IncomeInput = {
        received_on: form.received_on,
        amount: Number(form.amount),
        source: form.source,
        purpose: form.purpose,
        category: form.category,
        document_url: documentUrl,
        note: form.note || null,
      };

      const saved = id ? await updateIncome(id, input) : await createIncome(input);
      navigate(`/incomes/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title={isEdit ? '수입내역 수정' : '수입내역 등록'} />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <form className="panel flex flex-col gap-5 p-5" onSubmit={handleSubmit}>
          <FormField label="입금일자">
            <input className="field-input" type="date" value={form.received_on} onChange={(event) => setForm({ ...form, received_on: event.target.value })} required />
          </FormField>
          <FormField label="수입금액">
            <input
              className="field-input"
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              required
            />
          </FormField>
          <FormField label="입금처">
            <input className="field-input" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} required />
          </FormField>
          <FormField label="수입목적">
            <input className="field-input" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} required />
          </FormField>
          <FormField label="수입분류">
            <select className="field-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as IncomeCategory })}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="증빙 사진 첨부">
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
    <label className="flex flex-col gap-2">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
