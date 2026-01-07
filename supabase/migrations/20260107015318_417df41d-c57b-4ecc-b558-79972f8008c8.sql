-- Create plan enum
CREATE TYPE public.plan_type AS ENUM ('FREE', 'PRO', 'ELITE');

-- Create profiles table (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan plan_type NOT NULL DEFAULT 'FREE',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create strategies table
CREATE TABLE public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  exchange TEXT,
  timeframe TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  secret_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  slug TEXT UNIQUE,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create signals table
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  price NUMERIC NOT NULL,
  signal_time TIMESTAMPTZ NOT NULL,
  interval TEXT,
  raw_payload JSONB,
  alert_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX idx_strategies_slug ON public.strategies(slug);
CREATE INDEX idx_strategies_secret_token ON public.strategies(secret_token);
CREATE INDEX idx_signals_strategy_id ON public.signals(strategy_id);
CREATE INDEX idx_signals_user_id ON public.signals(user_id);
CREATE INDEX idx_signals_created_at ON public.signals(created_at);
CREATE INDEX idx_signals_alert_id ON public.signals(alert_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Strategies policies
CREATE POLICY "Users can view their own strategies"
  ON public.strategies FOR SELECT
  USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Public can view public strategies"
  ON public.strategies FOR SELECT
  USING (is_public = true AND is_deleted = false);

CREATE POLICY "Users can insert their own strategies"
  ON public.strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
  ON public.strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
  ON public.strategies FOR DELETE
  USING (auth.uid() = user_id);

-- Signals policies
CREATE POLICY "Users can view their own signals"
  ON public.signals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view signals for public strategies"
  ON public.signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      WHERE s.id = strategy_id
      AND s.is_public = true
      AND s.is_deleted = false
    )
  );

CREATE POLICY "Users can insert their own signals"
  ON public.signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get strategy by secret token (for webhook validation)
CREATE OR REPLACE FUNCTION public.get_strategy_by_token(token_value TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  is_deleted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.user_id, s.name, s.is_deleted
  FROM public.strategies s
  WHERE s.secret_token = token_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to count user strategies (for plan enforcement)
CREATE OR REPLACE FUNCTION public.count_user_strategies(uid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.strategies
    WHERE user_id = uid AND is_deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(uid UUID)
RETURNS plan_type AS $$
BEGIN
  RETURN (
    SELECT plan
    FROM public.profiles
    WHERE user_id = uid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;