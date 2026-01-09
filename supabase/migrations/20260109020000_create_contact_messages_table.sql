-- Create contact_messages table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email_created ON public.contact_messages(email, created_at DESC);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone (including anonymous users) can insert contact messages (public form)
-- WITH CHECK (true) allows all users, including anonymous, to insert
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Admins can view all contact messages
CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update contact message status
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update updated_at
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_contact_messages_updated_at();

-- Function to check rate limiting (prevent spam)
-- Allows max 3 messages per email per hour
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM public.contact_messages
  WHERE email = _email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow max 3 messages per hour per email
  RETURN message_count < 3;
END;
$$;

-- Add a check constraint or trigger to enforce rate limiting
-- Note: This is a soft check - you may want to handle this in application code
-- for better user experience (showing error messages)

