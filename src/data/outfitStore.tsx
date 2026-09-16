import * as Crypto from 'expo-crypto';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { deleteOutfitRow, insertCategory, insertOutfit, insertOutfitCategories, loadLibrary, removeOutfitCategories, updateOutfitRow } from '../lib/outfitRepository';
import { removeOutfitPhoto, uploadOutfitPhoto } from '../lib/outfitPhotos';
import { useAuth } from '../providers/AuthProvider';
import { Category, Outfit, OutfitDraft } from '../types/outfit';

type OutfitStore = {
  outfits: Outfit[];
  categories: Category[];
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addOutfit: (draft: OutfitDraft) => Promise<Outfit>;
  updateOutfit: (id: string, draft: OutfitDraft) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<Category | undefined>;
};

const Context = createContext<OutfitStore | null>(null);

export function OutfitProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const version = ++requestVersion.current;
    setIsRefreshing(true);
    setError(null);
    try {
      const library = await loadLibrary(userId);
      if (requestVersion.current === version) {
        setOutfits(library.outfits);
        setCategories(library.categories);
      }
    } catch (nextError) {
      if (requestVersion.current === version) setError(nextError instanceof Error ? nextError.message : 'We could not load your library. Please try again.');
      throw nextError;
    } finally {
      if (requestVersion.current === version) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    requestVersion.current += 1;
    setOutfits([]);
    setCategories([]);
    setError(null);
    if (!userId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    setIsLoading(true);
    void refresh().catch(() => undefined);
  }, [refresh, userId]);

  const addCategory = useCallback(async (rawName: string) => {
    if (!userId) throw new Error('Please sign in again before creating a category.');
    const name = rawName.trim();
    if (!name) return undefined;
    const existing = categories.find((category) => category.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    setIsSaving(true);
    try {
      const category = await insertCategory(userId, name);
      setCategories((current) => [...current, category]);
      return category;
    } catch (nextError) {
      await refresh().catch(() => undefined);
      throw nextError;
    } finally {
      setIsSaving(false);
    }
  }, [categories, refresh, userId]);

  const addOutfit = useCallback(async (draft: OutfitDraft) => {
    if (!userId) throw new Error('Please sign in again before saving an outfit.');
    if (!draft.imageUri) throw new Error('Choose a photo before saving this outfit.');
    const id = Crypto.randomUUID();
    let photoPath: string | undefined;
    let outfitInserted = false;
    let outfitSaved = false;
    setIsSaving(true);
    try {
      photoPath = await uploadOutfitPhoto({ userId, outfitId: id, localUri: draft.imageUri, mimeType: draft.imageMimeType });
      await insertOutfit({ id, userId, photoPath, name: draft.name, notes: draft.notes, isFavorite: draft.isFavorite });
      outfitInserted = true;
      await insertOutfitCategories(id, draft.categoryIds);
      outfitSaved = true;
      const library = await loadLibrary(userId);
      setOutfits(library.outfits);
      setCategories(library.categories);
      const created = library.outfits.find((outfit) => outfit.id === id);
      if (!created) throw new Error('Your outfit was saved, but we could not refresh the library. Pull to refresh and try again.');
      return created;
    } catch (nextError) {
      if (!outfitSaved && outfitInserted) await deleteOutfitRow(id).catch(() => undefined);
      if (!outfitSaved && photoPath) await removeOutfitPhoto(photoPath).catch(() => undefined);
      await refresh().catch(() => undefined);
      if (outfitSaved) throw new Error('Your outfit was saved, but we could not refresh the library. Pull to refresh and try again.');
      throw nextError;
    } finally {
      setIsSaving(false);
    }
  }, [refresh, userId]);

  const updateOutfit = useCallback(async (id: string, draft: OutfitDraft) => {
    const current = outfits.find((outfit) => outfit.id === id);
    if (!current) throw new Error('This outfit is no longer available. Please return to your library.');
    const currentIds = current.categories.map((category) => category.id);
    const added = draft.categoryIds.filter((categoryId) => !currentIds.includes(categoryId));
    const removed = currentIds.filter((categoryId) => !draft.categoryIds.includes(categoryId));
    setIsSaving(true);
    try {
      await insertOutfitCategories(id, added);
      try {
        await removeOutfitCategories(id, removed);
      } catch (nextError) {
        await removeOutfitCategories(id, added).catch(() => undefined);
        throw nextError;
      }
      try {
        await updateOutfitRow(id, draft);
      } catch (nextError) {
        await insertOutfitCategories(id, removed).catch(() => undefined);
        await removeOutfitCategories(id, added).catch(() => undefined);
        throw nextError;
      }
      await refresh();
    } catch (nextError) {
      await refresh().catch(() => undefined);
      throw nextError;
    } finally {
      setIsSaving(false);
    }
  }, [outfits, refresh]);

  const toggleFavorite = useCallback(async (id: string) => {
    const outfit = outfits.find((item) => item.id === id);
    if (!outfit) return;
    setIsSaving(true);
    setOutfits((current) => current.map((item) => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
    try {
      await updateOutfitRow(id, { name: outfit.name, notes: outfit.notes, isFavorite: !outfit.isFavorite });
    } catch (nextError) {
      setOutfits((current) => current.map((item) => item.id === id ? outfit : item));
      throw nextError;
    } finally {
      setIsSaving(false);
    }
  }, [outfits]);

  const deleteOutfit = useCallback(async (id: string) => {
    const outfit = outfits.find((item) => item.id === id);
    if (!outfit) throw new Error('This outfit is no longer available.');
    setIsSaving(true);
    let photoDeleted = false;
    try {
      await removeOutfitPhoto(outfit.photoPath);
      photoDeleted = true;
      await deleteOutfitRow(id);
      setOutfits((current) => current.filter((item) => item.id !== id));
    } catch (nextError) {
      await refresh().catch(() => undefined);
      if (photoDeleted) throw new Error('The photo was removed, but the outfit record could not be deleted. Please try again.');
      throw nextError;
    } finally {
      setIsSaving(false);
    }
  }, [outfits, refresh]);

  const value = useMemo<OutfitStore>(() => ({ outfits, categories, isLoading, isRefreshing, isSaving, error, refresh, addOutfit, updateOutfit, deleteOutfit, toggleFavorite, addCategory }), [outfits, categories, isLoading, isRefreshing, isSaving, error, refresh, addOutfit, updateOutfit, deleteOutfit, toggleFavorite, addCategory]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOutfits() {
  const store = useContext(Context);
  if (!store) throw new Error('useOutfits must be used within OutfitProvider');
  return store;
}
