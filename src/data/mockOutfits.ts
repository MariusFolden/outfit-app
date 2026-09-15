import { Outfit } from '../types/outfit';

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

export const mockOutfits: Outfit[] = [
  { id: 'look-6', imageUri: photo('photo-1483985988355-763728e1935b'), name: 'Sunday in the city', categories: ['Casual', 'Date'], notes: 'Soft layers and my most-worn boots.', isFavorite: true, createdAt: '2026-09-14T15:30:00Z' },
  { id: 'look-5', imageUri: photo('photo-1515886657613-9f3515b0c78f'), name: 'After dark', categories: ['Party'], notes: 'Kept the accessories simple.', isFavorite: false, createdAt: '2026-09-11T20:10:00Z' },
  { id: 'look-4', imageUri: photo('photo-1496747611176-843222e1e57c'), name: 'Coffee meeting', categories: ['Work'], notes: 'Easy, polished, and comfortable.', isFavorite: true, createdAt: '2026-09-08T08:45:00Z' },
  { id: 'look-3', imageUri: photo('photo-1509631179647-0177331693ae'), name: 'Late summer', categories: ['Vacation', 'Casual'], notes: 'The linen set was perfect in the heat.', isFavorite: false, createdAt: '2026-09-03T13:00:00Z' },
  { id: 'look-2', imageUri: photo('photo-1539109136881-3be0616acf4b'), name: 'Dinner reservation', categories: ['Date', 'Formal'], notes: 'A favorite silhouette.', isFavorite: true, createdAt: '2026-08-30T19:30:00Z' },
  { id: 'look-1', imageUri: photo('photo-1529139574466-a303027c1d8b'), name: 'Weekend uniform', categories: ['Casual'], notes: 'For wandering around town.', isFavorite: false, createdAt: '2026-08-26T11:00:00Z' },
];
