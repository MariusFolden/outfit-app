import { getLocalMonthBounds } from './localDate';
import { supabase } from './supabase';
import type { LocalDateKey, OutfitWear } from '../types/history';

type WearRow = {
  id: string;
  user_id: string;
  outfit_id: string;
  worn_on: string;
  created_at: string;
};

type DatabaseError = {
  message: string;
  code?: string;
};

export class HistoryRepositoryError extends Error {
  code?: string;

  constructor(error: DatabaseError) {
    super(error.message || 'Something went wrong. Please try again.');
    this.name = 'HistoryRepositoryError';
    this.code = error.code;
  }
}

function databaseError(error: DatabaseError): HistoryRepositoryError {
  return new HistoryRepositoryError(error);
}

function mapWear(row: WearRow): OutfitWear {
  return {
    id: row.id,
    userId: row.user_id,
    outfitId: row.outfit_id,
    wornOn: row.worn_on,
    createdAt: row.created_at,
  };
}

export function isDuplicateWearError(error: unknown) {
  return error instanceof HistoryRepositoryError && error.code === '23505';
}

export async function loadHistoryPresence(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('outfit_wears')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) throw databaseError(error);
  return Boolean(data?.id);
}

export async function loadWearsForMonth(userId: string, month: Date): Promise<OutfitWear[]> {
  const { start, endExclusive } = getLocalMonthBounds(month);
  const { data, error } = await supabase
    .from('outfit_wears')
    .select('id, user_id, outfit_id, worn_on, created_at')
    .eq('user_id', userId)
    .gte('worn_on', start)
    .lt('worn_on', endExclusive)
    .order('worn_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw databaseError(error);
  return (data ?? []).map((row) => mapWear(row as WearRow));
}

export async function logOutfitWear({ userId, outfitId, wornOn }: { userId: string; outfitId: string; wornOn: LocalDateKey }): Promise<OutfitWear> {
  const { data, error } = await supabase
    .from('outfit_wears')
    .insert({ user_id: userId, outfit_id: outfitId, worn_on: wornOn })
    .select('id, user_id, outfit_id, worn_on, created_at')
    .single();

  if (error) throw databaseError(error);
  return mapWear(data as WearRow);
}

export async function removeOutfitWear(id: string): Promise<void> {
  const { error } = await supabase.from('outfit_wears').delete().eq('id', id);
  if (error) throw databaseError(error);
}

export async function loadLastWornDate(userId: string, outfitId: string): Promise<LocalDateKey | null> {
  const { data, error } = await supabase
    .from('outfit_wears')
    .select('worn_on')
    .eq('user_id', userId)
    .eq('outfit_id', outfitId)
    .order('worn_on', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw databaseError(error);
  return data?.worn_on ?? null;
}
