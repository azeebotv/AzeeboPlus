-- Admin User Seed
-- This file contains a placeholder entry for the admin user.
-- The password hash below is a SAFE PLACEHOLDER and does NOT correspond to any real password.
-- To set up an actual admin user:
-- 1. Use the admin registration/setup flow in the application
-- 2. Or set the password via a secure admin reset-password flow after first deployment
-- 3. NEVER use the placeholder credentials in production
INSERT INTO users (id, email, password, display_name, role, created_at, updated_at)
VALUES (
  '770e8400-e29b-41d4-a716-446655440001',
  'admin@azeebo.com',
  '$2b$12$PLACEHOLDER_HASH_DO_NOT_USE_IN_PRODUCTION_OR_COMMIT_REAL_CREDENTIALS',
  'Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
