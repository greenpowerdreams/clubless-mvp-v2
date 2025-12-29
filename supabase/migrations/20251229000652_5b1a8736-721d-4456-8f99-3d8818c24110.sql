-- Create event_proposals table
CREATE TABLE public.event_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  instagram_handle TEXT,
  city TEXT NOT NULL,
  event_concept TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  fee_model TEXT NOT NULL,
  profit_summary JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_proposals ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert proposals (public form)
CREATE POLICY "Anyone can submit proposals" 
ON public.event_proposals 
FOR INSERT 
WITH CHECK (true);

-- Allow reading all proposals (for admin dashboard - we'll add proper auth later)
CREATE POLICY "Allow reading proposals" 
ON public.event_proposals 
FOR SELECT 
USING (true);

-- Allow updating proposals (for admin status changes)
CREATE POLICY "Allow updating proposals" 
ON public.event_proposals 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_proposals_updated_at
BEFORE UPDATE ON public.event_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();