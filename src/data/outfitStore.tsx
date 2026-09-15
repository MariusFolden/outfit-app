import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { mockOutfits } from './mockOutfits';
import { DEFAULT_CATEGORIES, Outfit, OutfitDraft } from '../types/outfit';

type OutfitStore = {
  outfits: Outfit[];
  categories: string[];
  addOutfit: (draft: OutfitDraft) => Outfit;
  updateOutfit: (id: string, draft: OutfitDraft) => void;
  deleteOutfit: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCategory: (name: string) => string | undefined;
};

const Context = createContext<OutfitStore | null>(null);

export function OutfitProvider({ children }: { children: ReactNode }) {
  const [outfits, setOutfits] = useState(mockOutfits);
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);

  const value = useMemo<OutfitStore>(() => ({
    outfits,
    categories,
    addOutfit: (draft) => {
      const outfit = { ...draft, id: `look-${Date.now()}`, createdAt: new Date().toISOString() };
      setOutfits((current) => [outfit, ...current]);
      return outfit;
    },
    updateOutfit: (id, draft) => setOutfits((current) => current.map((outfit) => outfit.id === id ? { ...outfit, ...draft } : outfit)),
    deleteOutfit: (id) => setOutfits((current) => current.filter((outfit) => outfit.id !== id)),
    toggleFavorite: (id) => setOutfits((current) => current.map((outfit) => outfit.id === id ? { ...outfit, isFavorite: !outfit.isFavorite } : outfit)),
    addCategory: (rawName) => {
      const name = rawName.trim();
      if (!name) return undefined;
      const existing = categories.find((category) => category.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      setCategories((current) => [...current, name]);
      return name;
    },
  }), [outfits, categories]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOutfits() {
  const store = useContext(Context);
  if (!store) throw new Error('useOutfits must be used within OutfitProvider');
  return store;
}
