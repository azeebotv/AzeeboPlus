-- Add tip settings to CreatorProfile for the portal Monetization page
ALTER TABLE "creator_profiles" ADD COLUMN "tipEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "creator_profiles" ADD COLUMN "tipMin" DECIMAL(18,2) NOT NULL DEFAULT 1;
ALTER TABLE "creator_profiles" ADD COLUMN "tipMax" DECIMAL(18,2) NOT NULL DEFAULT 100;
