-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can read all proposals" ON public.event_proposals;

-- Create a PERMISSIVE SELECT policy so admins can read proposals
CREATE POLICY "Admins can read all proposals"
ON public.event_proposals
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for admins only
CREATE POLICY "Admins can delete proposals"
ON public.event_proposals
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));