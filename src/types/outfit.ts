export const DEFAULT_CATEGORIES = ['Casual', 'School', 'Work', 'Party', 'Date', 'Formal', 'Gym', 'Vacation'] as const;

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Outfit = {
  id: string;
  photoPath: string;
  imageUri: string;
  name?: string;
  categories: Category[];
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OutfitDraft = {
  imageUri?: string;
  imageMimeType?: string | null;
  name?: string;
  categoryIds: string[];
  notes?: string;
  isFavorite: boolean;
};
