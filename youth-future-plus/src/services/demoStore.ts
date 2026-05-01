import type { Activity, ActivityInput, Budget, BudgetInput, Expense, ExpenseInput, Income, IncomeInput } from '../types';

const ACTIVITY_KEY = 'yfp-demo-activities';
const EXPENSE_KEY = 'yfp-demo-expenses';
const INCOME_KEY = 'yfp-demo-incomes';
const BUDGET_KEY = 'yfp-demo-budgets';

function now() {
  return new Date().toISOString();
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(raw) as T;
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const seedActivities: Activity[] = [
  {
    id: 'demo-activity-1',
    date: '2026-03-15',
    attendees: ['사용자1', '사용자2'],
    place: '금천중학교',
    title: '청소년미래플러스 첫 회의',
    content: '1년 활동 목표와 역할을 정하고 지원금 사용 원칙을 확인했습니다.',
    photo_url: null,
    note: '데모 데이터입니다.',
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'demo-activity-2',
    date: '2026-04-10',
    attendees: ['사용자1'],
    place: '마을교육지원센터',
    title: '체험활동 사전 조사',
    content: '체험활동 후보 장소와 예상 비용을 비교했습니다.',
    photo_url: null,
    note: null,
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
];

const seedExpenses: Expense[] = [
  {
    id: 'demo-expense-1',
    spent_on: '2026-03-15',
    amount: 18000,
    vendor: '학교 앞 문구점',
    purpose: '회의 준비 물품 구입',
    category: '물품구입',
    receipt_url: null,
    note: '데모 데이터입니다.',
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'demo-expense-2',
    spent_on: '2026-04-10',
    amount: 32000,
    vendor: '지역 식당',
    purpose: '활동 후 식비',
    category: '식비',
    receipt_url: null,
    note: null,
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
];

const seedIncomes: Income[] = [
  {
    id: 'demo-income-1',
    received_on: '2026-03-01',
    amount: 300000,
    source: '청소년미래플러스 지원사업',
    purpose: '1차 활동 지원금 입금',
    category: '지원금',
    document_url: null,
    note: '데모 데이터입니다.',
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'demo-income-2',
    received_on: '2026-04-05',
    amount: 12000,
    source: '문구점 환불',
    purpose: '미사용 물품 환불',
    category: '환불',
    document_url: null,
    note: null,
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
];

const seedBudgets: Budget[] = [
  {
    id: 'demo-budget-1',
    name: '2026 청소년미래플러스 지원금',
    total_amount: 1000000,
    starts_on: '2026-03-01',
    ends_on: '2027-02-28',
    is_active: true,
    created_by: 'demo-admin',
    created_at: now(),
    updated_at: now(),
  },
];

export const demoStore = {
  listActivities(search = '') {
    const keyword = search.trim().toLowerCase();
    return read<Activity[]>(ACTIVITY_KEY, seedActivities)
      .filter((activity) =>
        keyword
          ? [activity.title, activity.place, activity.content].some((value) => value.toLowerCase().includes(keyword))
          : true,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getActivity(id: string) {
    const activity = read<Activity[]>(ACTIVITY_KEY, seedActivities).find((item) => item.id === id);
    if (!activity) throw new Error('활동내역을 찾을 수 없습니다.');
    return activity;
  },

  createActivity(input: ActivityInput) {
    const activities = read<Activity[]>(ACTIVITY_KEY, seedActivities);
    const activity: Activity = { id: newId(), ...input, created_by: 'demo-admin', created_at: now(), updated_at: now() };
    write(ACTIVITY_KEY, [activity, ...activities]);
    return activity;
  },

  updateActivity(id: string, input: ActivityInput) {
    const activities = read<Activity[]>(ACTIVITY_KEY, seedActivities);
    const activity = activities.find((item) => item.id === id);
    if (!activity) throw new Error('활동내역을 찾을 수 없습니다.');
    const updated: Activity = { ...activity, ...input, updated_at: now() };
    write(ACTIVITY_KEY, activities.map((item) => (item.id === id ? updated : item)));
    return updated;
  },

  deleteActivity(id: string) {
    write(ACTIVITY_KEY, read<Activity[]>(ACTIVITY_KEY, seedActivities).filter((item) => item.id !== id));
  },

  listExpenses(search = '') {
    const keyword = search.trim().toLowerCase();
    return read<Expense[]>(EXPENSE_KEY, seedExpenses)
      .filter((expense) =>
        keyword
          ? [expense.vendor, expense.purpose, expense.category].some((value) => value.toLowerCase().includes(keyword))
          : true,
      )
      .sort((a, b) => new Date(b.spent_on).getTime() - new Date(a.spent_on).getTime());
  },

  getExpense(id: string) {
    const expense = read<Expense[]>(EXPENSE_KEY, seedExpenses).find((item) => item.id === id);
    if (!expense) throw new Error('지출내역을 찾을 수 없습니다.');
    return expense;
  },

  createExpense(input: ExpenseInput) {
    const expenses = read<Expense[]>(EXPENSE_KEY, seedExpenses);
    const expense: Expense = { id: newId(), ...input, created_by: 'demo-admin', created_at: now(), updated_at: now() };
    write(EXPENSE_KEY, [expense, ...expenses]);
    return expense;
  },

  updateExpense(id: string, input: ExpenseInput) {
    const expenses = read<Expense[]>(EXPENSE_KEY, seedExpenses);
    const expense = expenses.find((item) => item.id === id);
    if (!expense) throw new Error('지출내역을 찾을 수 없습니다.');
    const updated: Expense = { ...expense, ...input, updated_at: now() };
    write(EXPENSE_KEY, expenses.map((item) => (item.id === id ? updated : item)));
    return updated;
  },

  deleteExpense(id: string) {
    write(EXPENSE_KEY, read<Expense[]>(EXPENSE_KEY, seedExpenses).filter((item) => item.id !== id));
  },

  listIncomes(search = '') {
    const keyword = search.trim().toLowerCase();
    return read<Income[]>(INCOME_KEY, seedIncomes)
      .filter((income) =>
        keyword
          ? [income.source, income.purpose, income.category].some((value) => value.toLowerCase().includes(keyword))
          : true,
      )
      .sort((a, b) => new Date(b.received_on).getTime() - new Date(a.received_on).getTime());
  },

  getIncome(id: string) {
    const income = read<Income[]>(INCOME_KEY, seedIncomes).find((item) => item.id === id);
    if (!income) throw new Error('수입내역을 찾을 수 없습니다.');
    return income;
  },

  createIncome(input: IncomeInput) {
    const incomes = read<Income[]>(INCOME_KEY, seedIncomes);
    const income: Income = { id: newId(), ...input, created_by: 'demo-admin', created_at: now(), updated_at: now() };
    write(INCOME_KEY, [income, ...incomes]);
    return income;
  },

  updateIncome(id: string, input: IncomeInput) {
    const incomes = read<Income[]>(INCOME_KEY, seedIncomes);
    const income = incomes.find((item) => item.id === id);
    if (!income) throw new Error('수입내역을 찾을 수 없습니다.');
    const updated: Income = { ...income, ...input, updated_at: now() };
    write(INCOME_KEY, incomes.map((item) => (item.id === id ? updated : item)));
    return updated;
  },

  deleteIncome(id: string) {
    write(INCOME_KEY, read<Income[]>(INCOME_KEY, seedIncomes).filter((item) => item.id !== id));
  },

  listBudgets() {
    return read<Budget[]>(BUDGET_KEY, seedBudgets).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  },

  getActiveBudget() {
    return demoStore.listBudgets().find((budget) => budget.is_active) ?? null;
  },

  createBudget(input: BudgetInput) {
    const budgets = read<Budget[]>(BUDGET_KEY, seedBudgets);
    const budget: Budget = { id: newId(), ...input, created_by: 'demo-admin', created_at: now(), updated_at: now() };
    const next = input.is_active ? budgets.map((item) => ({ ...item, is_active: false })) : budgets;
    write(BUDGET_KEY, [budget, ...next]);
    return budget;
  },

  updateBudget(id: string, input: BudgetInput) {
    const budgets = read<Budget[]>(BUDGET_KEY, seedBudgets);
    const budget = budgets.find((item) => item.id === id);
    if (!budget) throw new Error('예산을 찾을 수 없습니다.');
    const updated: Budget = { ...budget, ...input, updated_at: now() };
    const next = budgets.map((item) => {
      if (item.id === id) return updated;
      return input.is_active ? { ...item, is_active: false } : item;
    });
    write(BUDGET_KEY, next);
    return updated;
  },
};
