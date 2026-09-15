export const DEFAULT_CATEGORIES = ['Casual', 'School', 'Work', 'Party', 'Date', 'Formal', 'Gym', 'Vacation'] as const;

export type Outfit = {
  id: string;
  imageUri: string;
  name?: string;
  categories: string[];
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
};

export type OutfitDraft = Omit<Outfit, 'id' | 'createdAt'>;
