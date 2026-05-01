export type Role = 'admin' | 'user';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  date: string;
  attendees: string[];
  place: string;
  title: string;
  content: string;
  photo_url: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpenseCategory = '식비' | '교통비' | '물품구입' | '체험활동' | '기타';

export type Expense = {
  id: string;
  spent_on: string;
  amount: number;
  vendor: string;
  purpose: string;
  category: ExpenseCategory;
  receipt_url: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IncomeCategory = '지원금' | '후원금' | '환불' | '이월금' | '기타';

export type Income = {
  id: string;
  received_on: string;
  amount: number;
  source: string;
  purpose: string;
  category: IncomeCategory;
  document_url: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: string;
  name: string;
  total_amount: number;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityInput = Omit<Activity, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type ExpenseInput = Omit<Expense, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type IncomeInput = Omit<Income, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type BudgetInput = Pick<Budget, 'name' | 'total_amount' | 'starts_on' | 'ends_on' | 'is_active'>;
