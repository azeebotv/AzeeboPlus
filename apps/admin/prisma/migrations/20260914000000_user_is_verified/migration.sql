-- Mirror of azeebo_auth.users.isVerified (owned by auth-service). The admin
-- panel's verify/unverify creator actions write through this federated table.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
