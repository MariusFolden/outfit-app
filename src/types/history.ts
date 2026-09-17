export type LocalDateKey = string;

export type OutfitWear = {
  id: string;
  userId: string;
  outfitId: string;
  wornOn: LocalDateKey;
  createdAt: string;
};

export type HistoryMonthState = {
  wears: OutfitWear[];
  hasLoaded: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
};

export type LastWornState = {
  wornOn: LocalDateKey | null;
  hasLoaded: boolean;
  isLoading: boolean;
  error: string | null;
};

export type HistoryPresenceState = {
  hasHistory: boolean | null;
  hasLoaded: boolean;
  isLoading: boolean;
  error: string | null;
};
