import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { Loading } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { createExpense, getExpense, updateExpense } from '../services/expenseService';
import { uploadAttachment } from '../services/storageService';
import type { ExpenseCategory, ExpenseInput } from '../types';

const today = new Date().toISOString().slice(0, 10);
const categories: ExpenseCategory[] = ['식비', '교통비', '물품구입', '체험활동', '기타'];

export function ExpenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    spent_on: today,
    amount: '',
    vendor: '',
    purpose: '',
    category: '식비' as ExpenseCategory,
    receipt_url: '',
    note: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getExpense(id)
      .then((expense) =>
        setForm({
          spent_on: expense.spent_on,
          amount: String(expense.amount),
          vendor: expense.vendor,
          purpose: expense.purpose,
          category: expense.category,
          receipt_url: expense.receipt_url ?? '',
          note: expense.note ?? '',
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : '지출내역을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <PageHeader title="권한 없음" />
        <ErrorMessage message="관리자만 지출내역을 작성하거나 수정할 수 있습니다." />
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      let receiptUrl = form.receipt_url || null;
      if (file) receiptUrl = await uploadAttachment(file, 'receipts');

      const input: ExpenseInput = {
        spent_on: form.spent_on,
        amount: Number(form.amount),
        vendor: form.vendor,
        purpose: form.purpose,
        category: form.category,
        receipt_url: receiptUrl,
        note: form.note || null,
      };

      const saved = id ? await updateExpense(id, input) : await createExpense(input);
      navigate(`/expenses/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title={isEdit ? '지출내역 수정' : '지출내역 등록'} />
      {error ? <ErrorMessage message={error} /> : null}
      {loading ? (
        <Loading />
      ) : (
        <form className="panel flex flex-col gap-5 p-5" onSubmit={handleSubmit}>
          <FormField label="사용일자">
            <input className="field-input" type="date" value={form.spent_on} onChange={(event) => setForm({ ...form, spent_on: event.target.value })} required />
          </FormField>
          <FormField label="사용금액">
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
          <FormField label="사용처">
            <input className="field-input" value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} required />
          </FormField>
          <FormField label="사용목적">
            <input className="field-input" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} required />
          </FormField>
          <FormField label="지출분류">
            <select className="field-input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="영수증 사진 첨부">
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
