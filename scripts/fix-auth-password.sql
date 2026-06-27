-- Fix existing users with NULL passwords in shared database
-- These users were created before the password column existed
UPDATE users SET "password" = '' WHERE "password" IS NULL;

-- Also ensure the column has a default going forward
ALTER TABLE users ALTER COLUMN "password" SET DEFAULT '';
