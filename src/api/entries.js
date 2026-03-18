import { supabase } from '../lib/supabase';

export async function getEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function createEntry(content) {
  const { data, error } = await supabase
    .from('entries')
    .insert([{ content }])
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data[0];
}