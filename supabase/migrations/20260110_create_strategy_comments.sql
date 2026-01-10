-- Create strategy_comments table for public strategy discussions
CREATE TABLE IF NOT EXISTS public.strategy_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.strategy_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_strategy_comments_strategy_id ON public.strategy_comments(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_comments_user_id ON public.strategy_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_comments_parent_id ON public.strategy_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_strategy_comments_created_at ON public.strategy_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.strategy_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments on public strategies
CREATE POLICY "Anyone can read comments on public strategies"
  ON public.strategy_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies
      WHERE strategies.id = strategy_comments.strategy_id
      AND strategies.is_public = true
      AND strategies.is_deleted = false
    )
  );

-- Policy: Only authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
  ON public.strategy_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.strategies
      WHERE strategies.id = strategy_comments.strategy_id
      AND strategies.is_public = true
      AND strategies.is_deleted = false
    )
  );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.strategy_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments (soft delete)
CREATE POLICY "Users can delete their own comments"
  ON public.strategy_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_deleted = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategy_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_strategy_comments_updated_at
  BEFORE UPDATE ON public.strategy_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_comments_updated_at();

