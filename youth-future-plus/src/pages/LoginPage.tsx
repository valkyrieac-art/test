import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { Button } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export function LoginPage() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (session) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    setLoading(true);
    try {
      await signIn(loginId, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-mint-50 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-brand-600 p-3 text-white">
            <LockKeyhole size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-700">청소년미래플러스</p>
            <h1 className="text-xl font-bold text-slate-950">활동관리 시스템</h1>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="field-label">아이디</span>
            <input
              className="field-input"
              type="text"
              autoComplete="username"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="admin, test1, test2"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="field-label">비밀번호</span>
            <input
              className="field-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <ErrorMessage message={error} /> : null}
          <Button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          테스트 계정: 관리자 admin / 1234, 사용자 test1 / test1, 사용자 test2 / test2
        </p>
      </section>
    </main>
  );
}
