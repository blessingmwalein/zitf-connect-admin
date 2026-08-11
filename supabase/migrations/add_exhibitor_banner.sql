-- Add a banner/cover image column alongside the existing logo_url, and allow
-- authenticated (but not-yet-approved) users to upload their own exhibitor
-- logo/banner during mobile-app onboarding, before their `exhibitors` row
-- even exists.
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT NULL;

-- Storage policy: allow any authenticated user to upload into the existing
-- "exhibitors" bucket's logos/ and banners/ prefixes. The admin web app's
-- logo upload already works today, so a matching policy may already exist —
-- this is written to be idempotent (DROP + CREATE) so it can be safely
-- reconciled against whatever is already configured on the live project.
DROP POLICY IF EXISTS "Authenticated users can upload exhibitor branding" ON storage.objects;
CREATE POLICY "Authenticated users can upload exhibitor branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exhibitors'
    AND (storage.foldername(name))[1] IN ('logos', 'banners')
  );
