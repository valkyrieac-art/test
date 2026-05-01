import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { Loading } from '../ui/Loading';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="로그인 상태를 확인하는 중입니다." />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
