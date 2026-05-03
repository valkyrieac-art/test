import type { Role } from '../types';

export type LoginAccount = {
  loginId: string;
  email: string;
  password: string;
  role: Role;
  label: string;
};

const ACCOUNT_KEY = 'yfp-login-accounts';

const seedAccounts: LoginAccount[] = [
  {
    loginId: 'admin',
    email: 'admin@youth-future-plus.local',
    password: '1234',
    role: 'admin',
    label: '관리자',
  },
  {
    loginId: 'test1',
    email: 'test1@youth-future-plus.local',
    password: 'test1',
    role: 'user',
    label: '사용자1',
  },
  {
    loginId: 'test2',
    email: 'test2@youth-future-plus.local',
    password: 'test2',
    role: 'user',
    label: '사용자2',
  },
];

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

function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

function toEmail(loginId: string) {
  return `${loginId}@youth-future-plus.local`;
}

function getStoredAccounts() {
  if (typeof localStorage === 'undefined') return seedAccounts;
  const raw = localStorage.getItem(ACCOUNT_KEY);
  if (!raw) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(seedAccounts));
    return seedAccounts;
  }
  const parsed = JSON.parse(raw) as LoginAccount[];
  const merged = [
    ...parsed,
    ...seedAccounts.filter((seed) => !parsed.some((account) => account.loginId === seed.loginId)),
  ];
  return merged;
}

function writeStoredAccounts(accounts: LoginAccount[]) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
}

export function listLoginAccounts() {
  return getStoredAccounts().sort((a, b) => {
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
    return a.label.localeCompare(b.label, 'ko');
  });
}

export function resolveLoginEmail(loginId: string) {
  const normalized = normalizeLoginId(loginId);
  return listLoginAccounts().find((account) => account.loginId === normalized)?.email ?? loginId.trim();
}

function validateAccountInput(input: { loginId: string; password: string; label: string }) {
  const loginId = normalizeLoginId(input.loginId);
  const password = input.password.trim();
  const label = input.label.trim();

  if (!/^[a-z0-9._-]{3,24}$/.test(loginId)) {
    throw new Error('아이디는 영문 소문자, 숫자, 점, 밑줄, 하이픈 3~24자로 입력하세요.');
  }
  if (password.length < 4) {
    throw new Error('비밀번호는 4자 이상 입력하세요.');
  }
  if (!label) {
    throw new Error('참여자 이름을 입력하세요.');
  }

  return { loginId, password, label };
}

export function getDemoAccount(loginId: string, password: string) {
  const normalized = normalizeLoginId(loginId);
  const account = listLoginAccounts().find((item) => item.loginId === normalized);
  if (!account || account.password !== password) return null;
  return {
    id: `demo-${normalized}`,
    ...account,
  };
}

export function createLoginAccount(input: { loginId: string; password: string; label: string }) {
  const { loginId, password, label } = validateAccountInput(input);
  const accounts = listLoginAccounts();
  if (accounts.some((account) => account.loginId === loginId)) {
    throw new Error('이미 등록된 아이디입니다.');
  }
  const account: LoginAccount = {
    loginId,
    email: toEmail(loginId),
    password,
    role: 'user',
    label,
  };
  writeStoredAccounts([...accounts, account]);
  return account;
}

export function updateLoginAccount(currentLoginId: string, input: { loginId: string; password: string; label: string }) {
  const current = normalizeLoginId(currentLoginId);
  if (current === 'admin') {
    throw new Error('관리자 계정은 이 화면에서 수정하지 않습니다.');
  }
  const { loginId, password, label } = validateAccountInput(input);
  const accounts = listLoginAccounts();
  if (accounts.some((account) => account.loginId === loginId && account.loginId !== current)) {
    throw new Error('이미 등록된 아이디입니다.');
  }
  const next = accounts.map((account) =>
    account.loginId === current
      ? {
          ...account,
          loginId,
          email: toEmail(loginId),
          password,
          label,
        }
      : account,
  );
  writeStoredAccounts(next);
}

export function deleteLoginAccount(loginId: string) {
  const normalized = normalizeLoginId(loginId);
  if (normalized === 'admin') {
    throw new Error('관리자 계정은 삭제할 수 없습니다.');
  }
  writeStoredAccounts(listLoginAccounts().filter((account) => account.loginId !== normalized));
}

export function updateOwnPassword(loginId: string, password: string) {
  const normalized = normalizeLoginId(loginId);
  const nextPassword = password.trim();
  if (nextPassword.length < 4) {
    throw new Error('비밀번호는 4자 이상 입력하세요.');
  }
  const accounts = listLoginAccounts();
  const account = accounts.find((item) => item.loginId === normalized);
  if (!account) {
    throw new Error('로그인 계정을 찾을 수 없습니다.');
  }
  writeStoredAccounts(
    accounts.map((item) => (item.loginId === normalized ? { ...item, password: nextPassword } : item)),
  );
}
