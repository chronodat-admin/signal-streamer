-- Enable Supabase Realtime for profiles table
-- This allows real-time subscriptions to UPDATE events for plan changes

-- Add profiles table to the supabase_realtime publication
-- This is required for Supabase Realtime to work
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Ensure the profiles table has REPLICA IDENTITY set to FULL
-- This is needed for UPDATE events to include all columns
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Note: The RLS policies already allow users to SELECT their own profile,
-- which is required for realtime subscriptions to work.


