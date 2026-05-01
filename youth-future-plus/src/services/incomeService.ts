import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Income, IncomeInput } from '../types';
import { demoStore } from './demoStore';

export async function listIncomes(search = '') {
  if (!isSupabaseConfigured) return demoStore.listIncomes(search);

  let query = supabase.from('incomes').select('*').order('received_on', { ascending: false });

  const keyword = search.trim();
  if (keyword) {
    query = query.or(`source.ilike.%${keyword}%,purpose.ilike.%${keyword}%,category.ilike.%${keyword}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Income[];
}

export async function getIncome(id: string) {
  if (!isSupabaseConfigured) return demoStore.getIncome(id);

  const { data, error } = await supabase.from('incomes').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Income;
}

export async function createIncome(input: IncomeInput) {
  if (!isSupabaseConfigured) return demoStore.createIncome(input);

  const { data, error } = await supabase.from('incomes').insert(input).select().single();
  if (error) throw error;
  return data as Income;
}

export async function updateIncome(id: string, input: IncomeInput) {
  if (!isSupabaseConfigured) return demoStore.updateIncome(id, input);

  const { data, error } = await supabase.from('incomes').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Income;
}

export async function deleteIncome(id: string) {
  if (!isSupabaseConfigured) {
    demoStore.deleteIncome(id);
    return;
  }

  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw error;
}
