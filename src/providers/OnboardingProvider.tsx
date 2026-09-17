import Storage from 'expo-sqlite/kv-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';

const ONBOARDING_COMPLETED_KEY = 'outfit-library.onboarding-completed.v1';

type OnboardingContextValue = {
  completeOnboarding: () => Promise<void>;
  isComplete: boolean;
  isLoading: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void Storage.getItem(ONBOARDING_COMPLETED_KEY)
      .then((value) => {
        if (isMounted) setIsComplete(value === 'true');
      })
      .catch(() => {
        if (isMounted) setIsComplete(false);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await Storage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsComplete(true);
  }, []);

  return <OnboardingContext.Provider value={{ completeOnboarding, isComplete, isLoading }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
}
