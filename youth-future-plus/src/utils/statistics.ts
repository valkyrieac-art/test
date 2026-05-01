import type { Activity, Expense, ExpenseCategory, Income, IncomeCategory } from '../types';
import { monthKey } from './format';

export function getTotalExpense(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export function getTotalIncome(incomes: Income[]) {
  return incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
}

export function getThisMonthActivities(activities: Activity[]) {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return activities.filter((activity) => monthKey(activity.date) === current).length;
}

export function getExpenseByCategory(expenses: Expense[]) {
  const result: Record<ExpenseCategory, number> = {
    식비: 0,
    교통비: 0,
    물품구입: 0,
    체험활동: 0,
    기타: 0,
  };
  expenses.forEach((expense) => {
    result[expense.category] += Number(expense.amount || 0);
  });
  return Object.entries(result).map(([name, amount]) => ({ name, amount }));
}

export function getIncomeByCategory(incomes: Income[]) {
  const result: Record<IncomeCategory, number> = {
    지원금: 0,
    후원금: 0,
    환불: 0,
    이월금: 0,
    기타: 0,
  };
  incomes.forEach((income) => {
    result[income.category] += Number(income.amount || 0);
  });
  return Object.entries(result).map(([name, amount]) => ({ name, amount }));
}

export function getMonthlyExpenses(expenses: Expense[]) {
  const result = new Map<string, number>();
  expenses.forEach((expense) => {
    const key = monthKey(expense.spent_on);
    result.set(key, (result.get(key) ?? 0) + Number(expense.amount || 0));
  });
  return Array.from(result.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}

export function getMonthlyIncomes(incomes: Income[]) {
  const result = new Map<string, number>();
  incomes.forEach((income) => {
    const key = monthKey(income.received_on);
    result.set(key, (result.get(key) ?? 0) + Number(income.amount || 0));
  });
  return Array.from(result.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));
}

export function getMonthlyActivities(activities: Activity[]) {
  const result = new Map<string, number>();
  activities.forEach((activity) => {
    const key = monthKey(activity.date);
    result.set(key, (result.get(key) ?? 0) + 1);
  });
  return Array.from(result.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export function getActivityByAttendee(activities: Activity[]) {
  const result = new Map<string, number>();
  activities.forEach((activity) => {
    activity.attendees.forEach((name) => {
      const trimmed = name.trim();
      if (trimmed) result.set(trimmed, (result.get(trimmed) ?? 0) + 1);
    });
  });
  return Array.from(result.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}
