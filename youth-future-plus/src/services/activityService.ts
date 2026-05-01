import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Activity, ActivityInput } from '../types';
import { demoStore } from './demoStore';

export async function listActivities(search = '') {
  if (!isSupabaseConfigured) return demoStore.listActivities(search);

  let query = supabase.from('activities').select('*').order('date', { ascending: false });

  const keyword = search.trim();
  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,place.ilike.%${keyword}%,content.ilike.%${keyword}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Activity[];
}

export async function getActivity(id: string) {
  if (!isSupabaseConfigured) return demoStore.getActivity(id);

  const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Activity;
}

export async function createActivity(input: ActivityInput) {
  if (!isSupabaseConfigured) return demoStore.createActivity(input);

  const { data, error } = await supabase.from('activities').insert(input).select().single();
  if (error) throw error;
  return data as Activity;
}

export async function updateActivity(id: string, input: ActivityInput) {
  if (!isSupabaseConfigured) return demoStore.updateActivity(id, input);

  const { data, error } = await supabase.from('activities').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Activity;
}

export async function deleteActivity(id: string) {
  if (!isSupabaseConfigured) {
    demoStore.deleteActivity(id);
    return;
  }

  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw error;
}
