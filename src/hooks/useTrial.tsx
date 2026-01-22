import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTrialStatus, type TrialStatus } from '@/lib/planUtils';

export const useTrial = () => {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isExpired: false,
    daysRemaining: null,
    trialEndDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const status = await getTrialStatus(user.id);
        setTrialStatus(status);
      } catch (error) {
        console.error('Error fetching trial status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialStatus();
    
    // Refresh every hour to update days remaining
    const interval = setInterval(fetchTrialStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    ...trialStatus,
    loading,
  };
};
