export const loginAccounts = {
  admin: {
    email: 'admin@youth-future-plus.local',
    password: '1234',
    role: 'admin',
    label: '관리자',
  },
  test1: {
    email: 'test1@youth-future-plus.local',
    password: 'test1',
    role: 'user',
    label: '사용자1',
  },
  test2: {
    email: 'test2@youth-future-plus.local',
    password: 'test2',
    role: 'user',
    label: '사용자2',
  },
} as const;

export type LoginId = keyof typeof loginAccounts;

export function resolveLoginEmail(loginId: string) {
  const normalized = loginId.trim().toLowerCase();
  return loginAccounts[normalized as LoginId]?.email ?? loginId.trim();
}

export function getDemoAccount(loginId: string, password: string) {
  const normalized = loginId.trim().toLowerCase() as LoginId;
  const account = loginAccounts[normalized];
  if (!account || account.password !== password) return null;
  return {
    id: `demo-${normalized}`,
    loginId: normalized,
    ...account,
  };
}
