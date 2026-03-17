-- Fix event_proposals security: require user_id for all proposals

-- 1. Drop the current INSERT policy that allows NULL user_id
DROP POLICY IF EXISTS "Authenticated users can submit proposals" ON public.event_proposals;

-- 2. Create stricter INSERT policy requiring user_id = auth.uid()
CREATE POLICY "Authenticated users can submit proposals"
ON public.event_proposals
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Add NOT NULL constraint to user_id column
-- This ensures all future proposals must have a valid user_id
ALTER TABLE public.event_proposals ALTER COLUMN user_id SET NOT NULL;