import { FormEvent, useEffect, useState } from 'react';
import { LogOut, Pencil, Save, Trash2, UserPlus, X } from 'lucide-react';
import { AdminOnly } from '../components/AdminOnly';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { PageHeader } from '../components/ui/PageHeader';
import { INITIAL_ACTIVITY_BUDGET, INITIAL_ACTIVITY_BUDGET_NAME } from '../config/budget';
import {
  createLoginAccount,
  deleteLoginAccount,
  listLoginAccounts,
  updateLoginAccount,
  type LoginAccount,
} from '../config/accounts';
import { useAuth } from '../contexts/auth';
import { formatCurrency } from '../utils/format';

type AccountForm = {
  loginId: string;
  label: string;
  password: string;
};

const emptyAccountForm: AccountForm = {
  loginId: '',
  label: '',
  password: '',
};

export function SettingsPage() {
  const { profile, loginId, signOut, changePassword } = useAuth();
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [accounts, setAccounts] = useState<LoginAccount[]>([]);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [editingLoginId, setEditingLoginId] = useState<string | null>(null);
  const [editAccountForm, setEditAccountForm] = useState<AccountForm>(emptyAccountForm);

  useEffect(() => {
    refreshAccounts();
  }, []);

  function refreshAccounts() {
    setAccounts(listLoginAccounts());
  }

  function handleAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      createLoginAccount(accountForm);
      setAccountForm(emptyAccountForm);
      refreshAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '참여자 저장에 실패했습니다.');
    }
  }

  function startEditAccount(account: LoginAccount) {
    setEditingLoginId(account.loginId);
    setEditAccountForm({
      loginId: account.loginId,
      label: account.label,
      password: account.password,
    });
  }

  function cancelEditAccount() {
    setEditingLoginId(null);
    setEditAccountForm(emptyAccountForm);
  }

  function handleAccountUpdate(loginId: string) {
    setError('');
    try {
      updateLoginAccount(loginId, editAccountForm);
      cancelEditAccount();
      refreshAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '참여자 수정에 실패했습니다.');
    }
  }

  function handleAccountDelete(loginId: string) {
    if (!window.confirm('이 참여자 계정을 삭제할까요?')) return;
    setError('');
    try {
      deleteLoginAccount(loginId);
      refreshAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '참여자 삭제에 실패했습니다.');
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPasswordMessage('');
    if (passwordForm.password.length < 4) {
      setError('비밀번호는 4자 이상 입력하세요.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.password);
      setPasswordForm({ password: '', confirmPassword: '' });
      setPasswordMessage('비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader title="설정" description="계정 권한과 프로젝트 참여자 계정을 관리합니다." />
      {error ? <ErrorMessage message={error} /> : null}

      <section className="panel p-5">
        <h2 className="text-lg font-bold text-slate-950">내 계정</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="이름" value={profile?.full_name ?? '-'} />
          <Info label="아이디" value={loginId ?? '-'} />
          <Info label="권한" value={profile?.role === 'admin' ? '관리자' : '참여자'} />
        </div>
        <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={handlePasswordSubmit}>
          <label className="flex flex-col gap-2">
            <span className="field-label">새 비밀번호</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm({ ...passwordForm, password: event.target.value })}
              minLength={4}
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="field-label">새 비밀번호 확인</span>
            <input
              className="field-input"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              minLength={4}
              required
            />
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
            <Button type="submit" disabled={passwordSaving}>
              <Save size={18} />
              {passwordSaving ? '변경 중...' : '비밀번호 변경'}
            </Button>
            {passwordMessage ? <p className="text-sm font-semibold text-mint-700">{passwordMessage}</p> : null}
          </div>
        </form>
        <Button variant="secondary" className="mt-5 w-full sm:w-auto" onClick={signOut}>
          <LogOut size={18} />
          로그아웃
        </Button>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-bold text-slate-950">활동비 예산</h2>
        <div className="mt-4 rounded-lg border border-mint-100 bg-mint-50 p-4">
          <p className="text-sm font-bold text-mint-700">{INITIAL_ACTIVITY_BUDGET_NAME}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatCurrency(INITIAL_ACTIVITY_BUDGET)}</p>
          <p className="mt-2 text-sm text-slate-600">수입 등록 없이 이 예산에서 지출만 차감해 관리합니다.</p>
        </div>
      </section>

      <AdminOnly>
        <section className="panel p-5">
          <h2 className="text-lg font-bold text-slate-950">프로젝트 참여자 관리</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={handleAccountSubmit}>
            <AccountFields value={accountForm} onChange={setAccountForm} />
            <Button className="sm:col-span-3" type="submit">
              <UserPlus size={18} />
              참여자 추가
            </Button>
          </form>

          <div className="mt-5 space-y-3">
            {accounts.map((account) => {
              const isEditing = editingLoginId === account.loginId;
              const isAdminAccount = account.role === 'admin';
              return (
                <div key={account.loginId} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <AccountFields value={editAccountForm} onChange={setEditAccountForm} />
                      <div className="flex gap-2 sm:col-span-3">
                        <Button className="flex-1" type="button" onClick={() => handleAccountUpdate(account.loginId)}>
                          <Save size={18} />
                          저장
                        </Button>
                        <Button type="button" variant="secondary" onClick={cancelEditAccount}>
                          <X size={18} />
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">{account.label}</p>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                            {account.role === 'admin' ? '관리자' : '참여자'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          아이디 {account.loginId} · 비밀번호 {account.password}
                        </p>
                      </div>
                      {!isAdminAccount ? (
                        <div className="flex gap-2">
                          <Button type="button" variant="secondary" onClick={() => startEditAccount(account)}>
                            <Pencil size={18} />
                            수정
                          </Button>
                          <Button type="button" variant="danger" onClick={() => handleAccountDelete(account.loginId)}>
                            <Trash2 size={18} />
                            삭제
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </AdminOnly>
    </div>
  );
}

function AccountFields({ value, onChange }: { value: AccountForm; onChange: (value: AccountForm) => void }) {
  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="field-label">아이디</span>
        <input
          className="field-input"
          value={value.loginId}
          onChange={(event) => onChange({ ...value, loginId: event.target.value })}
          placeholder="예: minjun"
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="field-label">참여자 이름</span>
        <input
          className="field-input"
          value={value.label}
          onChange={(event) => onChange({ ...value, label: event.target.value })}
          placeholder="예: 김민준"
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="field-label">비밀번호</span>
        <input
          className="field-input"
          type="text"
          value={value.password}
          onChange={(event) => onChange({ ...value, password: event.target.value })}
          minLength={4}
          required
        />
      </label>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-all font-semibold text-slate-900">{value}</p>
    </div>
  );
}
