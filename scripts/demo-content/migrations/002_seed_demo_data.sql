-- =============================================================================
-- Azeebo+ Demo Content Seed Data v1.0.0
-- Realistic Nigerian entertainment platform data for E2E testing.
-- All UUIDs are fixed for reproducibility across environments.
-- Passwords are bcrypt hashes of "Demo123!" for all test users.
-- =============================================================================

-- BEGIN removed: each INSERT is now independent so failures don't cascade

-- ============================================================================
-- SECTION 1: SYSTEM SETTINGS
-- ============================================================================

INSERT INTO "system_settings" (id, "key", value, category, "description", "isPublic", "createdAt", "updatedAt") VALUES
  ('ss00001-0000-0000-0000-000000000001', 'site_name', '"Azeebo+"', 'general', 'Platform name', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000002', 'site_description', '"Nigeria''s premier entertainment streaming platform"', 'general', 'Platform tagline', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000003', 'maintenance_mode', 'false', 'general', 'Maintenance mode toggle', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000004', 'registration_enabled', 'true', 'auth', 'Allow new registrations', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000005', 'max_upload_size_mb', '500', 'uploads', 'Maximum file upload size in MB', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000006', 'default_currency', '"NGN"', 'payments', 'Default transaction currency', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000007', 'currency_symbol', '"₦"', 'payments', 'Currency display symbol', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000008', 'min_rental_price', '200', 'payments', 'Minimum rental price in NGN', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000009', 'max_rental_price', '50000', 'payments', 'Maximum rental price in NGN', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000010', 'featured_content_limit', '6', 'content', 'Max featured items on homepage', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000011', 'trending_window_hours', '168', 'content', 'Hours to consider for trending calc', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000012', 'comment_max_length', '2000', 'content', 'Max comment character length', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000013', 'screening_max_viewers', '10000', 'screenings', 'Default max viewers per screening', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000014', 'otp_expiry_minutes', '10', 'auth', 'OTP code expiration in minutes', false, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000015', 'social_google_enabled', 'true', 'social', 'Google OAuth login enabled', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000016', 'social_apple_enabled', 'true', 'social', 'Apple Sign-In enabled', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000017', 'seo_title', '"Azeebo+ - Stream Nigerian Entertainment"', 'seo', 'Default SEO title', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000018', 'seo_description', '"Watch reality shows, creator content, lifestyle, movies and more on Azeebo+"', 'seo', 'Default SEO description', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000019', 'support_email', '"support@azeeboplus.com"', 'contact', 'Support email address', true, NOW(), NOW()),
  ('ss00001-0000-0000-0000-000000000020', 'terms_url', '"https://azeeboplus.com/terms"', 'legal', 'Terms of service URL', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 2: USERS (Auth Service)
-- ============================================================================

-- Password hash for "Demo123!" (bcrypt, generated with bcrypt.hashSync("Demo123!", 10))
-- $2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.

INSERT INTO "users" (id, email, password, "displayName", avatar, role, "isVerified", "createdAt", "updatedAt") VALUES
  -- Admin users
  ('a0000001-0000-0000-0000-000000000001', 'admin@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Admin Chidi', '/images/placeholders/avatars/100x100_09.png', 'admin', true, '2025-01-01T00:00:00Z', NOW()),
  ('a0000001-0000-0000-0000-000000000002', 'moderator@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Mod Amina', '/images/placeholders/avatars/100x100_10.png', 'moderator', true, '2025-01-15T00:00:00Z', NOW()),
  -- Creator users
  ('a0000001-0000-0000-0000-000000000003', 'creator1@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Tunde Creates', '/images/placeholders/avatars/100x100_11.png', 'user', true, '2025-02-01T00:00:00Z', NOW()),
  ('a0000001-0000-0000-0000-000000000004', 'creator2@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Ngozi Vibes', '/images/placeholders/avatars/100x100_12.png', 'user', true, '2025-02-15T00:00:00Z', NOW()),
  ('a0000001-0000-0000-0000-000000000005', 'creator3@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Emeka Studios', '/images/placeholders/avatars/100x100_01.png', 'user', true, '2025-02-15T00:00:00Z', NOW()),
  -- Regular user (viewer)
  ('a0000001-0000-0000-0000-000000000006', 'user1@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Kemi Watch', '/images/placeholders/avatars/100x100_02.png', 'user', true, '2025-03-01T00:00:00Z', NOW()),
  ('a0000001-0000-0000-0000-000000000007', 'user2@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Olumide F', '/images/placeholders/avatars/100x100_03.png', 'user', true, '2025-03-01T00:00:00Z', NOW()),
  ('a0000001-0000-0000-0000-000000000008', 'user3@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Fatima A', '/images/placeholders/avatars/100x100_04.png', 'user', true, '2025-03-01T00:00:00Z', NOW()),
  -- Inactive / banned user (for edge-case testing)
  ('a0000001-0000-0000-0000-000000000009', 'banned@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Chukwu M', NULL, 'user', true, '2025-02-20T00:00:00Z', NOW()),
  ('a0000001-0000-0000-0000-000000000010', 'unverified@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Yemi O', NULL, 'user', false, '2025-05-01T00:00:00Z', NOW()),
  -- Sports creator
  ('a0000001-0000-0000-0000-000000000011', 'sportscreator@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Chinedu Sports', '/images/placeholders/avatars/100x100_05.png', 'user', true, '2025-03-15T00:00:00Z', NOW()),
  -- Gaming creator
  ('a0000001-0000-0000-0000-000000000012', 'gamer@azeeboplus.com', '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.', 'Tunde Gaming', '/images/placeholders/avatars/100x100_06.png', 'user', true, '2025-04-01T00:00:00Z', NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  "displayName" = EXCLUDED."displayName",
  avatar = EXCLUDED.avatar,
  role = EXCLUDED.role,
  "isVerified" = EXCLUDED."isVerified";

-- ============================================================================
-- SECTION 3: USER ROLES
-- ============================================================================

INSERT INTO "user_roles" (id, "userId", role, "grantedBy", "createdAt") VALUES
   ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'admin', 'system', '2025-01-01T00:00:00Z'),
   ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'moderator', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z'),
   ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z'),
   ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z'),
   ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z'),
   ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000011', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-03-10T00:00:00Z'),
   ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000012', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-04-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 4: USER PROFILES (User Service)
-- ============================================================================

INSERT INTO "user_profiles" (id, "userId", "displayName", avatar, bio, location, "isPublic", "createdAt", "updatedAt") VALUES
   ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Admin Chidi', '/images/placeholders/avatars/100x100_07.png'),
   ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Mod Amina', '/images/placeholders/avatars/100x100_08.png'),
   ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Tunde Creates', '/images/placeholders/avatars/100x100_09.png'),
   ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Ngozi Vibes', '/images/placeholders/avatars/100x100_10.png'),
   ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Emeka Studios', '/images/placeholders/avatars/100x100_11.png'),
   ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'Kemi Watch', '/images/placeholders/avatars/100x100_12.png'),
   ('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'Olumide F', '/images/placeholders/avatars/100x100_01.png'),
   ('c0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'Fatima A', '/images/placeholders/avatars/100x100_02.png'),
   ('c0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000011', 'Chinedu Sports', '/images/placeholders/avatars/100x100_03.png'),
   ('c0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000012', 'Tunde Gaming', '/images/placeholders/avatars/100x100_04.png'),
   ('c0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000009', 'Chukwu M', NULL, 'Former user (banned)', NULL, false, '2025-02-20T00:00:00Z', '2025-02-20T00:00:00Z'),
   ('c0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000010', 'Yemi O', NULL, 'Unverified account', NULL, false, '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET "displayName" = EXCLUDED."displayName", avatar = EXCLUDED.avatar, bio = EXCLUDED.bio, location = EXCLUDED.location, "isPublic" = EXCLUDED."isPublic";

-- ============================================================================
-- SECTION 5: USER PREFERENCES
-- ============================================================================

INSERT INTO "user_preferences" (id, "userId", "darkMode", notifications, "contentPreferences", "privacySettings") VALUES
   ('d0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', false, '{}', '[]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', false, '{}', '[]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', true, '{}', '["reality","comedy","music","vertical"]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', false, '{}', '["creator","lifestyle","vertical"]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', false, '{}', '["movies","nollywood","vertical"]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', true, '{"email":true,"push":true,"sms":false}', '["reality","comedy","music"]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', false, '{"email":true,"push":false,"sms":true}', '["sports","comedy","games"]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', true, '{"email":false,"push":true,"sms":false}', '["reality","lifestyle","music"]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000009', false, '{}', '[]', '{"isPrivate":true,"showActivity":false,"allowMessages":false,"twoFactorEnabled":false}'),
   ('d0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000010', false, '{}', '[]', '{"isPrivate":false,"showActivity":true,"allowMessages":true,"twoFactorEnabled":false}')
ON CONFLICT (id) DO UPDATE SET "darkMode" = EXCLUDED."darkMode", notifications = EXCLUDED.notifications, "contentPreferences" = EXCLUDED."contentPreferences", "privacySettings" = EXCLUDED."privacySettings";

-- ============================================================================
-- SECTION 6: UNIVERSES
-- ============================================================================

INSERT INTO "universes" (id, name, "displayName", description, icon, color, "isEnabled", "sortOrder") VALUES
   ('u0000001-0000-0000-0000-000000000001', 'reality', 'Reality TV', 'Nigerian reality shows including Big Brother, dating shows, and competition series.', '🎬', '#E91E63', true, 1),
   ('u0000001-0000-0000-0000-000000000002', 'creator', 'Creator Content', 'Original content from top Nigerian creators, vlogs, and independent productions.', '🎨', '#9C27B0', true, 2),
   ('u0000001-0000-0000-0000-000000000003', 'lifestyle', 'Lifestyle', 'Fashion, food, travel, wellness, and everyday Nigerian living.', '🏠', '#FF9800', true, 3),
   ('u0000001-0000-0000-0000-000000000004', 'movies', 'Movies', 'Nollywood blockbusters, indie films, and cinematic masterpieces.', '🎥', '#2196F3', true, 4),
   ('u0000001-0000-0000-0000-000000000005', 'comedy', 'Comedy', 'Stand-up specials, comedy sketches, and hilarious Naija content.', '😂', '#FFEB3B', true, 5),
   ('u0000001-0000-0000-0000-000000000006', 'sports', 'Sports', 'Football highlights, basketball, athletics, and sports commentary.', '⚽', '#4CAF50', true, 6),
   ('u0000001-0000-0000-0000-000000000007', 'music', 'Music', 'Music videos, concert recordings, acoustic sessions, and behind-the-scenes.', '🎵', '#FF5722', true, 7),
   ('u0000001-0000-0000-0000-000000000008', 'games', 'Gaming', 'Nigerian gaming content, esports, reviews, and live streams.', '🎮', '#607D8B', true, 8),
   ('u0000001-0000-0000-0000-000000000009', 'vertical', 'Vertical Series', 'Premium African storytelling with interconnected characters and lore.', '📖', '#8B5CF6', true, 9)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 7: CATEGORIES
-- ============================================================================

INSERT INTO "categories" (id, name, slug, description, icon, color) VALUES
  ('cat00001-0000-0000-0000-000000000001', 'Trending Now', 'trending-now', 'Currently popular content', '🔥', '#F44336'),
  ('cat00001-0000-0000-0000-000000000002', 'New Releases', 'new-releases', 'Freshly published content', '✨', '#FF9800'),
  ('cat00001-0000-0000-0000-000000000003', 'Editor Picks', 'editor-picks', 'Handpicked by our editorial team', '⭐', '#FFD700'),
  ('cat00001-0000-0000-0000-000000000004', 'Exclusive', 'exclusive', 'Only on Azeebo+', '👑', '#9C27B0'),
  ('cat00001-0000-0000-0000-000000000005', 'Free Content', 'free-content', 'Watch for free', '🆓', '#4CAF50'),
  ('cat00001-0000-0000-0000-000000000006', 'Live Events', 'live-events', 'Upcoming and live screenings', '📡', '#E91E63'),
  ('cat00001-0000-0000-0000-000000000007', 'Nollywood Classics', 'nollywood-classics', 'Timeless Nigerian cinema classics', '🎞️', '#795548'),
  ('cat00001-0000-0000-0000-000000000008', 'Documentaries', 'documentaries', 'Real stories, real impact', '📽️', '#607D8B')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 8: TAGS
-- ============================================================================

INSERT INTO "tags" (id, name, description) VALUES
  ('tag00001-0000-0000-0000-000000000001', 'naija', 'Nigerian content'),
  ('tag00001-0000-0000-0000-000000000002', 'big-brother', 'Big Brother related'),
  ('tag00001-0000-0000-0000-000000000003', 'nollywood', 'Nigerian cinema'),
  ('tag00001-0000-0000-0000-000000000004', 'afrobeats', 'Afrobeats music'),
  ('tag00001-0000-0000-0000-000000000005', 'comedy', 'Funny content'),
  ('tag00001-0000-0000-0000-000000000006', 'fashion', 'Fashion and style'),
  ('tag00001-0000-0000-0000-000000000007', 'food', 'Food and cooking'),
  ('tag00001-0000-0000-0000-000000000008', 'football', 'Football content'),
  ('tag00001-0000-0000-0000-000000000009', 'reality-show', 'Reality show content'),
  ('tag00001-0000-0000-0000-000000000010', 'premiere', 'Premiere releases'),
  ('tag00001-0000-0000-0000-000000000011', 'behind-the-scenes', 'BTS content'),
  ('tag00001-0000-0000-0000-000000000012', 'exclusive', 'Exclusive content'),
  ('tag00001-0000-0000-0000-000000000013', 'documentary', 'Documentary content'),
  ('tag00001-0000-0000-0000-000000000014', 'gaming', 'Gaming content'),
  ('tag00001-0000-0000-0000-000000000015', 'live', 'Live content')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 9: CONTENT ITEMS (30 items across all universes)
-- ============================================================================

-- Use 'a0000001-0000-0000-0000-000000000003' as Tunde Creates (creator)
-- Use 'a0000001-0000-0000-0000-000000000004' as Ngozi Vibes (creator)
-- Use 'a0000001-0000-0000-0000-000000000005' as Emeka Studios (creator)

INSERT INTO "content_items" (id, title, description, thumbnail, "mediaUrl", "universeId", "creatorId", status, "viewCount", "publishedAt", "releaseDate", "windowType", "isExclusive", "isPremiere", metadata) VALUES
  -- Reality TV (6 items)
  ('cnt00001-0000-0000-0000-000000000001', 'BBNaija Season 10: Day 45 Highlights', 'The drama intensifies as housemates face the latest nomination challenge. Who will survive the week?', '/images/placeholders/content/800x450_01.png', 'https://www.youtube.com/watch?v=iS1g8A-n85o', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 245000, '2025-06-15T20:00:00Z', '2025-06-15T20:00:00Z', 'premium', true, true, '{"duration":3600,"episode":45,"season":10,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000002', 'The Real Housewives of Lagos S2 E3', 'The ladies of Lagos bring the glamour and the shade in another explosive episode.', '/images/placeholders/content/800x450_02.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 189000, '2025-06-12T20:00:00Z', '2025-06-12T20:00:00Z', 'standard', false, false, '{"duration":2700,"episode":3,"season":2,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000003', 'Nigerian Idol S9: Audition Highlights', 'The most emotional and hilarious auditions from this season of Nigerian Idol.', '/images/placeholders/content/800x450_03.png', 'https://www.youtube.com/watch?v=nfWlot6h_JM', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 312000, '2025-06-01T18:00:00Z', '2025-06-01T18:00:00Z', 'standard', false, false, '{"duration":4200,"episode":1,"season":9,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000004', 'Love Island Naija: Coupling Ceremony', 'New couples are formed as the islanders make their most important decisions yet.', '/images/placeholders/content/800x450_04.png', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 156000, '2025-06-10T21:00:00Z', '2025-06-10T21:00:00Z', 'premium', true, false, '{"duration":3300,"episode":8,"season":3,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000005', 'Cooking with Chioma: Jollof Rice Battle', 'Chef Chioma takes on the ultimate jollof rice challenge - Ghana vs Nigeria!', '/images/placeholders/content/800x450_05.png', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 89000, '2025-06-08T14:00:00Z', '2025-06-08T14:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000006', 'Survivor Naija: Immunity Challenge', 'Tribes clash in the most physically demanding immunity challenge of the season.', '/images/placeholders/content/800x450_06.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'published', 67000, '2025-06-05T19:00:00Z', '2025-06-05T19:00:00Z', 'standard', false, false, '{"duration":2400,"episode":12,"season":2,"language":"en"}'),

  -- Creator Content (6 items)
  ('cnt00001-0000-0000-0000-000000000007', 'Lagos to Abuja Road Trip Vlog', 'Join me on an epic 12-hour road trip from Lagos to Abuja with unexpected stops and encounters.', '/images/placeholders/content/800x450_07.png', 'https://www.youtube.com/watch?v=hT_nvWreIhg', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 78000, '2025-06-14T10:00:00Z', '2025-06-14T10:00:00Z', 'basic', false, false, '{"duration":2400,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000008', 'My Apartment Tour - Lagos Luxury', 'Full tour of my new Lagos apartment. From empty space to dream home in 3 months!', '/images/placeholders/content/800x450_08.png', 'https://www.youtube.com/watch?v=iS1g8A-n85o', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 234000, '2025-06-11T15:00:00Z', '2025-06-11T15:00:00Z', 'basic', false, false, '{"duration":1500,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000009', 'Day in My Life as a Nigerian Creator', 'A raw and real look at what it takes to create content in Lagos.', '/images/placeholders/content/800x450_09.png', 'https://www.youtube.com/watch?v=iS1g8A-n85o', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 156000, '2025-06-09T09:00:00Z', '2025-06-09T09:00:00Z', 'basic', false, false, '{"duration":1200,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000010', 'Reacting to My Old Videos', 'Looking back at my earliest content. Cringe alert! But also growth.', '/images/placeholders/content/800x450_10.png', 'https://www.youtube.com/watch?v=CevxZvSJLk8', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 92000, '2025-06-07T12:00:00Z', '2025-06-07T12:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000011', 'How I Started: My Creator Journey', 'From zero to 500K followers - the real story behind the success.', '/images/placeholders/content/800x450_11.png', 'https://www.youtube.com/watch?v=9bZkp7q19f0', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 187000, '2025-05-28T11:00:00Z', '2025-05-28T11:00:00Z', 'basic', false, false, '{"duration":2100,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000012', 'Ngozi x Zara Collaboration BTS', 'Behind the scenes of our latest fashion collaboration shoot in Lagos.', '/images/placeholders/content/800x450_12.png', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 45000, '2025-06-13T16:00:00Z', '2025-06-13T16:00:00Z', 'standard', false, false, '{"duration":900,"language":"en"}'),

  -- Lifestyle (5 items)
  ('cnt00001-0000-0000-0000-000000000013', 'Lagos Street Food Guide: Yaba Edition', 'The ultimate guide to the best street food spots in Yaba, Lagos.', '/images/placeholders/content/800x450_13.png', 'https://www.youtube.com/watch?v=aJOTlE1af9U', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 67000, '2025-06-06T13:00:00Z', '2025-06-06T13:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en","location":"Yaba, Lagos"}'),
  ('cnt00001-0000-0000-0000-000000000014', 'My Skincare Routine for Nigerian Weather', 'Tested and trusted skincare products that work in our tropical climate.', '/images/placeholders/content/800x450_14.png', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 123000, '2025-06-04T08:00:00Z', '2025-06-04T08:00:00Z', 'basic', false, false, '{"duration":900,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000015', 'Abuja Weekend Getaway Guide', 'Best spots to visit in Abuja this weekend. From restaurants to nature parks.', '/images/placeholders/content/800x450_15.png', 'https://www.youtube.com/watch?v=aJOTlE1af9U', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 34000, '2025-05-30T09:00:00Z', '2025-05-30T09:00:00Z', 'basic', false, false, '{"duration":2400,"language":"en","location":"Abuja"}'),
  ('cnt00001-0000-0000-0000-000000000016', 'Nigerian Wedding Lookbook 2025', 'Top wedding guest outfit ideas for the 2025 Nigerian wedding season.', '/images/placeholders/content/800x450_16.png', 'https://www.youtube.com/watch?v=YQHsXMglC9A', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 89000, '2025-06-02T10:00:00Z', '2025-06-02T10:00:00Z', 'standard', false, false, '{"duration":1500,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000017', 'Home Workout: No Equipment Needed', 'Full body workout routine you can do at home. No gym required!', '/images/placeholders/content/800x450_17.png', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'published', 56000, '2025-05-25T07:00:00Z', '2025-05-25T07:00:00Z', 'basic', false, false, '{"duration":2700,"language":"en"}'),

  -- Movies (5 items)
  ('cnt00001-0000-0000-0000-000000000018', 'Lagos King: The Return', 'A retired crime lord must return to his old ways when his family is threatened. Epic Nollywood action thriller.', '/images/placeholders/content/800x450_18.png', 'https://www.youtube.com/watch?v=YQHsXMglC9A', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 456000, '2025-05-20T18:00:00Z', '2025-05-20T18:00:00Z', 'premium', true, true, '{"duration":7200,"genre":"action/thriller","language":"en","rating":"16+"}'),
  ('cnt00001-0000-0000-0000-000000000019', 'Ada of Lagos', 'A young woman navigates love, career, and family expectations in modern Lagos.', '/images/placeholders/content/800x450_19.png', 'https://www.youtube.com/watch?v=rYEDAozJrWw', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 234000, '2025-06-01T17:00:00Z', '2025-06-01T17:00:00Z', 'standard', false, false, '{"duration":6600,"genre":"drama/romance","language":"en","rating":"12+"}'),
  ('cnt00001-0000-0000-0000-000000000020', 'The Ghost of₦aira Falls', 'A supernatural thriller set in a small Nigerian town with a dark secret.', '/images/placeholders/content/800x450_20.png', 'https://www.youtube.com/watch?v=5GoGJuY-moM', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 123000, '2025-06-10T19:00:00Z', '2025-06-10T19:00:00Z', 'standard', false, false, '{"duration":5400,"genre":"horror/thriller","language":"en","rating":"18+"}'),
  ('cnt00001-0000-0000-0000-000000000021', 'Hustle in Victoria Island', 'Three friends risk everything on a tech startup in Lagos. Based on true events.', '/images/placeholders/content/800x450_21.png', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 89000, '2025-06-08T16:00:00Z', '2025-06-08T16:00:00Z', 'basic', false, false, '{"duration":6000,"genre":"drama/comedy","language":"en","rating":"12+"}'),
  ('cnt00001-0000-0000-0000-000000000022', 'Love at First Jollof', 'A romantic comedy about two food bloggers who keep meeting at the same jollof rice competition.', '/images/placeholders/content/800x450_22.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'published', 178000, '2025-06-14T17:00:00Z', '2025-06-14T17:00:00Z', 'standard', false, false, '{"duration":5400,"genre":"romcom","language":"en","rating":"PG"}'),

  -- Comedy (4 items)
  ('cnt00001-0000-0000-0000-000000000023', 'AY Live 2025: Full Show', 'The biggest comedy show of the year. AY, Bovi, Akpororo, and more deliver non-stop laughs.', '/images/placeholders/content/800x450_23.png', 'https://www.youtube.com/watch?v=09R8_2nJtjg', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 567000, '2025-04-15T19:00:00Z', '2025-04-15T19:00:00Z', 'premium', true, false, '{"duration":10800,"genre":"stand-up/comedy","language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000024', 'Mark Angel Comedy: Episode 345', 'When Emmanuelle tries to write an exam without studying. Classic Naija comedy.', '/images/placeholders/content/800x450_24.png', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 890000, '2025-06-12T14:00:00Z', '2025-06-12T14:00:00Z', 'basic', false, false, '{"duration":600,"genre":"sketch comedy","language":"en","language":"pidgin"}'),
  ('cnt00001-0000-0000-0000-000000000025', 'Basketmouth: Yabasi Special', 'Basketmouth goes deep on Nigerian parents, relationships, and Jollof rice politics.', '/images/placeholders/content/800x450_25.png', 'https://www.youtube.com/watch?v=RgKAFK5djSk', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'published', 345000, '2025-05-20T20:00:00Z', '2025-05-20T20:00:00Z', 'premium', false, false, '{"duration":5400,"genre":"stand-up","language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000026', 'Craze Clown: Family Drama', 'When Nigerian parents discover TikTok. Pure comedy gold.', '/images/placeholders/content/800x450_26.png', 'https://www.youtube.com/watch?v=rYEDAozJrWw', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 234000, '2025-06-03T12:00:00Z', '2025-06-03T12:00:00Z', 'basic', false, false, '{"duration":480,"genre":"sketch comedy","language":"en"}'),

  -- Sports (2 items)
  ('cnt00001-0000-0000-0000-000000000027', 'NPFL Highlights: Enyimba vs Rangers', 'The Oriental Derby delivers as always. All goals and key moments.', '/images/placeholders/content/800x450_27.png', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005', 'published', 78000, '2025-06-15T17:00:00Z', '2025-06-15T17:00:00Z', 'basic', false, false, '{"duration":1200,"sport":"football","league":"NPFL"}'),
  ('cnt00001-0000-0000-0000-000000000028', 'Super Eagles World Cup Qualifier Recap', 'Full analysis of Nigeria''s latest World Cup qualifying match.', '/images/placeholders/content/800x450_28.png', 'https://www.youtube.com/watch?v=kXYiU_JCYt0', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'published', 456000, '2025-06-11T21:00:00Z', '2025-06-11T21:00:00Z', 'standard', false, false, '{"duration":1800,"sport":"football","league":"FIFA"}'),

  -- Music (2 items)
  ('cnt00001-0000-0000-0000-000000000029', 'Burna Boy: Live in Concert Lagos 2025', 'The full concert recording of Burna Boy''s sold-out Lagos show. An unforgettable night.', '/images/placeholders/content/800x450_29.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'published', 1200000, '2025-05-10T20:00:00Z', '2025-05-10T20:00:00Z', 'premium', true, false, '{"duration":9000,"genre":"afrobeats/concert","language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000030', 'Tems Acoustic Session: Unplugged', 'Tems performs her biggest hits stripped down in an intimate acoustic session.', '/images/placeholders/content/800x450_30.png', 'https://www.youtube.com/watch?v=DyDfgMOUjCI', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'published', 890000, '2025-06-07T19:00:00Z', '2025-06-07T19:00:00Z', 'standard', false, true, '{"duration":3600,"genre":"acoustic/rnb","language":"en"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: REALITY TV (+4 items, total 10)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000001', 'BBNaija Season 10: Diary Session Day 46', 'The housemates share their deepest thoughts in the diary room. Explosive revelations ahead.', '/images/placeholders/content/800x450_01.png', 'https://www.youtube.com/watch?v=nfWlot6h_JM', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 198000, '2025-06-16T20:00:00Z', '2025-06-16T20:00:00Z', 'standard', false, false, '{"duration":1800,"episode":46,"season":10,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000002', 'Cooking Battle Naija S2: Jollof Wars', 'The hottest cooking competition returns with celebrity chefs battling for the golden spoon.', '/images/placeholders/content/800x450_02.png', 'https://www.youtube.com/watch?v=nfWlot6h_JM', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 134000, '2025-06-09T19:00:00Z', '2025-06-09T19:00:00Z', 'standard', false, false, '{"duration":3600,"episode":1,"season":2,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000003', 'Love Island Naija: Unseen Bits', 'The moments cameras didn''t catch - late night chats, secret alliances, and funny moments.', '/images/placeholders/content/800x450_03.png', 'https://www.youtube.com/watch?v=5GoGJuY-moM', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 89000, '2025-06-11T21:30:00Z', '2025-06-11T21:30:00Z', 'basic', false, false, '{"duration":2400,"episode":9,"season":3,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000004', 'Nigerian Idol S9: Live Show - Top 10', 'The top 10 perform live for your votes. Who will make it to next week?', '/images/placeholders/content/800x450_04.png', 'https://www.youtube.com/watch?v=CevxZvSJLk8', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 267000, '2025-06-14T18:00:00Z', '2025-06-14T18:00:00Z', 'premium', true, false, '{"duration":5400,"episode":10,"season":9,"language":"en"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: CREATOR (+4 items, total 10)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000005', 'Tech Review: iPhone 16 Pro Max vs Samsung S25 Ultra', 'Which flagship phone is worth your money in 2025? Full comparison.', '/images/placeholders/content/800x450_05.png', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 145000, '2025-06-08T11:00:00Z', '2025-06-08T11:00:00Z', 'basic', false, false, '{"duration":1500,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000006', 'Fashion Lookbook: Ankara Styles 2025', 'Top 20 Ankara outfit ideas for every occasion this year.', '/images/placeholders/content/800x450_06.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 112000, '2025-06-05T14:00:00Z', '2025-06-05T14:00:00Z', 'basic', false, false, '{"duration":1200,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000007', 'Music Production BTS: Making Afrobeats from Scratch', 'Watch a full studio session creating an Afrobeats hit from nothing.', '/images/placeholders/content/800x450_07.png', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'published', 78000, '2025-06-03T10:00:00Z', '2025-06-03T10:00:00Z', 'standard', false, false, '{"duration":2700,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000008', 'Gym Fitness Routine: Lagos Edition', 'Full gym workout plan designed for the Lagos lifestyle. No excuses!', '/images/placeholders/content/800x450_08.png', 'https://www.youtube.com/watch?v=5qap5aO4i9A', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 67000, '2025-05-28T07:00:00Z', '2025-05-28T07:00:00Z', 'basic', false, false, '{"duration":2100,"language":"en"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: LIFESTYLE (+5 items, total 10)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000009', 'Lagos Nightlife Guide: Victoria Island Edition', 'The best clubs, lounges and bars in V.I. for a Saturday night out.', '/images/placeholders/content/800x450_09.png', 'https://www.youtube.com/watch?v=YQHsXMglC9A', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 45000, '2025-06-07T18:00:00Z', '2025-06-07T18:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en","location":"Victoria Island, Lagos"}'),
  ('cnt00002-0000-0000-0000-000000000010', 'Abuja Brunch Spots: Top 10', 'From Wuse to Maitama, these brunch spots will change your weekend game.', '/images/placeholders/content/800x450_10.png', 'https://www.youtube.com/watch?v=60ItHLz5WEQ', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 28000, '2025-06-01T09:00:00Z', '2025-06-01T09:00:00Z', 'basic', false, false, '{"duration":1500,"language":"en","location":"Abuja"}'),
  ('cnt00002-0000-0000-0000-000000000011', 'Nigerian Wedding Planning: The Ultimate Guide', 'From traditional engagement to white wedding - everything you need to know.', '/images/placeholders/content/800x450_11.png', 'https://www.youtube.com/watch?v=5GoGJuY-moM', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 56000, '2025-05-25T10:00:00Z', '2025-05-25T10:00:00Z', 'standard', false, false, '{"duration":3600,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000012', '30-Day Fitness Challenge Results', 'I tried a 30-day home workout challenge. Here are my results.', '/images/placeholders/content/800x450_12.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'published', 91000, '2025-06-10T08:00:00Z', '2025-06-10T08:00:00Z', 'basic', false, false, '{"duration":1200,"language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000013', 'Ghana Jollof vs Nigeria Jollof: The Final Showdown', 'We took both recipes to a blind taste test. The results will SHOCK you.', '/images/placeholders/content/800x450_13.png', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 178000, '2025-06-12T15:00:00Z', '2025-06-12T15:00:00Z', 'basic', false, false, '{"duration":2400,"language":"en"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: MOVIES (+5 items, total 10)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000014', 'The Guardian', 'A retired bodyguard must protect a young heiress from a deadly syndicate.', '/images/placeholders/content/800x450_14.png', 'https://www.youtube.com/watch?v=RgKAFK5djSk', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 189000, '2025-05-28T18:00:00Z', '2025-05-28T18:00:00Z', 'standard', false, false, '{"duration":6900,"genre":"action/thriller","language":"en","rating":"16+"}'),
  ('cnt00002-0000-0000-0000-000000000015', 'Queen of Lagos', 'A powerful woman navigates politics, business, and family in Lagos high society.', '/images/placeholders/content/800x450_15.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 156000, '2025-06-05T17:00:00Z', '2025-06-05T17:00:00Z', 'standard', false, false, '{"duration":7200,"genre":"drama","language":"en","rating":"12+"}'),
  ('cnt00002-0000-0000-0000-000000000016', 'Thunder in the East', 'An epic tale of love and war set during the Nigerian Civil War.', '/images/placeholders/content/800x450_16.png', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 78000, '2025-06-12T18:00:00Z', '2025-06-12T18:00:00Z', 'premium', true, true, '{"duration":9000,"genre":"historical/drama","language":"en","rating":"18+"}'),
  ('cnt00002-0000-0000-0000-000000000017', 'The Last Masquerade', 'A young man discovers his ancestral calling as the last masquerade of his village.', '/images/placeholders/content/800x450_17.png', 'https://www.youtube.com/watch?v=nfWlot6h_JM', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 67000, '2025-05-20T17:00:00Z', '2025-05-20T17:00:00Z', 'standard', false, false, '{"duration":6300,"genre":"cultural/drama","language":"en","rating":"PG"}'),
  ('cnt00002-0000-0000-0000-000000000018', 'Village Pastor', 'A city pastor gets transferred to a rural village and learns lessons of faith and community.', '/images/placeholders/content/800x450_18.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 112000, '2025-06-15T16:00:00Z', '2025-06-15T16:00:00Z', 'basic', false, false, '{"duration":5700,"genre":"comedy/drama","language":"en","rating":"PG"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: COMEDY (+4 items, total 8)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000019', 'Senator Comedy Special: Lagos Laugh', 'Senator delivers a masterclass in observational comedy about Lagos life.', '/images/placeholders/content/800x450_19.png', 'https://www.youtube.com/watch?v=5GoGJuY-moM', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'published', 234000, '2025-05-25T20:00:00Z', '2025-05-25T20:00:00Z', 'premium', false, false, '{"duration":7200,"genre":"stand-up","language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000020', 'Lasisi Elenu Live: Face of Comedy', 'Lasisi Elenu brings his viral comedy face filters to the live stage.', '/images/placeholders/content/800x450_20.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 189000, '2025-06-01T19:00:00Z', '2025-06-01T19:00:00Z', 'standard', false, false, '{"duration":5400,"genre":"stand-up","language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000021', 'Brother Shaggy: Stadium Tour Highlights', 'Brother Shaggy takes comedy to the stadium in this hilarious highlight reel.', '/images/placeholders/content/800x450_21.png', 'https://www.youtube.com/watch?v=09R8_2nJtjg', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 145000, '2025-06-08T20:00:00Z', '2025-06-08T20:00:00Z', 'basic', false, false, '{"duration":3600,"genre":"sketch comedy","language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000022', 'Acapella Comedy: Musical Laughs', 'When comedians meet music - hilarious musical comedy sketches.', '/images/placeholders/content/800x450_22.png', 'https://www.youtube.com/watch?v=rYEDAozJrWw', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000004', 'published', 98000, '2025-06-14T13:00:00Z', '2025-06-14T13:00:00Z', 'basic', false, false, '{"duration":1800,"genre":"sketch comedy","language":"en"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: SPORTS (+4 items, total 6)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000023', 'NPFL Goals of the Week: Matchday 15', 'The best goals from this week''s NPFL matches. Which one is your favorite?', '/images/placeholders/content/800x450_23.png', 'https://www.youtube.com/watch?v=rtOvBOTFBX0', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000011', 'published', 56000, '2025-06-14T18:00:00Z', '2025-06-14T18:00:00Z', 'basic', false, false, '{"duration":600,"sport":"football","league":"NPFL"}'),
  ('cnt00002-0000-0000-0000-000000000024', 'Lagos City Marathon 2025: Full Highlights', 'Complete highlights from the 2025 Lagos City Marathon. Record-breaking finish!', '/images/placeholders/content/800x450_24.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000011', 'published', 123000, '2025-05-15T06:00:00Z', '2025-05-15T06:00:00Z', 'standard', false, false, '{"duration":3600,"sport":"athletics","event":"Lagos Marathon 2025"}'),
  ('cnt00002-0000-0000-0000-000000000025', 'D''Tigress AFROBASKET Qualifier Recap', 'Nigeria''s women''s basketball team dominates in AFROBASKET qualifier.', '/images/placeholders/content/800x450_25.png', 'https://www.youtube.com/watch?v=RgKAFK5djSk', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000011', 'published', 89000, '2025-06-10T20:00:00Z', '2025-06-10T20:00:00Z', 'basic', false, false, '{"duration":1200,"sport":"basketball","league":"AFROBASKET"}'),
  ('cnt00002-0000-0000-0000-000000000026', 'Boxing Night: Rumble in Lagos', 'All the knockouts and highlights from the biggest boxing event in Lagos this year.', '/images/placeholders/content/800x450_26.png', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000011', 'published', 67000, '2025-06-07T21:00:00Z', '2025-06-07T21:00:00Z', 'standard', false, false, '{"duration":2400,"sport":"boxing","event":"Rumble in Lagos"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: MUSIC (+4 items, total 6)
  -- ============================================================================
  ('cnt00002-0000-0000-0000-000000000027', 'Wizkid: Made in Lagos Tour - Full Concert', 'The complete recording of Wizkid''s sold-out Made in Lagos tour finale.', '/images/placeholders/content/800x450_27.png', 'https://www.youtube.com/watch?v=DyDfgMOUjCI', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'published', 1500000, '2025-04-20T20:00:00Z', '2025-04-20T20:00:00Z', 'premium', true, false, '{"duration":10800,"genre":"afrobeats/concert","language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000028', 'Rema: Concert Highlights - Lagos Arena', 'The best moments from Rema''s explosive Lagos Arena concert.', '/images/placeholders/content/800x450_28.png', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'published', 980000, '2025-05-25T20:00:00Z', '2025-05-25T20:00:00Z', 'standard', false, false, '{"duration":5400,"genre":"afrobeats/concert","language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000029', 'Ayra Starr: Acoustic Session at TRACE Studio', 'Ayra Starr performs stripped-down versions of her biggest hits.', '/images/placeholders/content/800x450_29.png', 'https://www.youtube.com/watch?v=2vMPFrLmzkE', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'published', 670000, '2025-06-03T19:00:00Z', '2025-06-03T19:00:00Z', 'basic', false, false, '{"duration":2700,"genre":"acoustic/afropop","language":"en"}'),
  ('cnt00002-0000-0000-0000-000000000030', 'Afrobeats Mix 2025: Best of June', 'The hottest Afrobeats tracks of June 2025, mixed by DJ Consequence.', '/images/placeholders/content/800x450_30.png', 'https://www.youtube.com/watch?v=rYEDAozJrWw', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'published', 450000, '2025-06-15T12:00:00Z', '2025-06-15T12:00:00Z', 'basic', false, false, '{"duration":7200,"genre":"afrobeats/mix","language":"en"}'),

  -- ============================================================================
  -- EXPANDED CONTENT: GAMING (NEW - 8 items)
  -- ============================================================================
  ('cnt00003-0000-0000-0000-000000000001', 'FIFA Lagos Tournament 2025: Grand Final', 'The grand final of the biggest FIFA tournament in Lagos. Epic goals and celebrations.', '/images/placeholders/content/800x450_01.png', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 89000, '2025-06-14T16:00:00Z', '2025-06-14T16:00:00Z', 'basic', false, false, '{"duration":3600,"game":"FIFA 25","platform":"PS5","language":"en"}'),
  ('cnt00003-0000-0000-0000-000000000002', 'PES Naija League: Week 8 Highlights', 'Top plays and goals from the PES Naija Online League season 3.', '/images/placeholders/content/800x450_02.png', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 34000, '2025-06-12T19:00:00Z', '2025-06-12T19:00:00Z', 'basic', false, false, '{"duration":1800,"game":"eFootball","platform":"PS5","language":"en"}'),
  ('cnt00003-0000-0000-0000-000000000003', 'Call of Duty Mobile: Naija Championship', 'The best COD Mobile players in Nigeria compete for the championship title.', '/images/placeholders/content/800x450_03.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 56000, '2025-06-08T15:00:00Z', '2025-06-08T15:00:00Z', 'basic', false, false, '{"duration":2400,"game":"COD Mobile","platform":"Mobile","language":"en"}'),
  ('cnt00003-0000-0000-0000-000000000004', 'Tekken 8 Showdown: Lagos Fights', 'Nigeria''s best Tekken 8 players throw down in an epic bracket tournament.', '/images/placeholders/content/800x450_04.png', 'https://www.youtube.com/watch?v=rtOvBOTFBX0', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 45000, '2025-06-06T18:00:00Z', '2025-06-06T18:00:00Z', 'basic', false, false, '{"duration":2100,"game":"Tekken 8","platform":"PS5","language":"en"}'),
  ('cnt00003-0000-0000-0000-000000000005', 'FIFA Trivia Challenge: Test Your Knowledge', 'How well do you know FIFA? Take this 50-question challenge!', '/images/placeholders/content/800x450_05.png', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 23000, '2025-06-04T12:00:00Z', '2025-06-04T12:00:00Z', 'basic', false, false, '{"duration":1200,"game":"FIFA 25","type":"trivia","language":"en"}'),
  ('cnt00003-0000-0000-0000-000000000006', 'Gaming Marathon Stream: 24 Hours of Fun', '24-hour gaming marathon featuring FIFA, COD, and Tekken. For charity!', '/images/placeholders/content/800x450_06.png', 'https://www.youtube.com/watch?v=09R8_2nJtjg', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 78000, '2025-05-30T08:00:00Z', '2025-05-30T08:00:00Z', 'standard', false, false, '{"duration":86400,"games":"multi","platform":"multi","language":"en","charity":true}'),
  ('cnt00003-0000-0000-0000-000000000007', 'Mobile Legends Tournament: Naija Cup', 'The first Naija Mobile Legends tournament brings together the best MLBB teams.', '/images/placeholders/content/800x450_07.png', 'https://www.youtube.com/watch?v=e-0h_r4FEYU', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 34000, '2025-06-01T14:00:00Z', '2025-06-01T14:00:00Z', 'basic', false, false, '{"duration":5400,"game":"Mobile Legends","platform":"Mobile","language":"en"}'),
  ('cnt00003-0000-0000-0000-000000000008', 'eNaija Gaming Awards 2025: Full Ceremony', 'Celebrating the best in Nigerian gaming. Awards, highlights, and special guests.', '/images/placeholders/content/800x450_08.png', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', 'u0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000012', 'published', 45000, '2025-06-15T19:00:00Z', '2025-06-15T19:00:00Z', 'premium', true, false, '{"duration":7200,"type":"awards ceremony","language":"en"}'),

   -- ============================================================================
   -- EXPANDED CONTENT: VERTICAL (NEW - 5 items)
   -- ============================================================================
   ('cnt00003-0000-0000-0000-000000000009', 'The Lagos Chronicles: Season 1', 'An interconnected story of life, love, and ambition in modern Lagos. Meet the characters.', '/images/placeholders/content/800x450_09.png', 'https://www.youtube.com/watch?v=OPf6jTZ1B5Y', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 123000, '2025-05-20T17:00:00Z', '2025-05-20T17:00:00Z', 'premium', true, false, '{"duration":5400,"series":"The Lagos Chronicles","season":1,"language":"en"}'),
   ('cnt00003-0000-0000-0000-000000000010', 'The Lagos Chronicles: Season 2 Premiere', 'The saga continues with new characters and deeper storylines.', '/images/placeholders/content/800x450_10.png', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 89000, '2025-06-10T17:00:00Z', '2025-06-10T17:00:00Z', 'premium', true, false, '{"duration":4800,"series":"The Lagos Chronicles","season":2,"language":"en"}'),
   ('cnt00003-0000-0000-0000-000000000011', 'Abuja Noir: The Minister''s Secret', 'Political intrigue in Nigeria''s capital. A story of power, corruption, and redemption.', '/images/placeholders/content/800x450_11.png', 'https://www.youtube.com/watch?v=2vMPFrLmzkE', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'published', 56000, '2025-05-28T16:00:00Z', '2025-05-28T16:00:00Z', 'standard', false, false, '{"duration":3600,"series":"Abuja Noir","season":1,"language":"en"}'),
   ('cnt00003-0000-0000-0000-000000000012', 'Naija Heroes: Origins', 'The origin story of Nigeria''s first superhero team. Coming soon.', '/images/placeholders/content/800x450_12.png', 'https://www.youtube.com/watch?v=5qap5aO4i9A', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'published', 78000, '2025-06-05T15:00:00Z', '2025-06-05T15:00:00Z', 'premium', false, true, '{"duration":6000,"series":"Naija Heroes","season":1,"language":"en"}'),
   ('cnt00003-0000-0000-0000-000000000013', 'Rivers State Chronicles: Episode 1', 'Stories from the heart of Port Harcourt. Business, betrayal, and family drama.', '/images/placeholders/content/800x450_13.png', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', 'u0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000005', 'published', 45000, '2025-06-12T18:00:00Z', '2025-06-12T18:00:00Z', 'standard', false, false, '{"duration":2700,"series":"Rivers State Chronicles","language":"en"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 10: CONTENT-CATEGORY MAPPINGS (Prisma implicit many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "_CategoryToContentItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_CategoryToContentItem_AB_unique" ON "_CategoryToContentItem"("A", "B");
CREATE INDEX IF NOT EXISTS "_CategoryToContentItem_B_index" ON "_CategoryToContentItem"("B");

INSERT INTO "_CategoryToContentItem" ("A", "B") VALUES
  -- A = Category.id, B = ContentItem.id
  -- Trending items
  ('cat00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001'),
  ('cat00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000018'),
  ('cat00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000029'),
  ('cat00001-0000-0000-0000-000000000001', 'cnt00002-0000-0000-0000-000000000016'),
  ('cat00001-0000-0000-0000-000000000001', 'cnt00002-0000-0000-0000-000000000027'),
  -- New releases
  ('cat00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000012'),
  ('cat00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000022'),
  ('cat00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000024'),
  ('cat00001-0000-0000-0000-000000000002', 'cnt00002-0000-0000-0000-000000000001'),
  ('cat00001-0000-0000-0000-000000000002', 'cnt00002-0000-0000-0000-000000000018'),
  ('cat00001-0000-0000-0000-000000000002', 'cnt00003-0000-0000-0000-000000000001'),
  -- Editor picks
  ('cat00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000030'),
  ('cat00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000019'),
  ('cat00001-0000-0000-0000-000000000003', 'cnt00002-0000-0000-0000-000000000015'),
  ('cat00001-0000-0000-0000-000000000003', 'cnt00002-0000-0000-0000-000000000028'),
  -- Exclusive
  ('cat00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000001'),
  ('cat00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000018'),
  ('cat00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000023'),
  ('cat00001-0000-0000-0000-000000000004', 'cnt00002-0000-0000-0000-000000000016'),
  ('cat00001-0000-0000-0000-000000000004', 'cnt00003-0000-0000-0000-000000000008'),
  -- Free content
  ('cat00001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000005'),
  ('cat00001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000024'),
  ('cat00001-0000-0000-0000-000000000005', 'cnt00002-0000-0000-0000-000000000005'),
  ('cat00001-0000-0000-0000-000000000005', 'cnt00002-0000-0000-0000-000000000023'),
  ('cat00001-0000-0000-0000-000000000005', 'cnt00003-0000-0000-0000-000000000005'),
  -- Live events
  ('cat00001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000029'),
  ('cat00001-0000-0000-0000-000000000006', 'cnt00002-0000-0000-0000-000000000027'),
  -- Nollywood classics
  ('cat00001-0000-0000-0000-000000000007', 'cnt00002-0000-0000-0000-000000000017'),
  -- Documentaries
  ('cat00001-0000-0000-0000-000000000008', 'cnt00002-0000-0000-0000-000000000024'),
   -- Vertical categories
   ('cat00001-0000-0000-0000-000000000003', 'cnt00003-0000-0000-0000-000000000009'),
   ('cat00001-0000-0000-0000-000000000003', 'cnt00003-0000-0000-0000-000000000010'),
   ('cat00001-0000-0000-0000-000000000003', 'cnt00003-0000-0000-0000-000000000011'),
   ('cat00001-0000-0000-0000-000000000003', 'cnt00003-0000-0000-0000-000000000012'),
   ('cat00001-0000-0000-0000-000000000003', 'cnt00003-0000-0000-0000-000000000013')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 11: CONTENT-TAG MAPPINGS (Prisma implicit many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "_ContentItemToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ContentItemToTag_AB_unique" ON "_ContentItemToTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_ContentItemToTag_B_index" ON "_ContentItemToTag"("B");

INSERT INTO "_ContentItemToTag" ("A", "B") VALUES
  ('cnt00001-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000002'),
  ('cnt00001-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000009'),
  ('cnt00001-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000010'),
  ('cnt00001-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000009'),
  ('cnt00001-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000003', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000004', 'tag00001-0000-0000-0000-000000000009'),
  ('cnt00001-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000007'),
  ('cnt00001-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000012', 'tag00001-0000-0000-0000-000000000011'),
  ('cnt00001-0000-0000-0000-000000000012', 'tag00001-0000-0000-0000-000000000006'),
  ('cnt00001-0000-0000-0000-000000000018', 'tag00001-0000-0000-0000-000000000003'),
  ('cnt00001-0000-0000-0000-000000000018', 'tag00001-0000-0000-0000-000000000012'),
  ('cnt00001-0000-0000-0000-000000000019', 'tag00001-0000-0000-0000-000000000003'),
  ('cnt00001-0000-0000-0000-000000000023', 'tag00001-0000-0000-0000-000000000005'),
  ('cnt00001-0000-0000-0000-000000000027', 'tag00001-0000-0000-0000-000000000008'),
  ('cnt00001-0000-0000-0000-000000000027', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000028', 'tag00001-0000-0000-0000-000000000008'),
  ('cnt00001-0000-0000-0000-000000000029', 'tag00001-0000-0000-0000-000000000004'),
  ('cnt00001-0000-0000-0000-000000000029', 'tag00001-0000-0000-0000-000000000015'),
  ('cnt00001-0000-0000-0000-000000000030', 'tag00001-0000-0000-0000-000000000004'),
  ('cnt00001-0000-0000-0000-000000000030', 'tag00001-0000-0000-0000-000000000010'),
  -- Tags for expanded content
  ('cnt00002-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000002'),
  ('cnt00002-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000009'),
  ('cnt00002-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000007'),
  ('cnt00002-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000009'),
  ('cnt00002-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00002-0000-0000-0000-000000000006', 'tag00001-0000-0000-0000-000000000006'),
  ('cnt00002-0000-0000-0000-000000000006', 'tag00001-0000-0000-0000-000000000011'),
  ('cnt00002-0000-0000-0000-000000000007', 'tag00001-0000-0000-0000-000000000004'),
  ('cnt00002-0000-0000-0000-000000000007', 'tag00001-0000-0000-0000-000000000011'),
  ('cnt00002-0000-0000-0000-000000000009', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00002-0000-0000-0000-000000000013', 'tag00001-0000-0000-0000-000000000007'),
  ('cnt00002-0000-0000-0000-000000000013', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00002-0000-0000-0000-000000000014', 'tag00001-0000-0000-0000-000000000003'),
  ('cnt00002-0000-0000-0000-000000000016', 'tag00001-0000-0000-0000-000000000003'),
  ('cnt00002-0000-0000-0000-000000000016', 'tag00001-0000-0000-0000-000000000012'),
  ('cnt00002-0000-0000-0000-000000000017', 'tag00001-0000-0000-0000-000000000003'),
  ('cnt00002-0000-0000-0000-000000000019', 'tag00001-0000-0000-0000-000000000005'),
  ('cnt00002-0000-0000-0000-000000000020', 'tag00001-0000-0000-0000-000000000005'),
  ('cnt00002-0000-0000-0000-000000000020', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00002-0000-0000-0000-000000000023', 'tag00001-0000-0000-0000-000000000008'),
  ('cnt00002-0000-0000-0000-000000000024', 'tag00001-0000-0000-0000-000000000008'),
  ('cnt00002-0000-0000-0000-000000000024', 'tag00001-0000-0000-0000-000000000013'),
  ('cnt00002-0000-0000-0000-000000000025', 'tag00001-0000-0000-0000-000000000008'),
  ('cnt00002-0000-0000-0000-000000000026', 'tag00001-0000-0000-0000-000000000008'),
  ('cnt00002-0000-0000-0000-000000000027', 'tag00001-0000-0000-0000-000000000004'),
  ('cnt00002-0000-0000-0000-000000000027', 'tag00001-0000-0000-0000-000000000015'),
  ('cnt00002-0000-0000-0000-000000000028', 'tag00001-0000-0000-0000-000000000004'),
  ('cnt00002-0000-0000-0000-000000000029', 'tag00001-0000-0000-0000-000000000004'),
  ('cnt00002-0000-0000-0000-000000000030', 'tag00001-0000-0000-0000-000000000004'),
  -- Gaming tags
  ('cnt00003-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000001', 'tag00001-0000-0000-0000-000000000001'),
  ('cnt00003-0000-0000-0000-000000000002', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000003', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000004', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000005', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000006', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000006', 'tag00001-0000-0000-0000-000000000015'),
  ('cnt00003-0000-0000-0000-000000000007', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000008', 'tag00001-0000-0000-0000-000000000014'),
  ('cnt00003-0000-0000-0000-000000000008', 'tag00001-0000-0000-0000-000000000010'),
   -- Vertical tags
   ('cnt00003-0000-0000-0000-000000000009', 'tag00001-0000-0000-0000-000000000010'),
   ('cnt00003-0000-0000-0000-000000000009', 'tag00001-0000-0000-0000-000000000012'),
   ('cnt00003-0000-0000-0000-000000000010', 'tag00001-0000-0000-0000-000000000010'),
   ('cnt00003-0000-0000-0000-000000000010', 'tag00001-0000-0000-0000-000000000012'),
   ('cnt00003-0000-0000-0000-000000000011', 'tag00001-0000-0000-0000-000000000010'),
   ('cnt00003-0000-0000-0000-000000000011', 'tag00001-0000-0000-0000-000000000013'),
   ('cnt00003-0000-0000-0000-000000000012', 'tag00001-0000-0000-0000-000000000012'),
   ('cnt00003-0000-0000-0000-000000000013', 'tag00001-0000-0000-0000-000000000003'),
   ('cnt00003-0000-0000-0000-000000000013', 'tag00001-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 12: MEDIA ASSETS
-- ============================================================================

INSERT INTO "media_assets" (id, "contentItemId", "originalUrl", "thumbnailUrl", format, size, duration) VALUES
  -- Original content media assets
  ('m000001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'https://www.youtube.com/watch?v=2vMPFrLmzkE', '/images/placeholders/content/800x450_14.png', 'video/mp4', 524288000, 3600),
  ('m000001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000002', 'https://www.youtube.com/watch?v=5qap5aO4i9A', '/images/placeholders/content/800x450_15.png', 'video/mp4', 393216000, 2700),
  ('m000001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000003', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', '/images/placeholders/content/800x450_16.png', 'video/mp4', 614400000, 4200),
  ('m000001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000004', 'https://www.youtube.com/watch?v=RgKAFK5djSk', '/images/placeholders/content/800x450_17.png', 'video/mp4', 471859200, 3300),
  ('m000001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000005', 'https://www.youtube.com/watch?v=CevxZvSJLk8', '/images/placeholders/content/800x450_18.png', 'video/mp4', 262144000, 1800),
  ('m000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000006', 'https://www.youtube.com/watch?v=DyDfgMOUjCI', '/images/placeholders/content/800x450_19.png', 'video/mp4', 348129280, 2400),
  ('m000001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000007', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', '/images/placeholders/content/800x450_20.png', 'video/mp4', 348129280, 2400),
  ('m000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000008', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', '/images/placeholders/content/800x450_21.png', 'video/mp4', 209715200, 1500),
  ('m000001-0000-0000-0000-000000000009', 'cnt00001-0000-0000-0000-000000000009', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', '/images/placeholders/content/800x450_22.png', 'video/mp4', 178257920, 1200),
  ('m000001-0000-0000-0000-000000000010', 'cnt00001-0000-0000-0000-000000000010', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', '/images/placeholders/content/800x450_23.png', 'video/mp4', 262144000, 1800),
  ('m000001-0000-0000-0000-000000000011', 'cnt00001-0000-0000-0000-000000000011', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', '/images/placeholders/content/800x450_24.png', 'video/mp4', 314572800, 2100),
  ('m000001-0000-0000-0000-000000000012', 'cnt00001-0000-0000-0000-000000000012', 'https://www.youtube.com/watch?v=lbV3pRW1qbc', '/images/placeholders/content/800x450_25.png', 'video/mp4', 131072000, 900),
  ('m000001-0000-0000-0000-000000000013', 'cnt00001-0000-0000-0000-000000000013', 'https://www.youtube.com/watch?v=nfWlot6h_JM', '/images/placeholders/content/800x450_26.png', 'video/mp4', 262144000, 1800),
  ('m000001-0000-0000-0000-000000000014', 'cnt00001-0000-0000-0000-000000000014', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', '/images/placeholders/content/800x450_27.png', 'video/mp4', 131072000, 900),
  ('m000001-0000-0000-0000-000000000015', 'cnt00001-0000-0000-0000-000000000015', 'https://www.youtube.com/watch?v=lbV3pRW1qbc', '/images/placeholders/content/800x450_28.png', 'video/mp4', 348129280, 2400),
  ('m000001-0000-0000-0000-000000000016', 'cnt00001-0000-0000-0000-000000000016', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', '/images/placeholders/content/800x450_29.png', 'video/mp4', 209715200, 1500),
  ('m000001-0000-0000-0000-000000000017', 'cnt00001-0000-0000-0000-000000000017', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', '/images/placeholders/content/800x450_30.png', 'video/mp4', 393216000, 2700),
  ('m000001-0000-0000-0000-000000000018', 'cnt00001-0000-0000-0000-000000000018', 'https://www.youtube.com/watch?v=xjDjIjKvOIE', '/images/placeholders/content/800x450_01.png', 'video/mp4', 1073741824, 7200),
  ('m000001-0000-0000-0000-000000000019', 'cnt00001-0000-0000-0000-000000000019', 'https://www.youtube.com/watch?v=5qap5aO4i9A', '/images/placeholders/content/800x450_02.png', 'video/mp4', 966367232, 6600),
  ('m000001-0000-0000-0000-000000000020', 'cnt00001-0000-0000-0000-000000000020', 'https://www.youtube.com/watch?v=YQHsXMglC9A', '/images/placeholders/content/800x450_03.png', 'video/mp4', 805306368, 5400),
  ('m000001-0000-0000-0000-000000000021', 'cnt00001-0000-0000-0000-000000000021', 'https://www.youtube.com/watch?v=CevxZvSJLk8', '/images/placeholders/content/800x450_04.png', 'video/mp4', 872415232, 6000),
  ('m000001-0000-0000-0000-000000000022', 'cnt00001-0000-0000-0000-000000000022', 'https://www.youtube.com/watch?v=rYEDAozJrWw', '/images/placeholders/content/800x450_05.png', 'video/mp4', 805306368, 5400),
  ('m000001-0000-0000-0000-000000000023', 'cnt00001-0000-0000-0000-000000000023', 'https://www.youtube.com/watch?v=e-0h_r4FEYU', '/images/placeholders/content/800x450_06.png', 'video/mp4', 1610612736, 10800),
  ('m000001-0000-0000-0000-000000000024', 'cnt00001-0000-0000-0000-000000000024', 'https://www.youtube.com/watch?v=lbV3pRW1qbc', '/images/placeholders/content/800x450_07.png', 'video/mp4', 83886080, 600),
  ('m000001-0000-0000-0000-000000000025', 'cnt00001-0000-0000-0000-000000000025', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', '/images/placeholders/content/800x450_08.png', 'video/mp4', 805306368, 5400),
  ('m000001-0000-0000-0000-000000000026', 'cnt00001-0000-0000-0000-000000000026', 'https://www.youtube.com/watch?v=5qap5aO4i9A', '/images/placeholders/content/800x450_09.png', 'video/mp4', 67108864, 480),
  ('m000001-0000-0000-0000-000000000027', 'cnt00001-0000-0000-0000-000000000027', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/placeholders/content/800x450_10.png', 'video/mp4', 178257920, 1200),
  ('m000001-0000-0000-0000-000000000028', 'cnt00001-0000-0000-0000-000000000028', 'https://www.youtube.com/watch?v=e-0h_r4FEYU', '/images/placeholders/content/800x450_11.png', 'video/mp4', 262144000, 1800),
  ('m000001-0000-0000-0000-000000000029', 'cnt00001-0000-0000-0000-000000000029', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', '/images/placeholders/content/800x450_12.png', 'video/mp4', 2147483647, 9000),
  ('m000001-0000-0000-0000-000000000030', 'cnt00001-0000-0000-0000-000000000030', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', '/images/placeholders/content/800x450_13.png', 'video/mp4', 524288000, 3600),
  -- Expanded Reality media assets
  ('m000002-0000-0000-0000-000000000001', 'cnt00002-0000-0000-0000-000000000001', 'https://www.youtube.com/watch?v=5qap5aO4i9A', '/images/placeholders/content/800x450_14.png', 'video/mp4', 262144000, 1800),
  ('m000002-0000-0000-0000-000000000002', 'cnt00002-0000-0000-0000-000000000002', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', '/images/placeholders/content/800x450_15.png', 'video/mp4', 524288000, 3600),
  ('m000002-0000-0000-0000-000000000003', 'cnt00002-0000-0000-0000-000000000003', 'https://www.youtube.com/watch?v=5GoGJuY-moM', '/images/placeholders/content/800x450_16.png', 'video/mp4', 348129280, 2400),
  ('m000002-0000-0000-0000-000000000004', 'cnt00002-0000-0000-0000-000000000004', 'https://www.youtube.com/watch?v=2vMPFrLmzkE', '/images/placeholders/content/800x450_17.png', 'video/mp4', 786432000, 5400),
  -- Expanded Creator media assets
  ('m000002-0000-0000-0000-000000000005', 'cnt00002-0000-0000-0000-000000000005', 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', '/images/placeholders/content/800x450_18.png', 'video/mp4', 209715200, 1500),
  ('m000002-0000-0000-0000-000000000006', 'cnt00002-0000-0000-0000-000000000006', 'https://www.youtube.com/watch?v=wTgaA4f8TqI', '/images/placeholders/content/800x450_19.png', 'video/mp4', 178257920, 1200),
  ('m000002-0000-0000-0000-000000000007', 'cnt00002-0000-0000-0000-000000000007', 'https://www.youtube.com/watch?v=hT_nvWreIhg', '/images/placeholders/content/800x450_20.png', 'video/mp4', 393216000, 2700),
  ('m000002-0000-0000-0000-000000000008', 'cnt00002-0000-0000-0000-000000000008', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', '/images/placeholders/content/800x450_21.png', 'video/mp4', 314572800, 2100),
  -- Expanded Lifestyle media assets
  ('m000002-0000-0000-0000-000000000009', 'cnt00002-0000-0000-0000-000000000009', 'https://www.youtube.com/watch?v=kXYiU_JCYt0', '/images/placeholders/content/800x450_22.png', 'video/mp4', 262144000, 1800),
  ('m000002-0000-0000-0000-000000000010', 'cnt00002-0000-0000-0000-000000000010', 'https://www.youtube.com/watch?v=09R8_2nJtjg', '/images/placeholders/content/800x450_23.png', 'video/mp4', 209715200, 1500),
  ('m000002-0000-0000-0000-000000000011', 'cnt00002-0000-0000-0000-000000000011', 'https://www.youtube.com/watch?v=xjDjIjKvOIE', '/images/placeholders/content/800x450_24.png', 'video/mp4', 524288000, 3600),
  ('m000002-0000-0000-0000-000000000012', 'cnt00002-0000-0000-0000-000000000012', 'https://www.youtube.com/watch?v=rYEDAozJrWw', '/images/placeholders/content/800x450_25.png', 'video/mp4', 178257920, 1200),
  ('m000002-0000-0000-0000-000000000013', 'cnt00002-0000-0000-0000-000000000013', 'https://www.youtube.com/watch?v=OPf6jTZ1B5Y', '/images/placeholders/content/800x450_26.png', 'video/mp4', 348129280, 2400),
  -- Expanded Movies media assets
  ('m000002-0000-0000-0000-000000000014', 'cnt00002-0000-0000-0000-000000000014', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', '/images/placeholders/content/800x450_27.png', 'video/mp4', 1006632960, 6900),
  ('m000002-0000-0000-0000-000000000015', 'cnt00002-0000-0000-0000-000000000015', 'https://www.youtube.com/watch?v=5GoGJuY-moM', '/images/placeholders/content/800x450_28.png', 'video/mp4', 1073741824, 7200),
  ('m000002-0000-0000-0000-000000000016', 'cnt00002-0000-0000-0000-000000000016', 'https://www.youtube.com/watch?v=e-0h_r4FEYU', '/images/placeholders/content/800x450_29.png', 'video/mp4', 1342177280, 9000),
  ('m000002-0000-0000-0000-000000000017', 'cnt00002-0000-0000-0000-000000000017', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', '/images/placeholders/content/800x450_30.png', 'video/mp4', 939524096, 6300),
  ('m000002-0000-0000-0000-000000000018', 'cnt00002-0000-0000-0000-000000000018', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', '/images/placeholders/content/800x450_01.png', 'video/mp4', 838860800, 5700),
  -- Expanded Comedy media assets
  ('m000002-0000-0000-0000-000000000019', 'cnt00002-0000-0000-0000-000000000019', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', '/images/placeholders/content/800x450_02.png', 'video/mp4', 1073741824, 7200),
  ('m000002-0000-0000-0000-000000000020', 'cnt00002-0000-0000-0000-000000000020', 'https://www.youtube.com/watch?v=xjDjIjKvOIE', '/images/placeholders/content/800x450_03.png', 'video/mp4', 805306368, 5400),
  ('m000002-0000-0000-0000-000000000021', 'cnt00002-0000-0000-0000-000000000021', 'https://www.youtube.com/watch?v=7PCkvCUv6kE', '/images/placeholders/content/800x450_04.png', 'video/mp4', 524288000, 3600),
  ('m000002-0000-0000-0000-000000000022', 'cnt00002-0000-0000-0000-000000000022', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', '/images/placeholders/content/800x450_05.png', 'video/mp4', 262144000, 1800),
  -- Expanded Sports media assets
  ('m000002-0000-0000-0000-000000000023', 'cnt00002-0000-0000-0000-000000000023', 'https://www.youtube.com/watch?v=rYEDAozJrWw', '/images/placeholders/content/800x450_06.png', 'video/mp4', 83886080, 600),
  ('m000002-0000-0000-0000-000000000024', 'cnt00002-0000-0000-0000-000000000024', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', '/images/placeholders/content/800x450_07.png', 'video/mp4', 524288000, 3600),
  ('m000002-0000-0000-0000-000000000025', 'cnt00002-0000-0000-0000-000000000025', 'https://www.youtube.com/watch?v=nfWlot6h_JM', '/images/placeholders/content/800x450_08.png', 'video/mp4', 178257920, 1200),
  ('m000002-0000-0000-0000-000000000026', 'cnt00002-0000-0000-0000-000000000026', 'https://www.youtube.com/watch?v=DyDfgMOUjCI', '/images/placeholders/content/800x450_09.png', 'video/mp4', 348129280, 2400),
  -- Expanded Music media assets
  ('m000002-0000-0000-0000-000000000027', 'cnt00002-0000-0000-0000-000000000027', 'https://www.youtube.com/watch?v=CevxZvSJLk8', '/images/placeholders/content/800x450_10.png', 'video/mp4', 2147483647, 10800),
  ('m000002-0000-0000-0000-000000000028', 'cnt00002-0000-0000-0000-000000000028', 'https://www.youtube.com/watch?v=OPf6jTZ1B5Y', '/images/placeholders/content/800x450_11.png', 'video/mp4', 805306368, 5400),
  ('m000002-0000-0000-0000-000000000029', 'cnt00002-0000-0000-0000-000000000029', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', '/images/placeholders/content/800x450_12.png', 'video/mp4', 393216000, 2700),
  ('m000002-0000-0000-0000-000000000030', 'cnt00002-0000-0000-0000-000000000030', 'https://www.youtube.com/watch?v=9bZkp7q19f0', '/images/placeholders/content/800x450_13.png', 'video/mp4', 1073741824, 7200),
  -- Gaming media assets
  ('m000003-0000-0000-0000-000000000001', 'cnt00003-0000-0000-0000-000000000001', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', '/images/placeholders/content/800x450_14.png', 'video/mp4', 524288000, 3600),
  ('m000003-0000-0000-0000-000000000002', 'cnt00003-0000-0000-0000-000000000002', 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', '/images/placeholders/content/800x450_15.png', 'video/mp4', 262144000, 1800),
  ('m000003-0000-0000-0000-000000000003', 'cnt00003-0000-0000-0000-000000000003', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', '/images/placeholders/content/800x450_16.png', 'video/mp4', 348129280, 2400),
  ('m000003-0000-0000-0000-000000000004', 'cnt00003-0000-0000-0000-000000000004', 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', '/images/placeholders/content/800x450_17.png', 'video/mp4', 314572800, 2100),
  ('m000003-0000-0000-0000-000000000005', 'cnt00003-0000-0000-0000-000000000005', 'https://www.youtube.com/watch?v=09R8_2nJtjg', '/images/placeholders/content/800x450_18.png', 'video/mp4', 178257920, 1200),
  ('m000003-0000-0000-0000-000000000006', 'cnt00003-0000-0000-0000-000000000006', 'https://www.youtube.com/watch?v=rtOvBOTFBX0', '/images/placeholders/content/800x450_19.png', 'video/mp4', 12884901888, 86400),
  ('m000003-0000-0000-0000-000000000007', 'cnt00003-0000-0000-0000-000000000007', 'https://www.youtube.com/watch?v=e-0h_r4FEYU', '/images/placeholders/content/800x450_20.png', 'video/mp4', 805306368, 5400),
  ('m000003-0000-0000-0000-000000000008', 'cnt00003-0000-0000-0000-000000000008', 'https://www.youtube.com/watch?v=YR5ApYxkU_U', '/images/placeholders/content/800x450_21.png', 'video/mp4', 1073741824, 7200),
   -- Vertical media assets
   ('m000003-0000-0000-0000-000000000009', 'cnt00003-0000-0000-0000-000000000009', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ', '/images/placeholders/content/800x450_22.png', 'video/mp4', 805306368, 5400),
   ('m000003-0000-0000-0000-000000000010', 'cnt00003-0000-0000-0000-000000000010', 'https://www.youtube.com/watch?v=6ZfuNTVB5bo', '/images/placeholders/content/800x450_23.png', 'video/mp4', 716800000, 4800),
   ('m000003-0000-0000-0000-000000000011', 'cnt00003-0000-0000-0000-000000000011', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', '/images/placeholders/content/800x450_24.png', 'video/mp4', 524288000, 3600),
   ('m000003-0000-0000-0000-000000000012', 'cnt00003-0000-0000-0000-000000000012', 'https://www.youtube.com/watch?v=OPf6jTZ1B5Y', '/images/placeholders/content/800x450_25.png', 'video/mp4', 905306368, 6000),
   ('m000003-0000-0000-0000-000000000013', 'cnt00003-0000-0000-0000-000000000013', 'https://www.youtube.com/watch?v=xjDjIjKvOIE', '/images/placeholders/content/800x450_26.png', 'video/mp4', 353216000, 2700)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 13: CONTENT RELATIONSHIPS
-- ============================================================================

INSERT INTO "content_relationships" (id, "contentId", "relatedContentId", type) VALUES
   ('rel00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000002', 'related'),
   ('rel00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000004', 'related'),
   ('rel00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000018', 'cnt00001-0000-0000-0000-000000000019', 'related'),
   ('rel00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000019', 'cnt00001-0000-0000-0000-000000000022', 'related'),
   ('rel00001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000029', 'cnt00001-0000-0000-0000-000000000030', 'related'),
   -- Vertical content relationships
   ('rel00001-0000-0000-0000-000000000006', 'cnt00003-0000-0000-0000-000000000009', 'cnt00003-0000-0000-0000-000000000010', 'related'),
   ('rel00001-0000-0000-0000-000000000007', 'cnt00003-0000-0000-0000-000000000010', 'cnt00003-0000-0000-0000-000000000011', 'related'),
   ('rel00001-0000-0000-0000-000000000008', 'cnt00003-0000-0000-0000-000000000011', 'cnt00003-0000-0000-0000-000000000013', 'related')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 14: WALLETS & TRANSACTIONS
-- ============================================================================

INSERT INTO "wallets" (id, "userId", balance, "bonusBalance", "promoBalance", currency, "createdAt", "updatedAt") VALUES
  ('w000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 15000.00, 2500.00, 500.00, 'NGN', '2025-06-01T10:00:00Z', '2025-06-15T12:00:00Z'),
  ('w000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 8500.00, 1000.00, 0.00, 'NGN', '2025-05-20T14:00:00Z', '2025-06-14T18:00:00Z'),
  ('w000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 23000.00, 5000.00, 2000.00, 'NGN', '2025-06-05T08:00:00Z', '2025-06-20T09:00:00Z'),
  ('w000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000011', 42000.00, 3000.00, 1000.00, 'NGN', '2025-05-10T09:00:00Z', '2025-06-18T14:00:00Z'),
  ('w000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000012', 18500.00, 2000.00, 500.00, 'NGN', '2025-05-15T11:00:00Z', '2025-06-19T16:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  "userId" = EXCLUDED."userId",
  balance = EXCLUDED.balance,
  "bonusBalance" = EXCLUDED."bonusBalance",
  "promoBalance" = EXCLUDED."promoBalance",
  currency = EXCLUDED.currency,
  "createdAt" = EXCLUDED."createdAt",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO "wallet_transactions" (id, "walletId", type, amount, status, description, provider, "providerRef", "createdAt", "updatedAt") VALUES
  ('tx00001-0000-0000-0000-000000000001', 'w000001-0000-0000-0000-000000000001', 'credit', 20000.00, 'completed', 'Wallet funding via Paystack', 'paystack', 'PSK-TXN-001', '2025-06-01T10:00:00Z', '2025-06-01T10:00:00Z'),
  ('tx00001-0000-0000-0000-000000000002', 'w000001-0000-0000-0000-000000000001', 'debit', 2500.00, 'completed', 'Rental: Lagos King: The Return', NULL, NULL, '2025-06-10T15:30:00Z', '2025-06-10T15:30:00Z'),
  ('tx00001-0000-0000-0000-000000000003', 'w000001-0000-0000-0000-000000000001', 'debit', 1500.00, 'completed', 'Pass: Weekly Reality', NULL, NULL, '2025-06-12T09:00:00Z', '2025-06-12T09:00:00Z'),
  ('tx00001-0000-0000-0000-000000000004', 'w000001-0000-0000-0000-000000000001', 'bonus', 2500.00, 'completed', 'Welcome bonus', NULL, NULL, '2025-06-01T10:00:01Z', '2025-06-01T10:00:01Z'),
  ('tx00001-0000-0000-0000-000000000005', 'w000001-0000-0000-0000-000000000002', 'credit', 10000.00, 'completed', 'Wallet funding via Flutterwave', 'flutterwave', 'FLW-TXN-002', '2025-05-20T14:00:00Z', '2025-05-20T14:00:00Z'),
  ('tx00001-0000-0000-0000-000000000006', 'w000001-0000-0000-0000-000000000002', 'debit', 1500.00, 'completed', 'Rental: Love at First Jollof', NULL, NULL, '2025-06-14T18:00:00Z', '2025-06-14T18:00:00Z'),
  ('tx00001-0000-0000-0000-000000000007', 'w000001-0000-0000-0000-000000000003', 'credit', 30000.00, 'completed', 'Wallet funding via Paystack', 'paystack', 'PSK-TXN-003', '2025-06-05T08:00:00Z', '2025-06-05T08:00:00Z'),
  ('tx00001-0000-0000-0000-000000000008', 'w000001-0000-0000-0000-000000000003', 'debit', 5000.00, 'completed', 'Pass: Monthly Premium', NULL, NULL, '2020-06-05T08:00:01Z', '2020-06-05T08:00:01Z'),
  ('tx00001-0000-0000-0000-000000000009', 'w000001-0000-0000-0000-000000000003', 'bonus', 5000.00, 'completed', 'Welcome bonus + referral', NULL, NULL, '2025-06-05T08:00:02Z', '2025-06-05T08:00:02Z'),
  ('tx00001-0000-0000-0000-000000000010', 'w000001-0000-0000-0000-000000000001', 'refund', 2500.00, 'completed', 'Refund: Payment issue', 'paystack', 'PSK-REF-001', '2025-06-13T12:00:00Z', '2025-06-13T12:00:00Z'),
  -- Expanded wallet transactions
  ('tx00002-0000-0000-0000-000000000001', 'w000001-0000-0000-0000-000000000001', 'debit', 500.00, 'completed', 'Super Vote: BBNaija', NULL, NULL, '2025-06-15T20:30:00Z', '2025-06-15T20:30:00Z'),
  ('tx00002-0000-0000-0000-000000000002', 'w000001-0000-0000-0000-000000000001', 'credit', 5000.00, 'completed', 'Wallet funding via Paystack', 'paystack', 'PSK-TXN-004', '2025-06-18T09:00:00Z', '2025-06-18T09:00:00Z'),
  ('tx00002-0000-0000-0000-000000000003', 'w000001-0000-0000-0000-000000000002', 'debit', 300.00, 'completed', 'Gaming Tournament Entry', NULL, NULL, '2025-06-12T14:00:00Z', '2025-06-12T14:00:00Z'),
  ('tx00002-0000-0000-0000-000000000004', 'w000001-0000-0000-0000-000000000003', 'debit', 2000.00, 'completed', 'Rental: Thunder in the East', NULL, NULL, '2025-06-14T19:00:00Z', '2025-06-14T19:00:00Z'),
  ('tx00002-0000-0000-0000-000000000005', 'w000001-0000-0000-0000-000000000004', 'credit', 50000.00, 'completed', 'Creator earnings payout', 'paystack', 'PSK-TXN-005', '2025-06-01T08:00:00Z', '2025-06-01T08:00:00Z'),
  ('tx00002-0000-0000-0000-000000000006', 'w000001-0000-0000-0000-000000000004', 'debit', 8000.00, 'completed', 'Pass: Monthly Sports', NULL, NULL, '2025-06-05T10:00:00Z', '2025-06-05T10:00:00Z'),
  ('tx00002-0000-0000-0000-000000000007', 'w000001-0000-0000-0000-000000000004', 'credit', 1500.00, 'completed', 'Tip from fan', NULL, NULL, '2025-06-10T16:00:00Z', '2025-06-10T16:00:00Z'),
  ('tx00002-0000-0000-0000-000000000008', 'w000001-0000-0000-0000-000000000005', 'credit', 25000.00, 'completed', 'Wallet funding via Flutterwave', 'flutterwave', 'FLW-TXN-004', '2025-05-20T10:00:00Z', '2025-05-20T10:00:00Z'),
  ('tx00002-0000-0000-0000-000000000009', 'w000001-0000-0000-0000-000000000005', 'debit', 500.00, 'completed', 'Gaming Tournament Entry', NULL, NULL, '2025-06-08T14:30:00Z', '2025-06-08T14:30:00Z'),
  ('tx00002-0000-0000-0000-000000000010', 'w000001-0000-0000-0000-000000000005', 'credit', 3500.00, 'completed', 'Tournament prize winnings', NULL, NULL, '2025-06-14T22:00:00Z', '2025-06-14T22:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 15: PASSES
-- ============================================================================

INSERT INTO "passes" (id, "userId", "passType", "universeId", status, "startTime", "endTime", price, currency) VALUES
  ('p000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'weekly', 'u0000001-0000-0000-0000-000000000001', 'active', '2025-06-12T09:00:00Z', '2025-06-19T09:00:00Z', 1500.00, 'NGN'),
  ('p000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'monthly', NULL, 'active', '2025-06-05T08:00:00Z', '2025-07-05T08:00:00Z', 5000.00, 'NGN'),
  ('p000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'daily', 'u0000001-0000-0000-0000-000000000006', 'expired', '2025-06-14T12:00:00Z', '2025-06-15T12:00:00Z', 200.00, 'NGN')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 16: RENTALS
-- ============================================================================

INSERT INTO "rentals" (id, "userId", "contentId", "startTime", "endTime", status, price, currency) VALUES
  ('rn00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000018', '2025-06-10T15:30:00Z', '2025-06-12T15:30:00Z', 'active', 2500.00, 'NGN'),
  ('rn00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000022', '2025-06-14T18:00:00Z', '2025-06-16T18:00:00Z', 'active', 1500.00, 'NGN')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 17: SCREENINGS
-- ============================================================================

INSERT INTO "screenings" (id, "contentId", "screeningTime", "endTime", location, "streamUrl", status, "maxViewers", "currentViewers", price, currency) VALUES
  ('sc00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000029', '2025-07-15T19:00:00Z', '2025-07-15T22:00:00Z', 'Eko Convention Centre, Lagos', 'https://stream.azeeboplus.com/live/burna-july', 'scheduled', 10000, 0, 5000.00, 'NGN'),
  ('sc00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000018', '2025-06-28T18:00:00Z', '2025-06-28T20:00:00Z', 'Filmhouse Lekki, Lagos', NULL, 'scheduled', 500, 234, 2000.00, 'NGN')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 18: LOCKED EXTRAS
-- ============================================================================

INSERT INTO "locked_extras" (id, "contentId", "extraType", title, description, price, currency, "unlockType") VALUES
  ('le00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'behind_paywall', 'Confession Room Highlights', 'Exclusive uncut confession room moments from BBNaija Day 45.', 500.00, 'NGN', 'purchase'),
  ('le00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000018', 'director_commentary', 'Director''s Commentary', 'Director Emeka Nwosu narrates the making of Lagos King: The Return.', 1000.00, 'NGN', 'purchase'),
  ('le00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000029', 'bonus_content', 'Backstage Pass', 'Exclusive backstage footage from Burna Boy Lagos concert.', 2000.00, 'NGN', 'pass'),
  ('le00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000030', 'extended_version', 'Extended Session (20 min extra)', 'The full 90-minute acoustic session with bonus tracks.', 1500.00, 'NGN', 'rental')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 19: COMMENTS
-- ============================================================================

INSERT INTO "comments" (id, "contentId", "userId", text, "parentId", "createdAt") VALUES
  ('cm00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'This season is WILD! The nomination game was insane', NULL, '2025-06-15T22:00:00Z'),
  ('cm00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'Chomzy for the win! She deserves to stay', NULL, '2025-06-15T22:15:00Z'),
  ('cm00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'Why is the production quality so good this season? Azeebo+ really stepped up.', NULL, '2025-06-15T22:30:00Z'),
  ('cm00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000006', 'Best Nollywood film I have seen this year. The plot twists!', NULL, '2025-05-22T14:00:00Z'),
  ('cm00001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000008', 'The action scenes are so well choreographed. Nollywood is evolving!', NULL, '2025-05-23T09:00:00Z'),
  ('cm00001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000006', 'I was THERE! This recording does not do the live experience justice. Amazing!', NULL, '2025-05-12T10:00:00Z'),
  ('cm00001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000007', 'Burna never disappoints. The setlist was perfect.', NULL, '2025-05-12T11:30:00Z'),
  ('cm00001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000030', 'a0000001-0000-0000-0000-000000000006', 'Tems in acoustic mode is a whole different experience. Angelic voice!', NULL, '2025-06-08T08:00:00Z'),
  ('cm00001-0000-0000-0000-000000000009', 'cnt00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'The road trip content I never knew I needed. More of this please!', NULL, '2025-06-14T18:00:00Z'),
  ('cm00001-0000-0000-0000-000000000010', 'cnt00001-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000007', 'Emmanuelle never fails to crack me up', NULL, '2025-06-12T16:00:00Z'),
  -- Expanded comments with threaded replies
  ('cm00002-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'Reply to the Chomzy comment - totally agree!', 'cm00001-0000-0000-0000-000000000002', '2025-06-15T22:20:00Z'),
  ('cm00002-0000-0000-0000-000000000002', 'cnt00002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'The diary room sessions are always the best part of BBNaija', NULL, '2025-06-16T22:00:00Z'),
  ('cm00002-0000-0000-0000-000000000003', 'cnt00002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'The jollof battle episode was everything! Chef Chioma is a queen.', NULL, '2025-06-10T20:00:00Z'),
  ('cm00002-0000-0000-0000-000000000004', 'cnt00002-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'Great tech review! Finally someone who compares properly.', NULL, '2025-06-09T14:00:00Z'),
  ('cm00002-0000-0000-0000-000000000005', 'cnt00002-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000007', 'V.I. nightlife is unmatched! Need a Part 2 for Lekki.', NULL, '2025-06-08T10:00:00Z'),
  ('cm00002-0000-0000-0000-000000000006', 'cnt00002-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000006', 'Nigeria jollof wins every time! This was so fun to watch.', NULL, '2025-06-13T10:00:00Z'),
  ('cm00002-0000-0000-0000-000000000007', 'cnt00002-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000008', 'Thunder in the East is a masterpiece. Nollywood at its finest.', NULL, '2025-06-13T20:00:00Z'),
  ('cm00002-0000-0000-0000-000000000008', 'cnt00002-0000-0000-0000-000000000019', 'a0000001-0000-0000-0000-000000000006', 'Senator is the funniest comedian in Nigeria right now. No debate.', NULL, '2025-05-26T12:00:00Z'),
  ('cm00002-0000-0000-0000-000000000009', 'cnt00002-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000007', 'The Lagos Marathon is growing every year! Great coverage.', NULL, '2025-05-16T10:00:00Z'),
  ('cm00002-0000-0000-0000-000000000010', 'cnt00002-0000-0000-0000-000000000027', 'a0000001-0000-0000-0000-000000000008', 'Wizkid live is a different experience entirely. The vibes were immaculate.', NULL, '2025-04-22T10:00:00Z'),
  ('cm00002-0000-0000-0000-000000000011', 'cnt00003-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'That last minute winner was INSANE! FIFA tournaments in Lagos hit different.', NULL, '2025-06-14T20:00:00Z'),
  ('cm00002-0000-0000-0000-000000000012', 'cnt00003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'COD Mobile championship was so competitive! Need more of this.', NULL, '2025-06-09T10:00:00Z'),
  ('cm00002-0000-0000-0000-000000000013', 'cnt00003-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', '24 hour gaming marathon for charity? This is why I love the gaming community.', NULL, '2025-05-31T12:00:00Z'),
  ('cm00002-0000-0000-0000-000000000014', 'cnt00003-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000006', 'eNaija Gaming Awards was so well produced. Nigerian gaming is growing!', NULL, '2025-06-16T10:00:00Z'),
  ('cm00002-0000-0000-0000-000000000015', 'cnt00002-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000007', 'Lasisi Elenu on stage is a whole different level of comedy!', NULL, '2025-06-02T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 20: WATCH HISTORY
-- ============================================================================

INSERT INTO "watch_history" (id, "userId", "contentId", "contentType", universe, progress, "watchedAt", "createdAt", "updatedAt") VALUES
   ('wh00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000001', 'content', 'reality', 85, '2025-06-15T22:00:00Z', '2025-06-15T21:00:00Z', '2025-06-15T22:00:00Z'),
   ('wh00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000018', 'content', 'movies', 100, '2025-06-11T10:00:00Z', '2025-06-11T09:00:00Z', '2025-06-11T10:00:00Z'),
   ('wh00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000029', 'content', 'music', 67, '2025-05-15T20:00:00Z', '2025-05-15T19:00:00Z', '2025-05-15T20:00:00Z'),
   ('wh00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000008', 'content', 'creator', 100, '2025-06-11T16:00:00Z', '2025-06-11T15:00:00Z', '2025-06-11T16:00:00Z'),
   ('wh00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000023', 'content', 'comedy', 45, '2025-06-01T20:00:00Z', '2025-06-01T19:00:00Z', '2025-06-01T20:00:00Z'),
   ('wh00001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000027', 'content', 'sports', 100, '2025-06-15T18:00:00Z', '2025-06-15T17:00:00Z', '2025-06-15T18:00:00Z'),
   ('wh00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000003', 'content', 'creator', 100, '2025-06-02T12:00:00Z', '2025-06-02T11:00:00Z', '2025-06-02T12:00:00Z'),
   ('wh00001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000030', 'content', 'music', 92, '2025-06-08T10:00:00Z', '2025-06-08T09:00:00Z', '2025-06-08T10:00:00Z'),
   ('wh00001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000019', 'content', 'comedy', 78, '2025-06-03T14:00:00Z', '2025-06-03T13:00:00Z', '2025-06-03T14:00:00Z'),
   ('wh00001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000005', 'content', 'comedy', 100, '2025-06-09T14:00:00Z', '2025-06-09T13:00:00Z', '2025-06-09T14:00:00Z'),
   -- Expanded watch history
   ('wh00002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'cnt00002-0000-0000-0000-000000000001', 'content', 'reality', 100, '2025-06-17T22:00:00Z', '2025-06-17T21:00:00Z', '2025-06-17T22:00:00Z'),
   ('wh00002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'cnt00002-0000-0000-0000-000000000016', 'content', 'movies', 56, '2025-06-14T19:00:00Z', '2025-06-14T18:00:00Z', '2025-06-14T19:00:00Z'),
   ('wh00002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'cnt00002-0000-0000-0000-000000000027', 'content', 'music', 34, '2025-04-25T20:00:00Z', '2025-04-25T19:00:00Z', '2025-04-25T20:00:00Z'),
   ('wh00002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000007', 'cnt00003-0000-0000-0000-000000000001', 'content', 'games', 100, '2025-06-15T18:00:00Z', '2025-06-15T17:00:00Z', '2025-06-15T18:00:00Z'),
   ('wh00002-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'cnt00002-0000-0000-0000-000000000025', 'content', 'sports', 88, '2025-06-11T20:00:00Z', '2025-06-11T19:00:00Z', '2025-06-11T20:00:00Z'),
   ('wh00002-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', 'cnt00002-0000-0000-0000-000000000015', 'content', 'movies', 100, '2025-06-07T18:00:00Z', '2025-06-07T17:00:00Z', '2025-06-07T18:00:00Z'),
   ('wh00002-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'cnt00002-0000-0000-0000-000000000029', 'content', 'music', 45, '2025-06-05T10:00:00Z', '2025-06-05T09:00:00Z', '2025-06-05T10:00:00Z'),
   ('wh00002-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000011', 'cnt00001-0000-0000-0000-000000000027', 'content', 'sports', 100, '2025-06-16T18:00:00Z', '2025-06-16T17:00:00Z', '2025-06-16T18:00:00Z'),
   ('wh00002-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000012', 'cnt00003-0000-0000-0000-000000000001', 'content', 'games', 100, '2025-06-15T20:00:00Z', '2025-06-15T19:00:00Z', '2025-06-15T20:00:00Z'),
   ('wh00002-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000012', 'cnt00003-0000-0000-0000-000000000008', 'content', 'games', 67, '2025-06-16T21:00:00Z', '2025-06-16T20:00:00Z', '2025-06-16T21:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 21: SUBSCRIPTIONS
-- ============================================================================

INSERT INTO "subscriptions" (id, "userId", "planType", status, "startDate", "endDate", "nextBillingDate", "paymentMethod") VALUES
  ('sub0001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'standard', 'active', '2025-06-01T00:00:00Z', '2025-07-01T00:00:00Z', '2025-07-01T00:00:00Z', 'wallet'),
  ('sub0001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'premium', 'active', '2025-05-15T00:00:00Z', '2025-06-15T00:00:00Z', '2025-06-15T00:00:00Z', 'card'),
  ('sub0001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'basic', 'expired', '2025-04-01T00:00:00Z', '2025-05-01T00:00:00Z', NULL, 'wallet'),
  ('sub0001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000011', 'premium', 'active', '2025-06-01T00:00:00Z', '2025-07-01T00:00:00Z', '2025-07-01T00:00:00Z', 'card'),
  ('sub0001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000012', 'standard', 'cancelled', '2025-05-01T00:00:00Z', '2025-06-01T00:00:00Z', NULL, 'wallet')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 22: UNIVERSE FEATURE FLAGS
-- ============================================================================

INSERT INTO "universe_feature_flags" (id, "universeId", "featureKey", "isEnabled") VALUES
  ('ff00001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'voting_enabled', true),
  ('ff00001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000001', 'live_chat_enabled', true),
  ('ff00001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000001', 'predictions_enabled', true),
  ('ff00001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 'voting_enabled', false),
  ('ff00001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000005', 'voting_enabled', false),
  ('ff00001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000006', 'live_chat_enabled', true),
  -- Expanded feature flags
  ('ff00002-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000008', 'tournaments_enabled', true),
  ('ff00002-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000008', 'live_streams_enabled', true),
  ('ff00002-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000005', 'challenges_enabled', true),
  ('ff00002-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000007', 'live_sessions_enabled', true),
  ('ff00002-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000002', 'channels_enabled', true),
  ('ff00002-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000003', 'events_enabled', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 23: AUDIT LOGS (sample)
-- ============================================================================

INSERT INTO "audit_logs" (id, "actorId", "actorRole", action, "targetType", "targetId", status, details, "createdAt") VALUES
   ('al00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'admin', 'user.ban', 'user', 'a0000001-0000-0000-0000-000000000009', 'success', '{"reason":"Violation of community guidelines"}', '2025-06-10T10:00:00Z'),
   ('al00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'admin', 'content.publish', 'content', 'cnt00001-0000-0000-0000-000000000018', 'success', '{"title":"Lagos King: The Return"}', '2025-05-20T17:00:00Z'),
   ('al00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'moderator', 'content.flag', 'content', 'cnt00001-0000-0000-0000-000000000024', 'success', '{"reason":"Potential copyright concern"}', '2025-06-13T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 24: USER SAVED ITEMS
-- ============================================================================

INSERT INTO "saved_items" (id, "userId", "contentId") VALUES
  ('si00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000018'),
  ('si00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000029'),
  ('si00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000001'),
  ('si00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000030')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 25: FOLLOWING
-- ============================================================================

INSERT INTO "following" (id, "followerId", "followingId") VALUES
  ('fw00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003'),
  ('fw00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000004'),
  ('fw00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005'),
  ('fw00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003'),
  ('fw00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 26: USER UNIVERSE AFFINITY
-- ============================================================================

INSERT INTO "user_universe_affinity" (id, "userId", "universeId", "affinityScore") VALUES
  ('ua00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000001', 95.5),
  ('ua00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000007', 80.0),
  ('ua00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000005', 65.0),
  ('ua00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000007', 'u0000001-0000-0000-0000-000000000006', 90.0),
  ('ua00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'u0000001-0000-0000-0000-000000000005', 75.0),
  ('ua00001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000001', 88.0),
  ('ua00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000007', 72.0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 27: CREATOR PROFILES & CHANNELS
-- ============================================================================

INSERT INTO "creator_profiles" (id, "userId", "displayName", avatar, bio, banner, "socialLinks", verified) VALUES
  ('cp00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'Tunde Creates', '/images/placeholders/avatars/100x100_05.png', '{"instagram":"@tundecreates","twitter":"@tunde_creates","youtube":"TundeCreates"}', true),
  ('cp00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'Ngozi Vibes', '/images/placeholders/avatars/100x100_06.png', '{"instagram":"@ngozivibes","twitter":"@ngozi_vibes","tiktok":"@ngozivibes"}', true),
  ('cp00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'Emeka Studios', '/images/placeholders/avatars/100x100_07.png', '{"instagram":"@emekastudios","twitter":"@emeka_studios","youtube":"EmekaStudios"}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "creator_channels" (id, "creatorId", name, description, category) VALUES
  ('ch00001-0000-0000-0000-000000000001', 'cp00001-0000-0000-0000-000000000001', 'Tunde Creates Hub', 'All things entertainment, reality TV, and pop culture from Tunde.', 'entertainment'),
  ('ch00001-0000-0000-0000-000000000002', 'cp00001-0000-0000-0000-000000000002', 'Ngozi Fashion World', 'Fashion, lifestyle, and beauty content from Ngozi.', 'lifestyle'),
  ('ch00001-0000-0000-0000-000000000003', 'cp00001-0000-0000-0000-000000000003', 'Emeka Film Studio', 'Behind the scenes of independent Nigerian filmmaking.', 'film')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "creator_earnings" (id, "creatorId", amount, type, status, "paidAt") VALUES
  ('ce00001-0000-0000-0000-000000000001', 'cp00001-0000-0000-0000-000000000001', 25000.00, 'subscription', 'completed', '2025-06-15T00:00:00Z'),
  ('ce00001-0000-0000-0000-000000000002', 'cp00001-0000-0000-0000-000000000001', 5000.00, 'tip', 'completed', '2025-06-10T12:00:00Z'),
  ('ce00001-0000-0000-0000-000000000003', 'cp00001-0000-0000-0000-000000000002', 18000.00, 'subscription', 'completed', '2025-06-14T00:00:00Z'),
  ('ce00001-0000-0000-0000-000000000004', 'cp00001-0000-0000-0000-000000000002', 3500.00, 'tip', 'completed', '2025-06-08T16:00:00Z'),
  ('ce00001-0000-0000-0000-000000000005', 'cp00001-0000-0000-0000-000000000003', 42000.00, 'rental', 'completed', '2025-06-12T00:00:00Z'),
  ('ce00001-0000-0000-0000-000000000006', 'cp00001-0000-0000-0000-000000000003', 8000.00, 'tip', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "creator_challenges" (id, "creatorId", title, description, prize, "startDate", "endDate", status) VALUES
  ('cc00001-0000-0000-0000-000000000001', 'cp00001-0000-0000-0000-000000000001', 'Best Reaction Video Challenge', 'Create the funniest reaction video to this week''s BBNaija highlights. Winner gets 50,000 NGN!', '50000.00', '2025-06-15T00:00:00Z', '2025-06-22T23:59:59Z', 'active'),
  ('cc00001-0000-0000-0000-000000000002', 'cp00001-0000-0000-0000-000000000002', 'Lagos Fashion Week Challenge', 'Show us your best Lagos Fashion Week inspired outfit. Most creative wins!', '30000.00', '2025-06-10T00:00:00Z', '2025-06-20T23:59:59Z', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "challenge_entries" (id, "challengeId", "userId", "contentUrl") VALUES
  ('ce00002-0000-0000-0000-000000000001', 'cc00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'),
  ('ce00002-0000-0000-0000-000000000002', 'cc00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'),
  ('ce00002-0000-0000-0000-000000000003', 'cc00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "payout_requests" (id, "creatorId", amount, method, "accountDetails", status, "processedAt") VALUES
  ('pr00001-0000-0000-0000-000000000001', 'cp00001-0000-0000-0000-000000000001', 20000.00, 'bank_transfer', '{"bank":"GTBank","accountNumber":"0123456789","accountName":"Tunde Adebayo"}', 'completed', '2025-06-16T10:00:00Z'),
  ('pr00001-0000-0000-0000-000000000002', 'cp00001-0000-0000-0000-000000000003', 35000.00, 'bank_transfer', '{"bank":"Access Bank","accountNumber":"9876543210","accountName":"Emeka Nwosu"}', 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 28.5: NOTIFICATION PREFERENCES
-- ============================================================================

INSERT INTO "notification_preferences" (id, "userId", "pushEnabled", "emailEnabled", "smsEnabled", "inAppEnabled") VALUES
   ('np00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', true, true, false, true),
   ('np00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', true, true, false, true),
   ('np00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', true, false, false, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 28.8: ROLES & PERMISSIONS (Auth Service)
-- ============================================================================

INSERT INTO "roles" (id, name, description) VALUES
   ('rl00001-0000-0000-0000-000000000001', 'admin', 'Platform administrator'),
   ('rl00001-0000-0000-0000-000000000002', 'moderator', 'Content moderator'),
   ('rl00001-0000-0000-0000-000000000003', 'creator', 'Content creator'),
   ('rl00001-0000-0000-0000-000000000004', 'user', 'Regular user')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "permissions" (id, name, description, resource, action) VALUES
   ('pm00001-0000-0000-0000-000000000001', 'manage_users', 'Manage all users', 'users', 'manage'),
   ('pm00001-0000-0000-0000-000000000002', 'moderate_content', 'Moderate content', 'content', 'moderate'),
   ('pm00001-0000-0000-0000-000000000003', 'create_content', 'Create content', 'content', 'create'),
   ('pm00001-0000-0000-0000-000000000004', 'view_premium', 'View premium content', 'content', 'view')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "role_permissions" (id, "roleId", "permissionId") VALUES
   ('rp00001-0000-0000-0000-000000000001', 'rl00001-0000-0000-0000-000000000001', 'pm00001-0000-0000-0000-000000000001'),
   ('rp00001-0000-0000-0000-000000000002', 'rl00001-0000-0000-0000-000000000001', 'pm00001-0000-0000-0000-000000000002'),
   ('rp00001-0000-0000-0000-000000000003', 'rl00001-0000-0000-0000-000000000002', 'pm00001-0000-0000-0000-000000000002'),
   ('rp00001-0000-0000-0000-000000000004', 'rl00001-0000-0000-0000-000000000003', 'pm00001-0000-0000-0000-000000000003'),
   ('rp00001-0000-0000-0000-000000000005', 'rl00001-0000-0000-0000-000000000004', 'pm00001-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 28.9: NOTIFICATION TEMPLATES & CAMPAIGNS
-- ============================================================================

INSERT INTO "notification_templates" (id, key, channel, subject, body, variables, "isActive") VALUES
   ('nt00001-0000-0000-0000-000000000001', 'welcome_email', 'email', 'Welcome to Azeebo+', 'Welcome {{displayName}}! Start exploring Nigerian entertainment.', '{"displayName":"string"}', true),
   ('nt00001-0000-0000-0000-000000000002', 'new_content', 'inapp', NULL, '{{creator}} uploaded {{title}}', '{"creator":"string","title":"string"}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "campaigns" (id, name, "templateKey", channel, audience, status) VALUES
   ('cmp0001-0000-0000-0000-000000000001', 'June Content Update', 'new_content', 'inapp', '{"userIds":["a0000001-0000-0000-0000-000000000006","a0000001-0000-0000-0000-000000000007","a0000001-0000-0000-0000-000000000008"]}', 'draft')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 29: RECOMMENDATION SERVICE TABLES
-- ============================================================================

INSERT INTO "product_events" (id, type, "userId", metadata, timestamp) VALUES
  ('pe00001-0000-0000-0000-000000000001', 'content_view', 'a0000001-0000-0000-0000-000000000006', '{"contentId":"cnt00001-0000-0000-0000-000000000001","universeId":"u0000001-0000-0000-0000-000000000001"}', '2025-06-15T20:30:00Z'),
  ('pe00001-0000-0000-0000-000000000002', 'content_view', 'a0000001-0000-0000-0000-000000000008', '{"contentId":"cnt00001-0000-0000-0000-000000000007"}', '2025-06-14T10:15:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "levels" (id, name, rank, "minPoints", icon, color) VALUES
  ('lvl00001-0000-0000-0000-000000000001', 'Bronze', 1, 0, '🥉', '#CD7F32'),
  ('lvl00001-0000-0000-0000-000000000002', 'Silver', 2, 500, '🥈', '#C0C0C0'),
  ('lvl00001-0000-0000-0000-000000000003', 'Gold', 3, 2000, '🥇', '#FFD700')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "badges" (id, name, description, icon, points) VALUES
  ('bdg00001-0000-0000-0000-000000000001', 'First Watch', 'Watched your first content', '🎬', 100),
  ('bdg00001-0000-0000-0000-000000000002', 'Binge Watcher', 'Watched 10 episodes in a day', '📺', 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reward_accounts" (id, "userId", points, "levelId", streak, "lastLoginAt") VALUES
  ('ra00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 1250, 'lvl00001-0000-0000-0000-000000000002', 7, '2025-06-15T12:00:00Z'),
  ('ra00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 800, 'lvl00001-0000-0000-0000-000000000001', 3, '2025-06-15T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "points_ledger" (id, "userId", points, type, reason) VALUES
  ('pl00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 100, 'credit', 'Daily login bonus'),
  ('pl00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 50, 'credit', 'Content watched bonus'),
  ('pl00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 25, 'credit', 'New user bonus')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 28.7: SEARCH QUERY LOGS
-- ============================================================================

INSERT INTO "search_query_logs" (id, query, count, "lastSearchAt") VALUES
   ('sq00001-0000-0000-0000-000000000001', 'BBNaija', 156, '2025-06-15T20:00:00Z'),
   ('sq00001-0000-0000-0000-000000000002', 'Burna Boy', 89, '2025-06-14T19:00:00Z'),
   ('sq00001-0000-0000-0000-000000000003', 'comedy', 234, '2025-06-13T18:00:00Z')
ON CONFLICT (query) DO UPDATE SET
   count = EXCLUDED.count,
   "lastSearchAt" = EXCLUDED."lastSearchAt";

INSERT INTO "user_searches" (id, "userId", "queryId", "resultsCount", "createdAt") VALUES
   ('us00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'sq00001-0000-0000-0000-000000000001', 5, '2025-06-15T20:00:00Z'),
   ('us00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 'sq00001-0000-0000-0000-000000000003', 12, '2025-06-13T18:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 30: MISCELLANEOUS & DEMO CONTENT VERSION
-- ============================================================================

INSERT INTO "demo_content_versions" (id, version) VALUES
   ('dcv0001-0000-0000-0000-000000000001', '1.0.0')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 31: OPERATIONS TABLES
-- ============================================================================

INSERT INTO "reality_shows" (id, title, description, thumbnail, banner, status, "universeId") VALUES
  ('rs00001-0000-0000-0000-000000000001', 'Big Brother Naija Season 10', 'The biggest reality show in Africa. Housemates compete for the grand prize.', '/images/placeholders/content/800x450_27.png', '/images/placeholders/banners/1200x400_01.png', 'active', 'u0000001-0000-0000-0000-000000000001'),
  ('rs00001-0000-0000-0000-000000000002', 'The Real Housewives of Lagos Season 2', 'Glamour, shade, and drama in Lagos high society.', '/images/placeholders/content/800x450_28.png', '/images/placeholders/banners/1200x400_01.png', 'active', 'u0000001-0000-0000-0000-000000000001'),
  ('rs00001-0000-0000-0000-000000000003', 'Love Island Naija Season 3', 'Singles look for love in the villa. Who will couple up?', '/images/placeholders/content/800x450_29.png', '/images/placeholders/banners/1200x400_01.png', 'active', 'u0000001-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reality_seasons" (id, "showId", number, "startDate", "endDate") VALUES
  ('rse0001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 10, '2025-05-01T00:00:00Z', '2025-08-01T00:00:00Z'),
  ('rse0001-0000-0000-0000-000000000002', 'rs00001-0000-0000-0000-000000000002', 2, '2025-04-15T00:00:00Z', '2025-07-15T00:00:00Z'),
  ('rse0001-0000-0000-0000-000000000003', 'rs00001-0000-0000-0000-000000000003', 3, '2025-06-01T00:00:00Z', '2025-09-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reality_episodes" (id, "seasonId", number, title, thumbnail, "mediaUrl", "airedAt", "viewCount") VALUES
  ('rep0001-0000-0000-0000-000000000001', 'rse0001-0000-0000-0000-000000000001', 1, 'Season Premiere', '/images/placeholders/content/800x450_30.png', 'https://www.youtube.com/watch?v=YQHsXMglC9A', '2025-05-01T20:00:00Z', 567000),
  ('rep0001-0000-0000-0000-000000000002', 'rse0001-0000-0000-0000-000000000001', 45, 'Day 45 Highlights', '/images/placeholders/content/800x450_01.png', 'https://www.youtube.com/watch?v=RgKAFK5djSk', '2025-06-15T20:00:00Z', 245000),
  ('rep0001-0000-0000-0000-000000000003', 'rse0001-0000-0000-0000-000000000002', 1, 'Season 2 Premiere', '/images/placeholders/content/800x450_02.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', '2025-04-15T20:00:00Z', 345000),
  ('rep0001-0000-0000-0000-000000000004', 'rse0001-0000-0000-0000-000000000002', 3, 'Ladies Night Out', '/images/placeholders/content/800x450_03.png', 'https://www.youtube.com/watch?v=60ItHLz5WEQ', '2025-05-06T20:00:00Z', 189000),
  ('rep0001-0000-0000-0000-000000000005', 'rse0001-0000-0000-0000-000000000003', 1, 'Island Opens', '/images/placeholders/content/800x450_04.png', 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', '2025-06-01T21:00:00Z', 234000),
  ('rep0001-0000-0000-0000-000000000006', 'rse0001-0000-0000-0000-000000000003', 8, 'Coupling Ceremony', '/images/placeholders/content/800x450_05.png', 'https://www.youtube.com/watch?v=IcrbM1l_BoI', '2025-06-10T21:00:00Z', 156000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reality_contestants" (id, "showId", name, thumbnail, "socialLinks") VALUES
  ('rc00001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 'Chomzy', '/images/placeholders/cast/200x200_02.png', '{"instagram":"@chomzy_bbn","twitter":"@chomzy_bbn"}'),
  ('rc00001-0000-0000-0000-000000000002', 'rs00001-0000-0000-0000-000000000001', 'Phyna', '/images/placeholders/cast/200x200_03.png', '{"instagram":"@phynaaa","twitter":"@phyna_bbn"}'),
  ('rc00001-0000-0000-0000-000000000003', 'rs00001-0000-0000-0000-000000000001', 'Bella', '/images/placeholders/cast/200x200_04.png', '{"instagram":"@bella_bbn","twitter":"@bella_bbnaija"}'),
  ('rc00001-0000-0000-0000-000000000004', 'rs00001-0000-0000-0000-000000000001', 'Groovy', '/images/placeholders/cast/200x200_05.png', '{"instagram":"@groovy_bbn","twitter":"@groovy_bbn"}'),
  ('rc00001-0000-0000-0000-000000000005', 'rs00001-0000-0000-0000-000000000002', 'Chioma', '/images/placeholders/cast/200x200_06.png', '{"instagram":"@chioma_rhol","twitter":"@chioma_rhol"}'),
  ('rc00001-0000-0000-0000-000000000006', 'rs00001-0000-0000-0000-000000000002', 'Iyabo', '/images/placeholders/cast/200x200_01.png', '{"instagram":"@iyabo_rhol","twitter":"@iyabo_rhol"}'),
  ('rc00001-0000-0000-0000-000000000007', 'rs00001-0000-0000-0000-000000000003', 'Kazan', '/images/placeholders/cast/200x200_02.png', '{"instagram":"@kazan_li","twitter":"@kazan_island"}'),
  ('rc00001-0000-0000-0000-000000000008', 'rs00001-0000-0000-0000-000000000003', 'Daniella', '/images/placeholders/cast/200x200_03.png', '{"instagram":"@daniella_li","twitter":"@daniella_island"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reality_votes" (id, "userId", "contestantId", "showId", "episodeId") VALUES
  ('rv00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'rc00001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'rc00001-0000-0000-0000-000000000002', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000005', 'rs00001-0000-0000-0000-000000000002', 'rep0001-0000-0000-0000-000000000004'),
  ('rv00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000008', 'rc00001-0000-0000-0000-000000000006', 'rs00001-0000-0000-0000-000000000002', 'rep0001-0000-0000-0000-000000000004'),
  ('rv00001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000007', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006'),
  ('rv00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'rc00001-0000-0000-0000-000000000007', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006'),
  ('rv00001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'rc00001-0000-0000-0000-000000000008', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006'),
  ('rv00001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000003', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000007', 'rc00001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000008', 'rc00001-0000-0000-0000-000000000002', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000004', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002'),
  ('rv00001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000007', 'rc00001-0000-0000-0000-000000000008', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006'),
  ('rv00001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000008', 'rc00001-0000-0000-0000-000000000007', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006'),
  ('rv00001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000006', 'rs00001-0000-0000-0000-000000000002', 'rep0001-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reality_supervotes" (id, "userId", "contestantId", "showId", amount) VALUES
  ('rsv0001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 100.00),
  ('rsv0001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'rc00001-0000-0000-0000-000000000001', 'rs00001-0000-0000-0000-000000000001', 200.00),
  ('rsv0001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000007', 'rs00001-0000-0000-0000-000000000003', 150.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "reality_predictions" (id, "userId", "showId", "episodeId", "contestantId", prediction) VALUES
  ('rp00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002', 'rc00001-0000-0000-0000-000000000001', '{"event":"winner","confidence":"high"}'),
  ('rp00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002', 'rc00001-0000-0000-0000-000000000002', '{"event":"eviction","confidence":"medium"}'),
  ('rp00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'rs00001-0000-0000-0000-000000000001', 'rep0001-0000-0000-0000-000000000002', 'rc00001-0000-0000-0000-000000000004', '{"event":"head_of_house","confidence":"low"}'),
  ('rp00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000007', '{"event":"coupling","confidence":"high"}'),
  ('rp00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000008', 'rs00001-0000-0000-0000-000000000003', 'rep0001-0000-0000-0000-000000000006', 'rc00001-0000-0000-0000-000000000008', '{"event":"dumping","confidence":"medium"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 29: SPORTS EVENTS & PREDICTIONS
-- ============================================================================

INSERT INTO "sports_events" (id, title, sport, "startsAt", "endsAt", status, metadata) VALUES
  ('se00001-0000-0000-0000-000000000001', 'NPFL Matchday 15: Enyimba vs Rangers', 'football', '2025-06-15T16:00:00Z', '2025-06-15T18:00:00Z', 'completed', '{"league":"NPFL","venue":"Aba Stadium","attendance":15000}'),
  ('se00001-0000-0000-0000-000000000002', 'Super Eagles vs Cape Verde - WCQ', 'football', '2025-06-11T19:00:00Z', '2025-06-11T21:00:00Z', 'completed', '{"league":"FIFA WCQ","venue":"Moshood Abiola Stadium","attendance":45000}'),
  ('se00001-0000-0000-0000-000000000003', 'Lagos City Marathon 2025', 'athletics', '2025-05-15T06:00:00Z', '2025-05-15T14:00:00Z', 'completed', '{"event":"Lagos Marathon","distance":"42km","participants":50000}'),
  ('se00001-0000-0000-0000-000000000004', 'D''Tigress vs Mali - AFROBASKET Qualifier', 'basketball', '2025-06-10T18:00:00Z', '2025-06-10T20:00:00Z', 'completed', '{"league":"AFROBASKET","venue":"National Stadium","attendance":8000}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "event_teams" (id, "eventId", name, logo, score, "order") VALUES
  ('et00001-0000-0000-0000-000000000001', 'se00001-0000-0000-0000-000000000001', 'Enyimba FC', '/images/placeholders/avatars/100x100_08.png', 2, 1),
  ('et00001-0000-0000-0000-000000000002', 'se00001-0000-0000-0000-000000000001', 'Rangers International', '/images/placeholders/avatars/100x100_09.png', 1, 2),
  ('et00001-0000-0000-0000-000000000003', 'se00001-0000-0000-0000-000000000002', 'Nigeria (Super Eagles)', '/images/placeholders/avatars/100x100_10.png', 3, 1),
  ('et00001-0000-0000-0000-000000000004', 'se00001-0000-0000-0000-000000000002', 'Cape Verde', '/images/placeholders/avatars/100x100_11.png', 1, 2),
  ('et00001-0000-0000-0000-000000000005', 'se00001-0000-0000-0000-000000000004', 'Nigeria (D''Tigress)', '/images/placeholders/avatars/100x100_12.png', 78, 1),
  ('et00001-0000-0000-0000-000000000006', 'se00001-0000-0000-0000-000000000004', 'Mali', '/images/placeholders/avatars/100x100_01.png', 65, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "prediction_markets" (id, "eventId", question, options, odds, "totalPool", status) VALUES
  ('pm00001-0000-0000-0000-000000000001', 'se00001-0000-0000-0000-000000000001', 'Who will win the match?', '["Enyimba FC", "Rangers International", "Draw"]', '{"home":1.80,"away":2.20,"draw":3.10}', 25000.00, 'settled'),
  ('pm00001-0000-0000-0000-000000000002', 'se00001-0000-0000-0000-000000000002', 'Who will qualify for the World Cup?', '["Nigeria", "Cape Verde"]', '{"nigeria":1.30,"cape_verde":3.50}', 150000.00, 'settled')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "prediction_entries" (id, "userId", "eventId", "marketId", prediction, points) VALUES
  ('pe00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'se00001-0000-0000-0000-000000000001', 'pm00001-0000-0000-0000-000000000001', '{"choice":"Enyimba FC","amount":500}', 10),
  ('pe00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'se00001-0000-0000-0000-000000000001', 'pm00001-0000-0000-0000-000000000001', '{"choice":"Rangers International","amount":300}', 0),
  ('pe00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'se00001-0000-0000-0000-000000000002', 'pm00001-0000-0000-0000-000000000002', '{"choice":"Nigeria","amount":1000}', 10),
  ('pe00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000008', 'se00001-0000-0000-0000-000000000002', 'pm00001-0000-0000-0000-000000000002', '{"choice":"Nigeria","amount":2000}', 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 30: GAMES & TOURNAMENTS
-- ============================================================================

INSERT INTO "games" (id, title, slug, description, thumbnail, category, difficulty, "playCount", "isActive") VALUES
  ('gm00001-0000-0000-0000-000000000001', 'FIFA Ultimate Quiz', 'fifa-ultimate-quiz', 'Test your knowledge of FIFA football with 50 questions.', '/images/placeholders/content/800x450_06.png', 'trivia', 'medium', 12500, true),
  ('gm00001-0000-0000-0000-000000000002', 'Naija Music Trivia', 'naija-music-trivia', 'How well do you know Nigerian music? Play to find out!', '/images/placeholders/content/800x450_07.png', 'trivia', 'easy', 8900, true),
  ('gm00001-0000-0000-0000-000000000003', 'NPFL Predictor', 'npfl-predictor', 'Predict NPFL match results and earn points.', '/images/placeholders/content/800x450_08.png', 'prediction', 'medium', 5600, true),
  ('gm00001-0000-0000-0000-000000000004', 'Lagos City Quiz', 'lagos-city-quiz', 'How well do you know Lagos? Landmarks, food, and culture.', '/images/placeholders/content/800x450_09.png', 'trivia', 'easy', 7800, true),
  ('gm00001-0000-0000-0000-000000000005', 'Nollywood Movie Quiz', 'nollywood-movie-quiz', 'Test your knowledge of Nollywood movies and actors.', '/images/placeholders/content/800x450_10.png', 'trivia', 'hard', 4500, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "game_questions" (id, "gameId", question, answer, options, points, "order", "timeLimit") VALUES
  ('gq00001-0000-0000-0000-000000000001', 'gm00001-0000-0000-0000-000000000001', 'Who won the 2022 FIFA World Cup?', 'Argentina', '["Brazil", "Argentina", "France", "Germany"]', 10, 1, 30),
  ('gq00001-0000-0000-0000-000000000002', 'gm00001-0000-0000-0000-000000000001', 'How many teams participate in the FIFA World Cup?', '48', '["32", "48", "64", "24"]', 10, 2, 30),
  ('gq00001-0000-0000-0000-000000000003', 'gm00001-0000-0000-0000-000000000001', 'Which country has won the most FIFA World Cups?', 'Brazil', '["Germany", "Brazil", "Italy", "Argentina"]', 10, 3, 30),
  ('gq00002-0000-0000-0000-000000000001', 'gm00001-0000-0000-0000-000000000002', 'Who is known as the African Giant?', 'Burna Boy', '["Wizkid", "Davido", "Burna Boy", "Rema"]', 10, 1, 30),
  ('gq00002-0000-0000-0000-000000000002', 'gm00001-0000-0000-0000-000000000002', 'Which album won Burna Boy a Grammy?', 'Twice As Tall', '["African Giant", "Twice As Tall", "Love Damini", "On A Spaceship"]', 10, 2, 30),
  ('gq00002-0000-0000-0000-000000000003', 'gm00001-0000-0000-0000-000000000002', 'What year did Wizkid release "Essence"?', '2020', '["2019", "2020", "2021", "2022"]', 10, 3, 30),
  ('gq00003-0000-0000-0000-000000000001', 'gm00001-0000-0000-0000-000000000003', 'Who won the NPFL last season?', 'Enyimba', '["Enyimba", "Rangers", "Kano Pillars", "Remo Stars"]', 10, 1, 30),
  ('gq00003-0000-0000-0000-000000000002', 'gm00001-0000-0000-0000-000000000003', 'How many goals did Victor Osimhen score in Serie A last season?', '26', '["22", "26", "30", "18"]', 10, 2, 30),
  ('gq00003-0000-0000-0000-000000000003', 'gm00001-0000-0000-0000-000000000003', 'Which Nigerian player plays for Chelsea?', 'Noni Madueke', '["Wilfried Zaha", "Noni Madueke", "Alex Iwobi", "Calvert-Lewin"]', 10, 3, 30),
  ('gq00004-0000-0000-0000-000000000001', 'gm00001-0000-0000-0000-000000000004', 'What is the capital of Lagos State?', 'Ikeja', '["Lekki", "Ikeja", "Yaba", "Victoria Island"]', 10, 1, 30),
  ('gq00004-0000-0000-0000-000000000002', 'gm00001-0000-0000-0000-000000000004', 'Which bridge connects Lagos Island to the mainland?', 'Third Mainland Bridge', '["Eko Bridge", "Third Mainland Bridge", "Carter Bridge", "Lekki Bridge"]', 10, 2, 30),
  ('gq00004-0000-0000-0000-000000000003', 'gm00001-0000-0000-0000-000000000004', 'What is the most popular food in Lagos?', 'Jollof Rice', '["Suya", "Jollof Rice", "Pepper Soup", "Fried Rice"]', 10, 3, 30),
  ('gq00005-0000-0000-0000-000000000001', 'gm00001-0000-0000-0000-000000000005', 'Who directed "Lionheart" (2018)?', 'Genevieve Nnaji', '["Kunle Afolayan", "Genevieve Nnaji", "Kemi Adetiba", "Mildred Okwo"]', 10, 1, 30),
  ('gq00005-0000-0000-0000-000000000002', 'gm00001-0000-0000-0000-000000000005', 'Which Nollywood actor is known as "Mr. Ibu"?', 'John Okafor', '["Patience Ozokwor", "John Okafor", "Osita Iheme", "Chinedu Ikedieze"]', 10, 2, 30),
  ('gq00005-0000-0000-0000-000000000003', 'gm00001-0000-0000-0000-000000000005', 'What is the highest-grossing Nollywood film of all time?', 'Living in Bondage', '["The Wedding Party", "Living in Bondage", "Omo Ghetto", "A Trip to Jamaica"]', 10, 3, 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "tournaments" (id, title, "startsAt", "endsAt", "entryFee", "prizePool", status) VALUES
  ('tn00001-0000-0000-0000-000000000001', 'Weekly FIFA Showdown', '2025-06-16T18:00:00Z', '2025-06-16T22:00:00Z', 500.00, 10000.00, 'completed'),
  ('tn00001-0000-0000-0000-000000000002', 'Monthly Naija Gaming Championship', '2025-07-01T14:00:00Z', '2025-07-01T22:00:00Z', 1000.00, 50000.00, 'upcoming')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "tournament_entries" (id, "tournamentId", "userId", score) VALUES
  ('te00001-0000-0000-0000-000000000001', 'tn00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000012', 850),
  ('te00001-0000-0000-0000-000000000002', 'tn00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 720),
  ('te00001-0000-0000-0000-000000000003', 'tn00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 680),
  ('te00001-0000-0000-0000-000000000004', 'tn00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 590)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 31: COMEDY EXPANSION
-- ============================================================================

INSERT INTO "comedian_profiles" (id, "userId", bio, banner, "socialLinks", verified) VALUES
  ('cmf0001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'Comedy content creator and reaction specialist. Making you laugh one video at a time.', '/images/placeholders/banners/1200x400_01.png', '{"instagram":"@tundecreates","youtube":"TundeCreates"}', true),
  ('cmf0001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'Independent filmmaker and comedy producer. Nigerian stories, global impact.', '/images/placeholders/banners/1200x400_01.png', '{"instagram":"@emekastudios","youtube":"EmekaStudios"}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "comedy_clips" (id, "comedianId", "creatorId", title, thumbnail, "mediaUrl", "viewCount", "shareCount", "likeCount") VALUES
  ('clc0001-0000-0000-0000-000000000001', 'cmf0001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'When Nigerian Parents Find TikTok', '/images/placeholders/content/800x450_11.png', 'https://www.youtube.com/watch?v=60ItHLz5WEQ', 156000, 23000, 89000),
  ('clc0001-0000-0000-0000-000000000002', 'cmf0001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'Lagos Traffic vs Abuja Traffic', '/images/placeholders/content/800x450_12.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 98000, 15000, 67000),
  ('clc0001-0000-0000-0000-000000000003', 'cmf0001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'Nollywood Action Scenes: Then vs Now', '/images/placeholders/content/800x450_13.png', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 78000, 12000, 45000),
  ('clc0001-0000-0000-0000-000000000004', 'cmf0001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'How To Speak Nigerian English', '/images/placeholders/content/800x450_14.png', 'https://www.youtube.com/watch?v=JGwWNGJdvx8', 123000, 18000, 78000)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 32: NOTIFICATIONS
-- ============================================================================

INSERT INTO "notifications" (id, "userId", type, title, message, metadata, "readAt", "createdAt") VALUES
  ('nt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'system', 'Welcome to Azeebo+!', 'Thank you for joining Azeebo+. Start exploring content now!', '{"action":"onboarding"}', '2025-06-01T10:05:00Z', '2025-06-01T10:00:00Z'),
  ('nt00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'payment', 'Wallet Funded', 'Your wallet has been funded with NGN 20,000.00 via Paystack.', '{"amount":20000,"provider":"paystack"}', '2025-06-01T10:01:00Z', '2025-06-01T10:00:30Z'),
  ('nt00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'content', 'New Episode Available', 'BBNaija Season 10: Day 46 is now streaming!', '{"contentId":"cnt00002-0000-0000-0000-000000000001"}', NULL, '2025-06-16T20:00:00Z'),
  ('nt00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'social', 'New Follower', 'Tunde Creates is now following you.', '{"followerId":"a0000001-0000-0000-0000-000000000003"}', '2025-06-15T12:00:00Z', '2025-06-15T11:55:00Z'),
  ('nt00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000006', 'reward', 'Badge Earned!', 'You earned the "First Vote" badge for voting in BBNaija.', '{"badge":"first_vote"}', NULL, '2025-06-15T22:05:00Z'),
  ('nt00001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000007', 'system', 'Welcome to Azeebo+!', 'Thank you for joining Azeebo+. Start exploring content now!', '{"action":"onboarding"}', '2025-05-20T14:05:00Z', '2025-05-20T14:00:00Z'),
  ('nt00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'content', 'Premiere Tonight', 'Lagos King: The Return premieres tonight at 8PM!', '{"contentId":"cnt00001-0000-0000-0000-000000000018"}', '2025-05-20T17:00:00Z', '2025-05-20T16:00:00Z'),
  ('nt00001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'payment', 'Subscription Renewed', 'Your premium subscription has been renewed for NGN 5,000.00.', '{"amount":5000,"plan":"premium"}', '2025-05-15T08:05:00Z', '2025-05-15T08:00:00Z'),
  ('nt00001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000008', 'social', 'Comment Reply', 'Chomzy replied to your comment on BBNaija Day 45.', '{"commentId":"cm00001-0000-0000-0000-000000000002"}', NULL, '2025-06-16T10:00:00Z'),
  ('nt00001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000003', 'payment', 'Earnings Received', 'You received NGN 25,000.00 from subscriptions.', '{"amount":25000,"type":"subscription"}', '2025-06-15T00:05:00Z', '2025-06-15T00:00:00Z'),
  ('nt00001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000012', 'content', 'New Tournament', 'Weekly FIFA Showdown starts today! Join now.', '{"tournamentId":"tn00001-0000-0000-0000-000000000001"}', '2025-06-16T17:30:00Z', '2025-06-16T14:00:00Z'),
  ('nt00001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000012', 'reward', 'Tournament Winner', 'Congratulations! You won the Weekly FIFA Showdown!', '{"tournamentId":"tn00001-0000-0000-0000-000000000001","prize":3500}', NULL, '2025-06-16T22:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 33: LEADERBOARD & GAMIFICATION
-- ============================================================================

INSERT INTO "leaderboard_entries" (id, "userId", score, level) VALUES
  ('lb00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000012', 8500, 8),
  ('lb00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 7200, 7),
  ('lb00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 6800, 6),
  ('lb00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000007', 5400, 5),
  ('lb00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000011', 4200, 4),
  ('lb00001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 3800, 4),
  ('lb00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 2900, 3),
  ('lb00001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 1500, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 34: REFERRALS
-- ============================================================================

INSERT INTO "referrals" (id, "referrerId", "referredId", status, reward) VALUES
  ('rt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000007', 'completed', 500.00),
  ('rt00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', 'completed', 500.00),
  ('rt00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000011', 'pending', 0.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 35: MODERATION & SUPPORT
-- ============================================================================

INSERT INTO "moderation_queue" (id, "contentId", "reportedBy", "reportType", description, status, "reviewedBy", "reviewedAt") VALUES
  ('mt00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000007', 'copyright', 'Possible copyright concern in Mark Angel Comedy episode 345.', 'reviewing', 'a0000001-0000-0000-0000-000000000002', NULL),
  ('mt00001-0000-0000-0000-000000000002', NULL, 'a0000001-0000-0000-0000-000000000008', 'spam', 'Suspicious account posting spam comments across multiple videos.', 'pending', NULL, NULL),
  ('mt00001-0000-0000-0000-000000000003', 'cnt00002-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000006', 'other', 'Reported for inappropriate language in Lasisi Elenu clip.', 'resolved', 'a0000001-0000-0000-0000-000000000002', '2025-06-14T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "support_tickets" (id, "userId", subject, description, status, priority) VALUES
  ('st00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'Cannot access premium content', 'I have an active subscription but I cannot watch Lagos King: The Return. It keeps asking me to pay.', 'open', 'high'),
  ('st00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'Payment not reflecting', 'I funded my wallet 30 minutes ago but the balance has not updated. Transaction ID: PSK-TXN-003.', 'in_progress', 'medium')
ON CONFLICT (id) DO NOTHING;

-- Ensure webhook_retries table exists for payment-service
CREATE TABLE IF NOT EXISTS "webhook_retries" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "webhook_retries_eventId_idx" ON "webhook_retries"("eventId");
CREATE INDEX IF NOT EXISTS "webhook_retries_status_nextRetryAt_idx" ON "webhook_retries"("status", "nextRetryAt");

-- COMMIT removed: no transaction wrapper
