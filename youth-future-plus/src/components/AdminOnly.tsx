import type { ReactNode } from 'react';
import { useAuth } from '../contexts/auth';

export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : null;
}
