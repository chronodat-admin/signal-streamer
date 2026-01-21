import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'BTC' | 'ETH';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY' | 'MMM DD, YYYY';

interface Preferences {
  currency: Currency;
  dateFormat: DateFormat;
  signalNotifications: boolean;
  aiInsightsEnabled: boolean;
}

interface PreferencesContextType {
  preferences: Preferences;
  setCurrency: (currency: Currency) => void;
  setDateFormat: (format: DateFormat) => void;
  setSignalNotifications: (enabled: boolean) => void;
  setAiInsightsEnabled: (enabled: boolean) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
}

const defaultPreferences: Preferences = {
  currency: 'USD',
  dateFormat: 'MMM DD, YYYY',
  signalNotifications: true,
  aiInsightsEnabled: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferencesState] = useState<Preferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('trademoq-preferences');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Validate that parsed values are strings and create a clean object
          const loaded: Preferences = {
            currency: (typeof parsed.currency === 'string' && parsed.currency)
              ? (parsed.currency as Currency)
              : defaultPreferences.currency,
            dateFormat: (typeof parsed.dateFormat === 'string' && parsed.dateFormat)
              ? (parsed.dateFormat as DateFormat)
              : defaultPreferences.dateFormat,
            signalNotifications: typeof parsed.signalNotifications === 'boolean'
              ? parsed.signalNotifications
              : defaultPreferences.signalNotifications,
            aiInsightsEnabled: typeof parsed.aiInsightsEnabled === 'boolean'
              ? parsed.aiInsightsEnabled
              : defaultPreferences.aiInsightsEnabled,
          };
          return loaded;
        } catch {
          return defaultPreferences;
        }
      }
    }
    return defaultPreferences;
  });

  // Fetch AI insights preference from database on mount
  useEffect(() => {
    const fetchAiPreference = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('ai_insights_enabled')
          .eq('user_id', user.id)
          .single();
        
        if (profile && typeof profile.ai_insights_enabled === 'boolean') {
          setPreferencesState(prev => ({
            ...prev,
            aiInsightsEnabled: profile.ai_insights_enabled,
          }));
        }
      }
    };
    fetchAiPreference();
  }, []);

  useEffect(() => {
    try {
      // Validate that both values are strings before attempting to save
      const currency = preferences.currency;
      const dateFormat = preferences.dateFormat;
      
      if (typeof currency !== 'string' || typeof dateFormat !== 'string') {
        console.error('Invalid preference values detected:', { currency, dateFormat });
        // Reset to defaults if invalid
        setPreferencesState(defaultPreferences);
        localStorage.setItem('trademoq-preferences', JSON.stringify(defaultPreferences));
        return;
      }

      // Only stringify plain object data, not React components or DOM elements
      // Create a fresh object with only the serializable properties
      const serializable: Preferences = {
        currency: currency as Currency,
        dateFormat: dateFormat as DateFormat,
        signalNotifications: preferences.signalNotifications,
        aiInsightsEnabled: preferences.aiInsightsEnabled,
      };
      
      // Double-check that the object is serializable
      const testStringify = JSON.stringify(serializable);
      if (!testStringify) {
        throw new Error('Failed to stringify preferences');
      }
      
      localStorage.setItem('trademoq-preferences', testStringify);
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
      // If there's an error, try to save with default values as fallback
      try {
        localStorage.setItem('trademoq-preferences', JSON.stringify(defaultPreferences));
        setPreferencesState(defaultPreferences);
      } catch (fallbackError) {
        console.error('Error saving default preferences:', fallbackError);
      }
    }
    // Only depend on the actual values, not the object reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.currency, preferences.dateFormat, preferences.signalNotifications, preferences.aiInsightsEnabled]);

  const setCurrency = (currency: Currency) => {
    // Validate that currency is a valid string value
    if (typeof currency !== 'string' || !currency) {
      console.error('Invalid currency value:', currency);
      return;
    }
    // Create a completely fresh object to avoid any non-serializable properties
    setPreferencesState((prev) => ({
      currency: currency as Currency,
      dateFormat: prev.dateFormat,
      signalNotifications: prev.signalNotifications,
      aiInsightsEnabled: prev.aiInsightsEnabled,
    }));
  };

  const setDateFormat = (format: DateFormat) => {
    // Validate that format is a valid string value
    if (typeof format !== 'string' || !format) {
      console.error('Invalid dateFormat value:', format);
      return;
    }
    // Create a completely fresh object to avoid any non-serializable properties
    setPreferencesState((prev) => ({
      currency: prev.currency,
      dateFormat: format as DateFormat,
      signalNotifications: prev.signalNotifications,
      aiInsightsEnabled: prev.aiInsightsEnabled,
    }));
  };

  const setSignalNotifications = (enabled: boolean) => {
    setPreferencesState((prev) => ({
      currency: prev.currency,
      dateFormat: prev.dateFormat,
      signalNotifications: enabled,
      aiInsightsEnabled: prev.aiInsightsEnabled,
    }));
  };

  const setAiInsightsEnabled = async (enabled: boolean) => {
    // Update local state immediately
    setPreferencesState((prev) => ({
      currency: prev.currency,
      dateFormat: prev.dateFormat,
      signalNotifications: prev.signalNotifications,
      aiInsightsEnabled: enabled,
    }));

    // Sync to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ ai_insights_enabled: enabled })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error saving AI insights preference:', error);
        }
      }
    } catch (error) {
      console.error('Error updating AI insights preference:', error);
    }
  };

  const updatePreferences = (prefs: Partial<Preferences>) => {
    // Validate and sanitize preferences before updating
    // Create a completely fresh object to avoid any non-serializable properties
    setPreferencesState((prev) => {
      const updated: Preferences = {
        currency: (prefs.currency && typeof prefs.currency === 'string') 
          ? (prefs.currency as Currency) 
          : prev.currency,
        dateFormat: (prefs.dateFormat && typeof prefs.dateFormat === 'string')
          ? (prefs.dateFormat as DateFormat)
          : prev.dateFormat,
        signalNotifications: typeof prefs.signalNotifications === 'boolean'
          ? prefs.signalNotifications
          : prev.signalNotifications,
        aiInsightsEnabled: typeof prefs.aiInsightsEnabled === 'boolean'
          ? prefs.aiInsightsEnabled
          : prev.aiInsightsEnabled,
      };
      return updated;
    });
  };

  // Create a fresh preferences object to ensure no non-serializable properties leak through
  const cleanPreferences: Preferences = {
    currency: preferences.currency,
    dateFormat: preferences.dateFormat,
    signalNotifications: preferences.signalNotifications,
    aiInsightsEnabled: preferences.aiInsightsEnabled,
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences: cleanPreferences,
        setCurrency,
        setDateFormat,
        setSignalNotifications,
        setAiInsightsEnabled,
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

