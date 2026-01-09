-- Enable Supabase Realtime for signals table
-- This allows real-time subscriptions to INSERT/UPDATE/DELETE events

-- Add signals table to the supabase_realtime publication
-- This is required for Supabase Realtime to work
ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;

-- Ensure the signals table has REPLICA IDENTITY set to FULL
-- This is needed for UPDATE and DELETE events to include all columns
ALTER TABLE public.signals REPLICA IDENTITY FULL;

-- Note: The RLS policies already allow users to SELECT their own signals,
-- which is required for realtime subscriptions to work.


