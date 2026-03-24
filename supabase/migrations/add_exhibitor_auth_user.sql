-- Link exhibitor to their Supabase auth user (mobile app account)
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS auth_user_id UUID DEFAULT NULL;
ALTER TABLE exhibitors ADD CONSTRAINT exhibitors_auth_user_id_unique UNIQUE (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_auth_user_id ON exhibitors(auth_user_id) WHERE auth_user_id IS NOT NULL;
