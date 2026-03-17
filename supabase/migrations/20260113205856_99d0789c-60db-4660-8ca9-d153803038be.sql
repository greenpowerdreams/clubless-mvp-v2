-- Make vendor-assets bucket private to protect sensitive documents (contracts, licenses, insurance)
-- Avatars, event-images, and venue-images remain public as they display published content

UPDATE storage.buckets 
SET public = false 
WHERE id = 'vendor-assets';

-- Add a SELECT policy for vendor-assets that requires authentication and ownership
-- This ensures only vendors can access their own documents
CREATE POLICY "Vendors can view their own assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all vendor assets for verification purposes
CREATE POLICY "Admins can view all vendor assets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-assets'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);