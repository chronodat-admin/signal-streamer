import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/hooks/usePreferences';

interface Signal {
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  strategy_id: string;
  created_at: string;
}

export function useSignalNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Don't subscribe if notifications are disabled or no user
    if (!user || !preferences.signalNotifications) {
      // Cleanup existing subscription if notifications were disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Create a unique channel name for this user
    const channelName = `signals:${user.id}`;
    
    // Subscribe to INSERT events on the signals table for this user
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signals',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const signal = payload.new as Signal;
          
          // Fetch strategy name for better notification
          const { data: strategy } = await supabase
            .from('strategies')
            .select('name')
            .eq('id', signal.strategy_id)
            .single();

          const strategyName = strategy?.name || 'Unknown Strategy';
          const signalType = signal.signal_type.toUpperCase();
          const isBuy = signalType === 'BUY' || signalType === 'LONG';
          
          // Show toast notification
          toast({
            title: `${isBuy ? '🟢' : '🔴'} New ${signalType} Signal`,
            description: `${signal.symbol} @ $${signal.price.toLocaleString()} • ${strategyName}`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup on unmount or when notifications disabled
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, toast, preferences.signalNotifications]);

  return null;
}

