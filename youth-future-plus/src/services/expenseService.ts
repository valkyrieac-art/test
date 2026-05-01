import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Expense, ExpenseInput } from '../types';
import { demoStore } from './demoStore';

export async function listExpenses(search = '') {
  if (!isSupabaseConfigured) return demoStore.listExpenses(search);

  let query = supabase.from('expenses').select('*').order('spent_on', { ascending: false });

  const keyword = search.trim();
  if (keyword) {
    query = query.or(`vendor.ilike.%${keyword}%,purpose.ilike.%${keyword}%,category.ilike.%${keyword}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Expense[];
}

export async function getExpense(id: string) {
  if (!isSupabaseConfigured) return demoStore.getExpense(id);

  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Expense;
}

export async function createExpense(input: ExpenseInput) {
  if (!isSupabaseConfigured) return demoStore.createExpense(input);

  const { data, error } = await supabase.from('expenses').insert(input).select().single();
  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(id: string, input: ExpenseInput) {
  if (!isSupabaseConfigured) return demoStore.updateExpense(id, input);

  const { data, error } = await supabase.from('expenses').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string) {
  if (!isSupabaseConfigured) {
    demoStore.deleteExpense(id);
    return;
  }

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}
