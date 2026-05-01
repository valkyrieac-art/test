import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Budget, BudgetInput } from '../types';
import { demoStore } from './demoStore';

export async function getActiveBudget() {
  if (!isSupabaseConfigured) return demoStore.getActiveBudget();

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Budget | null;
}

export async function listBudgets() {
  if (!isSupabaseConfigured) return demoStore.listBudgets();

  const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Budget[];
}

export async function createBudget(input: BudgetInput) {
  if (!isSupabaseConfigured) return demoStore.createBudget(input);

  const { data, error } = await supabase.from('budgets').insert(input).select().single();
  if (error) throw error;
  return data as Budget;
}

export async function updateBudget(id: string, input: BudgetInput) {
  if (!isSupabaseConfigured) return demoStore.updateBudget(id, input);

  const { data, error } = await supabase.from('budgets').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Budget;
}
