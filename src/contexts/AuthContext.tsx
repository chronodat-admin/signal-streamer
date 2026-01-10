import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserLocationHttps } from '@/lib/geolocation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const locationUpdatedRef = useRef<string | null>(null);

  // Update user location in profile (called on login)
  const updateUserLocation = async (userId: string) => {
    // Prevent duplicate updates for the same user in the same session
    if (locationUpdatedRef.current === userId) return;
    locationUpdatedRef.current = userId;

    try {
      const locationData = await fetchUserLocationHttps();
      if (locationData) {
        const { error } = await supabase
          .from('profiles')
          .update({
            country: locationData.country,
            country_code: locationData.countryCode,
            city: locationData.city,
            timezone: locationData.timezone,
            last_login_at: new Date().toISOString(),
            last_login_ip: locationData.ip,
          })
          .eq('user_id', userId);

        if (error) {
          console.error('[AUTH] Error updating location:', error);
        } else {
          console.log('[AUTH] User location updated:', locationData.city, locationData.country);
        }
      }
    } catch (error) {
      console.error('[AUTH] Error fetching/updating location:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Update location on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(() => updateUserLocation(session.user.id), 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Update location for existing session (page refresh)
      if (session?.user) {
        setTimeout(() => updateUserLocation(session.user.id), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
