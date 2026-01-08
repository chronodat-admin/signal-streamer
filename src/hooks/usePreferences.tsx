import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'BTC' | 'ETH';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY' | 'MMM DD, YYYY';

interface Preferences {
  currency: Currency;
  dateFormat: DateFormat;
}

interface PreferencesContextType {
  preferences: Preferences;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: DateFormat) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
}

const defaultPreferences: Preferences = {
  currency: 'USD',
  dateFormat: 'MMM DD, YYYY',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('signalpulse-preferences');
      if (stored) {
        try {
          return { ...defaultPreferences, ...JSON.parse(stored) };
        } catch {
          return defaultPreferences;
        }
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('signalpulse-preferences', JSON.stringify(preferences));
  }, [preferences]);

  const setCurrency = (currency: Currency) => {
    setPreferencesState((prev) => ({ ...prev, currency }));
  };

  const setDateFormat = (format: DateFormat) => {
    setPreferencesState((prev) => ({ ...prev, dateFormat }));
  };

  const updatePreferences = (prefs: Partial<Preferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...prefs }));
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setCurrency,
        setDateFormat,
        updatePreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

