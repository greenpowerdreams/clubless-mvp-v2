-- Create waitlist_signups table for pre-launch email capture
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  interest_type TEXT NOT NULL DEFAULT 'attendee' CHECK (interest_type IN ('attendee', 'creator', 'vendor')),
  city TEXT NOT NULL DEFAULT 'Seattle',
  source_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one email per interest type
  CONSTRAINT unique_email_interest UNIQUE (email, interest_type)
);

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (no auth required for waitlist signup)
CREATE POLICY "Anyone can join waitlist" 
  ON public.waitlist_signups 
  FOR INSERT 
  WITH CHECK (true);

-- Only admins can view waitlist signups
CREATE POLICY "Admins can view waitlist" 
  ON public.waitlist_signups 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage all waitlist entries
CREATE POLICY "Admins can manage waitlist" 
  ON public.waitlist_signups 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for email lookups
CREATE INDEX idx_waitlist_email ON public.waitlist_signups(email);
CREATE INDEX idx_waitlist_created ON public.waitlist_signups(created_at DESC);