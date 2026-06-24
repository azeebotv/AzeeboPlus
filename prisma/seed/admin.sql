-- ###########################################################################
-- WARNING: DEVELOPMENT ONLY - DO NOT RUN IN PRODUCTION!
-- ###########################################################################
-- This file contains a placeholder admin user entry for DEVELOPMENT PURPOSES ONLY.
-- 
-- IMPORTANT SAFEGUARDS:
-- 1. The password hash below is NOT a valid bcrypt hash - authentication will FAIL
-- 2. This user CANNOT log in - the hash format is intentionally invalid
-- 3. Production admin accounts MUST be created via the secure admin setup API
-- 4. NEVER commit real credential hashes to version control
--
-- To set up a real admin user:
-- 1. Deploy the application without running this seed file
-- 2. Use the admin registration endpoint: POST /api/admin/setup
-- 3. The setup flow generates a one-time secret and forces immediate password rotation
-- 4. All admin credentials must be stored in secure vault/secrets manager
--
-- Running this in production will create an admin user that cannot authenticate,
-- requiring manual database cleanup and proper admin setup.
-- ###########################################################################

-- Conditional insert - only runs if AZEEBO_DEV_SEED_ENABLED is set
-- This prevents accidental execution in production environments
DO $$
BEGIN
  IF current_setting('azeebo.dev_seed_enabled', true) = 'true' THEN
    INSERT INTO users (id, email, password, display_name, role, created_at, updated_at)
    VALUES (
      '770e8400-e29b-41d4-a716-446655440001',
      'admin@azeeboplus.com',
      '$2b$12$DEVELOPMENT_ONLY_PLACEHOLDER_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'Admin (Dev Only)',
      'admin',
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    RAISE NOTICE 'DEVELOPMENT SEED: Admin placeholder user inserted (cannot authenticate)';
  ELSE
    RAISE NOTICE 'DEVELOPMENT SEED: Skipped - set azeebo.dev_seed_enabled=true to enable';
  END IF;
END $$;
