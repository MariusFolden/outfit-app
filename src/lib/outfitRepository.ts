import { Category, DEFAULT_CATEGORIES, Outfit } from '../types/outfit';
import { createOutfitPhotoUrls } from './outfitPhotos';
import { supabase } from './supabase';

type CategoryRow = { id: string; name: string; created_at: string };
type OutfitRow = { id: string; photo_path: string; name: string | null; notes: string | null; is_favorite: boolean; created_at: string; updated_at: string; outfit_categories: Array<{ category: CategoryRow | null }> };

function databaseError(error: { message: string }): Error {
  return new Error(error.message || 'Something went wrong. Please try again.');
}

export function mapCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function sortCategories(categories: Category[]) {
  const defaultOrder = new Map<string, number>(DEFAULT_CATEGORIES.map((name, index) => [name, index]));
  return [...categories].sort((a, b) => {
    const aOrder = defaultOrder.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = defaultOrder.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder || a.createdAt.localeCompare(b.createdAt);
  });
}

export async function loadLibrary(userId: string): Promise<{ outfits: Outfit[]; categories: Category[] }> {
  const [categoriesResult, outfitsResult] = await Promise.all([
    supabase.from('categories').select('id, name, created_at').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('outfits').select('id, photo_path, name, notes, is_favorite, created_at, updated_at, outfit_categories(category:categories(id, name, created_at))').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  if (categoriesResult.error) throw databaseError(categoriesResult.error);
  if (outfitsResult.error) throw databaseError(outfitsResult.error);

  const rows = (outfitsResult.data ?? []) as unknown as OutfitRow[];
  const photoUrls = await createOutfitPhotoUrls(userId, rows.map((row) => row.photo_path));
  return {
    categories: sortCategories((categoriesResult.data ?? []).map(mapCategory)),
    outfits: rows.map((row) => ({
      id: row.id,
      photoPath: row.photo_path,
      imageUri: photoUrls.get(row.photo_path) ?? '',
      name: row.name ?? undefined,
      notes: row.notes ?? undefined,
      isFavorite: row.is_favorite,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      categories: row.outfit_categories.map((item) => item.category).filter((category): category is CategoryRow => Boolean(category)).map(mapCategory),
    })),
  };
}

export async function insertOutfit({ id, userId, photoPath, name, notes, isFavorite }: { id: string; userId: string; photoPath: string; name?: string; notes?: string; isFavorite: boolean }) {
  const { error } = await supabase.from('outfits').insert({ id, user_id: userId, photo_path: photoPath, name: name ?? null, notes: notes ?? null, is_favorite: isFavorite });
  if (error) throw databaseError(error);
}

export async function insertOutfitCategories(outfitId: string, categoryIds: string[]) {
  if (!categoryIds.length) return;
  const { error } = await supabase.from('outfit_categories').insert(categoryIds.map((categoryId) => ({ outfit_id: outfitId, category_id: categoryId })));
  if (error) throw databaseError(error);
}

export async function removeOutfitCategories(outfitId: string, categoryIds: string[]) {
  if (!categoryIds.length) return;
  const { error } = await supabase.from('outfit_categories').delete().eq('outfit_id', outfitId).in('category_id', categoryIds);
  if (error) throw databaseError(error);
}

export async function updateOutfitRow(id: string, { name, notes, isFavorite }: { name?: string; notes?: string; isFavorite: boolean }) {
  const { error } = await supabase.from('outfits').update({ name: name ?? null, notes: notes ?? null, is_favorite: isFavorite }).eq('id', id);
  if (error) throw databaseError(error);
}

export async function deleteOutfitRow(id: string) {
  const { error } = await supabase.from('outfits').delete().eq('id', id);
  if (error) throw databaseError(error);
}

export async function insertCategory(userId: string, name: string): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert({ user_id: userId, name }).select('id, name, created_at').single();
  if (error) throw databaseError(error);
  return mapCategory(data as CategoryRow);
}
