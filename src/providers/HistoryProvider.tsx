import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadLastWornDate, loadWearsForMonth, logOutfitWear, removeOutfitWear } from '../lib/historyRepository';
import { fromLocalDateKey, toLocalMonthKey } from '../lib/localDate';
import { useOutfits } from '../data/outfitStore';
import { useAuth } from './AuthProvider';
import type { HistoryMonthState, LastWornState, LocalDateKey, OutfitWear } from '../types/history';

type LoadOptions = {
  force?: boolean;
};

type HistoryStore = {
  months: Record<string, HistoryMonthState>;
  lastWornByOutfit: Record<string, LastWornState>;
  getMonthState: (month: Date) => HistoryMonthState;
  loadMonth: (month: Date, options?: LoadOptions) => Promise<OutfitWear[]>;
  logWear: (outfitId: string, wornOn: LocalDateKey) => Promise<OutfitWear>;
  removeWear: (wear: OutfitWear) => Promise<void>;
  loadLastWorn: (outfitId: string, options?: LoadOptions) => Promise<LocalDateKey | null>;
};

const emptyMonthState: HistoryMonthState = {
  wears: [],
  hasLoaded: false,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

const emptyLastWornState: LastWornState = {
  wornOn: null,
  hasLoaded: false,
  isLoading: false,
  error: null,
};

const Context = createContext<HistoryStore | null>(null);

function sortWears(wears: OutfitWear[]) {
  return [...wears].sort((a, b) => b.wornOn.localeCompare(a.wornOn) || b.createdAt.localeCompare(a.createdAt));
}

export function HistoryProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { outfits } = useOutfits();
  const userId = session?.user.id;
  const [months, setMonths] = useState<Record<string, HistoryMonthState>>({});
  const [lastWornByOutfit, setLastWornByOutfit] = useState<Record<string, LastWornState>>({});
  const monthsRef = useRef(months);
  const lastWornRef = useRef(lastWornByOutfit);
  const requestVersion = useRef(0);
  const monthRequests = useRef(new Map<string, Promise<OutfitWear[]>>());
  const lastWornRequests = useRef(new Map<string, Promise<LocalDateKey | null>>());
  const lastWornRequestTokens = useRef(new Map<string, symbol>());
  const lastWornMutationVersions = useRef(new Map<string, number>());

  const updateMonths = useCallback((updater: (current: Record<string, HistoryMonthState>) => Record<string, HistoryMonthState>) => {
    setMonths((current) => {
      const next = updater(current);
      monthsRef.current = next;
      return next;
    });
  }, []);

  const updateLastWorn = useCallback((updater: (current: Record<string, LastWornState>) => Record<string, LastWornState>) => {
    setLastWornByOutfit((current) => {
      const next = updater(current);
      lastWornRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    requestVersion.current += 1;
    monthRequests.current.clear();
    lastWornRequests.current.clear();
    lastWornRequestTokens.current.clear();
    lastWornMutationVersions.current.clear();
    monthsRef.current = {};
    lastWornRef.current = {};
    setMonths({});
    setLastWornByOutfit({});
  }, [userId]);

  useEffect(() => {
    const outfitIds = new Set(outfits.map((outfit) => outfit.id));
    updateMonths((current) => Object.fromEntries(Object.entries(current).map(([monthKey, state]) => [
      monthKey,
      { ...state, wears: state.wears.filter((wear) => outfitIds.has(wear.outfitId)) },
    ])));
    updateLastWorn((current) => Object.fromEntries(Object.entries(current).filter(([outfitId]) => outfitIds.has(outfitId))));
  }, [outfits, updateLastWorn, updateMonths]);

  const getMonthState = useCallback((month: Date) => months[toLocalMonthKey(month)] ?? emptyMonthState, [months]);

  const invalidateLastWornRequest = useCallback((outfitId: string) => {
    const nextVersion = (lastWornMutationVersions.current.get(outfitId) ?? 0) + 1;
    lastWornMutationVersions.current.set(outfitId, nextVersion);
  }, []);

  const loadMonth = useCallback(async (month: Date, options: LoadOptions = {}): Promise<OutfitWear[]> => {
    if (!userId) throw new Error('Please sign in again before loading outfit history.');
    const monthKey = toLocalMonthKey(month);
    const existing = monthsRef.current[monthKey];
    if (!options.force && existing?.hasLoaded) return existing.wears;

    const inFlight = monthRequests.current.get(monthKey);
    if (inFlight) return inFlight;

    const version = requestVersion.current;
    updateMonths((current) => {
      const previous = current[monthKey] ?? emptyMonthState;
      return {
        ...current,
        [monthKey]: {
          ...previous,
          isLoading: !previous.hasLoaded,
          isRefreshing: previous.hasLoaded,
          error: null,
        },
      };
    });

    const request = loadWearsForMonth(userId, month)
      .then((wears) => {
        if (requestVersion.current === version) {
          updateMonths((current) => ({
            ...current,
            [monthKey]: { wears, hasLoaded: true, isLoading: false, isRefreshing: false, error: null },
          }));
        }
        return wears;
      })
      .catch((error: unknown) => {
        if (requestVersion.current === version) {
          const message = error instanceof Error ? error.message : 'We could not load your outfit history. Please try again.';
          updateMonths((current) => {
            const previous = current[monthKey] ?? emptyMonthState;
            return {
              ...current,
              [monthKey]: { ...previous, isLoading: false, isRefreshing: false, error: message },
            };
          });
        }
        throw error;
      })
      .finally(() => {
        monthRequests.current.delete(monthKey);
      });

    monthRequests.current.set(monthKey, request);
    return request;
  }, [updateMonths, userId]);

  const loadLastWorn = useCallback(async (outfitId: string, options: LoadOptions = {}): Promise<LocalDateKey | null> => {
    if (!userId) throw new Error('Please sign in again before loading outfit history.');
    const existing = lastWornRef.current[outfitId];
    if (!options.force && existing?.hasLoaded) return existing.wornOn;

    const inFlight = lastWornRequests.current.get(outfitId);
    if (inFlight && !options.force) return inFlight;

    const version = requestVersion.current;
    const mutationVersion = lastWornMutationVersions.current.get(outfitId) ?? 0;
    const requestToken = Symbol(outfitId);
    updateLastWorn((current) => ({
      ...current,
      [outfitId]: { ...(current[outfitId] ?? emptyLastWornState), isLoading: true, error: null },
    }));

    const request = loadLastWornDate(userId, outfitId)
      .then((wornOn) => {
        if (requestVersion.current === version && (lastWornMutationVersions.current.get(outfitId) ?? 0) === mutationVersion) {
          updateLastWorn((current) => ({
            ...current,
            [outfitId]: { wornOn, hasLoaded: true, isLoading: false, error: null },
          }));
        }
        return wornOn;
      })
      .catch((error: unknown) => {
        if (requestVersion.current === version && (lastWornMutationVersions.current.get(outfitId) ?? 0) === mutationVersion) {
          const message = error instanceof Error ? error.message : 'We could not load when you last wore this outfit. Please try again.';
          updateLastWorn((current) => ({
            ...current,
            [outfitId]: { ...(current[outfitId] ?? emptyLastWornState), isLoading: false, error: message },
          }));
        }
        throw error;
      })
      .finally(() => {
        if (lastWornRequestTokens.current.get(outfitId) === requestToken) {
          lastWornRequests.current.delete(outfitId);
          lastWornRequestTokens.current.delete(outfitId);
        }
      });

    lastWornRequests.current.set(outfitId, request);
    lastWornRequestTokens.current.set(outfitId, requestToken);
    return request;
  }, [updateLastWorn, userId]);

  const logWear = useCallback(async (outfitId: string, wornOn: LocalDateKey): Promise<OutfitWear> => {
    if (!userId) throw new Error('Please sign in again before logging an outfit.');
    const wear = await logOutfitWear({ userId, outfitId, wornOn });
    const monthKey = toLocalMonthKey(fromLocalDateKey(wear.wornOn));
    invalidateLastWornRequest(outfitId);

    updateMonths((current) => {
      const existing = current[monthKey];
      if (!existing?.hasLoaded) return current;
      return {
        ...current,
        [monthKey]: { ...existing, wears: sortWears([...existing.wears, wear]) },
      };
    });
    updateLastWorn((current) => {
      const existing = current[outfitId] ?? emptyLastWornState;
      return {
        ...current,
        [outfitId]: {
          ...existing,
          wornOn: !existing.wornOn || wear.wornOn > existing.wornOn ? wear.wornOn : existing.wornOn,
          hasLoaded: true,
          error: null,
        },
      };
    });
    void loadLastWorn(outfitId, { force: true }).catch(() => undefined);
    return wear;
  }, [invalidateLastWornRequest, loadLastWorn, updateLastWorn, updateMonths, userId]);

  const removeWear = useCallback(async (wear: OutfitWear) => {
    await removeOutfitWear(wear.id);
    invalidateLastWornRequest(wear.outfitId);
    updateMonths((current) => Object.fromEntries(Object.entries(current).map(([monthKey, state]) => [
      monthKey,
      { ...state, wears: state.wears.filter((item) => item.id !== wear.id) },
    ])));

    if (lastWornRef.current[wear.outfitId]?.wornOn === wear.wornOn) {
      void loadLastWorn(wear.outfitId, { force: true }).catch(() => undefined);
    }
  }, [invalidateLastWornRequest, loadLastWorn, updateMonths]);

  const value = useMemo<HistoryStore>(() => ({
    months,
    lastWornByOutfit,
    getMonthState,
    loadMonth,
    logWear,
    removeWear,
    loadLastWorn,
  }), [getMonthState, lastWornByOutfit, loadLastWorn, loadMonth, logWear, months, removeWear]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useHistory() {
  const store = useContext(Context);
  if (!store) throw new Error('useHistory must be used within HistoryProvider');
  return store;
}
