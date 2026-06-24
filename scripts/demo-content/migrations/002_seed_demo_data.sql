-- =============================================================================
-- Azeebo+ Demo Content Seed Data v1.0.0
-- Realistic Nigerian entertainment platform data for E2E testing.
-- All UUIDs are fixed for reproducibility across environments.
-- Passwords are bcrypt hashes of "Demo123!" for all test users.
-- =============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: SYSTEM SETTINGS
-- ============================================================================

INSERT INTO "system_settings" ("key", value, category, "description", "isPublic") VALUES
  ('site_name', '"Azeebo+"', 'general', 'Platform name', true),
  ('site_description', '"Nigeria''s premier entertainment streaming platform"', 'general', 'Platform tagline', true),
  ('maintenance_mode', 'false', 'general', 'Maintenance mode toggle', false),
  ('registration_enabled', 'true', 'auth', 'Allow new registrations', false),
  ('max_upload_size_mb', '500', 'uploads', 'Maximum file upload size in MB', false),
  ('default_currency', '"NGN"', 'payments', 'Default transaction currency', true),
  ('currency_symbol', '"₦"', 'payments', 'Currency display symbol', true),
  ('min_rental_price', '200', 'payments', 'Minimum rental price in NGN', false),
  ('max_rental_price', '50000', 'payments', 'Maximum rental price in NGN', false),
  ('featured_content_limit', '6', 'content', 'Max featured items on homepage', true),
  ('trending_window_hours', '168', 'content', 'Hours to consider for trending calc', false),
  ('comment_max_length', '2000', 'content', 'Max comment character length', false),
  ('screening_max_viewers', '10000', 'screenings', 'Default max viewers per screening', false),
  ('otp_expiry_minutes', '10', 'auth', 'OTP code expiration in minutes', false),
  ('social_google_enabled', 'true', 'social', 'Google OAuth login enabled', true),
  ('social_apple_enabled', 'true', 'social', 'Apple Sign-In enabled', true),
  ('seo_title', '"Azeebo+ - Stream Nigerian Entertainment"', 'seo', 'Default SEO title', true),
  ('seo_description', '"Watch reality shows, creator content, lifestyle, movies and more on Azeebo+"', 'seo', 'Default SEO description', true),
  ('support_email', '"support@azeeboplus.com"', 'contact', 'Support email address', true),
  ('terms_url', '"https://azeeboplus.com/terms"', 'legal', 'Terms of service URL', true)
ON CONFLICT ("key") DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- SECTION 2: USERS (Auth Service)
-- ============================================================================

-- Password hash for "Demo123!" (bcrypt)
-- $2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7

INSERT INTO "auth_users" (id, email, "phoneNumber", "passwordHash", "firstName", "lastName", "displayName", avatar, status, "emailVerified", "phoneVerified", "createdAt") VALUES
  -- Admin users
  ('a0000001-0000-0000-0000-000000000001', 'admin@azeeboplus.com', '+2348010000001', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Chidi', 'Okonkwo', 'Admin Chidi', 'https://ui-avatars.com/api/?name=Chidi+Okonkwo&background=1B5E20&color=fff', 'active', true, true, '2025-01-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000002', 'moderator@azeeboplus.com', '+2348010000002', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Amina', 'Bello', 'Mod Amina', 'https://ui-avatars.com/api/?name=Amina+Bello&background=E65100&color=fff', 'active', true, true, '2025-01-15T00:00:00Z'),
  -- Creator users
  ('a0000001-0000-0000-0000-000000000003', 'creator1@azeeboplus.com', '+2348020000003', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Tunde', 'Adebayo', 'Tunde Creates', 'https://ui-avatars.com/api/?name=Tunde+Adebayo&background=1565C0&color=fff', 'active', true, true, '2025-02-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000004', 'creator2@azeeboplus.com', '+2348020000004', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Ngozi', 'Eze', 'Ngozi Vibes', 'https://ui-avatars.com/api/?name=Ngozi+Eze&background=6A1B9A&color=fff', 'active', true, true, '2025-02-15T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000005', 'creator3@azeeboplus.com', '+2348020000005', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Emeka', 'Nwosu', 'Emeka Studios', 'https://ui-avatars.com/api/?name=Emeka+Nwosu&background=B71C1C&color=fff', 'active', true, true, '2025-03-01T00:00:00Z'),
  -- Regular user (viewer)
  ('a0000001-0000-0000-0000-000000000006', 'user1@azeeboplus.com', '+2348030000006', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Kemi', 'Adesanya', 'Kemi Watch', 'https://ui-avatars.com/api/?name=Kemi+Adesanya&background=00695C&color=fff', 'active', true, true, '2025-03-15T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000007', 'user2@azeeboplus.com', '+2348030000007', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Olumide', 'Fashola', 'Olumide F', 'https://ui-avatars.com/api/?name=Olumide+Fashola&background=4E342E&color=fff', 'active', true, true, '2025-04-01T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000008', 'user3@azeeboplus.com', '+2348030000008', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Fatima', 'Abubakar', 'Fatima A', 'https://ui-avatars.com/api/?name=Fatima+Abubakar&background=0277BD&color=fff', 'active', true, true, '2025-04-15T00:00:00Z'),
  -- Inactive / banned user (for edge-case testing)
  ('a0000001-0000-0000-0000-000000000009', 'banned@azeeboplus.com', '+2348040000009', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Chukwu', 'Mensah', 'Chukwu M', NULL, 'banned', true, false, '2025-02-20T00:00:00Z'),
  ('a0000001-0000-0000-0000-000000000010', 'unverified@azeeboplus.com', '+2348040000010', '$2b$10$YQ8GvTm.1FqX5pLz9vK3bOe7hG2dR4nS6wA8cM0xI1uJ3kF5lP7', 'Yemi', 'Osibajo', 'Yemi O', NULL, 'active', false, false, '2025-05-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 3: USER ROLES
-- ============================================================================

INSERT INTO "user_roles" (id, "userId", role, "grantedBy", "createdAt") VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'admin', 'system', '2025-01-01T00:00:00Z'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'moderator', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z'),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z'),
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'creator', 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 4: USER PROFILES (User Service)
-- ============================================================================

INSERT INTO "user_profiles" (id, "userId", "displayName", avatar, bio, location, "isPublic") VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Admin Chidi', 'https://ui-avatars.com/api/?name=Chidi+Okonkwo&background=1B5E20&color=fff', 'Platform administrator and entertainment enthusiast.', 'Lagos, Nigeria', true),
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Tunde Creates', 'https://ui-avatars.com/api/?name=Tunde+Adebayo&background=1565C0&color=fff', 'Content creator specializing in reality TV reactions and Nigerian pop culture commentary. 500K+ followers.', 'Lagos, Nigeria', true),
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Ngozi Vibes', 'https://ui-avatars.com/api/?name=Ngozi+Eze&background=6A1B9A&color=fff', 'Lifestyle and fashion content creator. Showing you the best of Nigerian living.', 'Abuja, Nigeria', true),
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Emeka Studios', 'https://ui-avatars.com/api/?name=Emeka+Nwosu&background=B71C1C&color=fff', 'Independent filmmaker and short film producer. Telling Nigerian stories to the world.', 'Enugu, Nigeria', true),
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'Kemi Watch', 'https://ui-avatars.com/api/?name=Kemi+Adesanya&background=00695C&color=fff', 'Entertainment junkie. Watching everything so you don''t have to.', 'Ibadan, Nigeria', true),
  ('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'Olumide F', 'https://ui-avatars.com/api/?name=Olumide+Fashola&background=4E342E&color=fff', 'Sports and comedy fan. Always up for a good laugh.', 'Lagos, Nigeria', true),
  ('c0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'Fatima A', 'https://ui-avatars.com/api/?name=Fatima+Abubakar&background=0277BD&color=fff', 'Music lover and reality TV addict. Big Brother is mySuper Bowl.', 'Kano, Nigeria', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 5: USER PREFERENCES
-- ============================================================================

INSERT INTO "user_preferences" (id, "userId", "darkMode", notifications, "contentPreferences") VALUES
  ('d0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', true, '{"email":true,"push":true,"sms":false}', '["reality","comedy","music"]'),
  ('d0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', false, '{"email":true,"push":false,"sms":true}', '["sports","comedy","games"]'),
  ('d0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', true, '{"email":false,"push":true,"sms":false}', '["reality","lifestyle","music"]')
ON CONFLICT (id) DO NOTHING;

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
  ('u0000001-0000-0000-0000-000000000008', 'games', 'Gaming', 'Nigerian gaming content, esports, reviews, and live streams.', '🎮', '#607D8B', true, 8)
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
  ('cnt00001-0000-0000-0000-000000000001', 'BBNaija Season 10: Day 45 Highlights', 'The drama intensifies as housemates face the latest nomination challenge. Who will survive the week?', 'https://picsum.photos/seed/bbnaija10/800/450', 'https://storage.azeeboplus.com/videos/bbnaija-s10-ep45.mp4', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 245000, '2025-06-15T20:00:00Z', '2025-06-15T20:00:00Z', 'premium', true, true, '{"duration":3600,"episode":45,"season":10,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000002', 'The Real Housewives of Lagos S2 E3', 'The ladies of Lagos bring the glamour and the shade in another explosive episode.', 'https://picsum.photos/seed/rholagos/800/450', 'https://storage.azeeboplus.com/videos/rholagos-s2-ep3.mp4', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 189000, '2025-06-12T20:00:00Z', '2025-06-12T20:00:00Z', 'standard', false, false, '{"duration":2700,"episode":3,"season":2,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000003', 'Nigerian Idol S9: Audition Highlights', 'The most emotional and hilarious auditions from this season of Nigerian Idol.', 'https://picsum.photos/seed/idol9/800/450', 'https://storage.azeeboplus.com/videos/idol-s9-auditions.mp4', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 312000, '2025-06-01T18:00:00Z', '2025-06-01T18:00:00Z', 'standard', false, false, '{"duration":4200,"episode":1,"season":9,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000004', 'Love Island Naija: Coupling Ceremony', 'New couples are formed as the islanders make their most important decisions yet.', 'https://picsum.photos/seed/loveisland/800/450', 'https://storage.azeeboplus.com/videos/loveisland-s3-coupling.mp4', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'published', 156000, '2025-06-10T21:00:00Z', '2025-06-10T21:00:00Z', 'premium', true, false, '{"duration":3300,"episode":8,"season":3,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000005', 'Cooking with Chioma: Jollof Rice Battle', 'Chef Chioma takes on the ultimate jollof rice challenge - Ghana vs Nigeria!', 'https://picsum.photos/seed/chiomajollof/800/450', 'https://storage.azeeboplus.com/videos/chioma-jollof.mp4', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'published', 89000, '2025-06-08T14:00:00Z', '2025-06-08T14:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000006', 'Survivor Naija: Immunity Challenge', 'Tribes clash in the most physically demanding immunity challenge of the season.', 'https://picsum.photos/seed/survivor/800/450', 'https://storage.azeeboplus.com/videos/survivor-s2-immunity.mp4', 'u0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'published', 67000, '2025-06-05T19:00:00Z', '2025-06-05T19:00:00Z', 'standard', false, false, '{"duration":2400,"episode":12,"season":2,"language":"en"}'),

  -- Creator Content (6 items)
  ('cnt00001-0000-0000-0000-000000000007', 'Lagos to Abuja Road Trip Vlog', 'Join me on an epic 12-hour road trip from Lagos to Abuja with unexpected stops and encounters.', 'https://picsum.photos/seed/lagabjvlog/800/450', 'https://storage.azeeboplus.com/videos/lagos-abuja-vlog.mp4', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 78000, '2025-06-14T10:00:00Z', '2025-06-14T10:00:00Z', 'basic', false, false, '{"duration":2400,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000008', 'My Apartment Tour - Lagos Luxury', 'Full tour of my new Lagos apartment. From empty space to dream home in 3 months!', 'https://picsum.photos/seed/apttour/800/450', 'https://storage.azeeboplus.com/videos/apartment-tour.mp4', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 234000, '2025-06-11T15:00:00Z', '2025-06-11T15:00:00Z', 'basic', false, false, '{"duration":1500,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000009', 'Day in My Life as a Nigerian Creator', 'A raw and real look at what it takes to create content in Lagos.', 'https://picsum.photos/seed/daylife/800/450', 'https://storage.azeeboplus.com/videos/day-in-life.mp4', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 156000, '2025-06-09T09:00:00Z', '2025-06-09T09:00:00Z', 'basic', false, false, '{"duration":1200,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000010', 'Reacting to My Old Videos', 'Looking back at my earliest content. Cringe alert! But also growth.', 'https://picsum.photos/seed/reactold/800/450', 'https://storage.azeeboplus.com/videos/reacting-old.mp4', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 92000, '2025-06-07T12:00:00Z', '2025-06-07T12:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000011', 'How I Started: My Creator Journey', 'From zero to 500K followers - the real story behind the success.', 'https://picsum.photos/seed/creatorjourney/800/450', 'https://storage.azeeboplus.com/videos/creator-journey.mp4', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'published', 187000, '2025-05-28T11:00:00Z', '2025-05-28T11:00:00Z', 'basic', false, false, '{"duration":2100,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000012', 'Ngozi x Zara Collaboration BTS', 'Behind the scenes of our latest fashion collaboration shoot in Lagos.', 'https://picsum.photos/seed/ngozibts/800/450', 'https://storage.azeeboplus.com/videos/ngozi-bts.mp4', 'u0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'published', 45000, '2025-06-13T16:00:00Z', '2025-06-13T16:00:00Z', 'standard', false, false, '{"duration":900,"language":"en"}'),

  -- Lifestyle (5 items)
  ('cnt00001-0000-0000-0000-000000000013', 'Lagos Street Food Guide: Yaba Edition', 'The ultimate guide to the best street food spots in Yaba, Lagos.', 'https://picsum.photos/seed/yabafood/800/450', 'https://storage.azeeboplus.com/videos/yaba-street-food.mp4', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 67000, '2025-06-06T13:00:00Z', '2025-06-06T13:00:00Z', 'basic', false, false, '{"duration":1800,"language":"en","location":"Yaba, Lagos"}'),
  ('cnt00001-0000-0000-0000-000000000014', 'My Skincare Routine for Nigerian Weather', 'Tested and trusted skincare products that work in our tropical climate.', 'https://picsum.photos/seed/skincare/800/450', 'https://storage.azeeboplus.com/videos/skincare-routine.mp4', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 123000, '2025-06-04T08:00:00Z', '2025-06-04T08:00:00Z', 'basic', false, false, '{"duration":900,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000015', 'Abuja Weekend Getaway Guide', 'Best spots to visit in Abuja this weekend. From restaurants to nature parks.', 'https://picsum.photos/seed/abujaweekend/800/450', 'https://storage.azeeboplus.com/videos/abuja-weekend.mp4', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 34000, '2025-05-30T09:00:00Z', '2025-05-30T09:00:00Z', 'basic', false, false, '{"duration":2400,"language":"en","location":"Abuja"}'),
  ('cnt00001-0000-0000-0000-000000000016', 'Nigerian Wedding Lookbook 2025', 'Top wedding guest outfit ideas for the 2025 Nigerian wedding season.', 'https://picsum.photos/seed/weddinglook/800/450', 'https://storage.azeeboplus.com/videos/wedding-lookbook.mp4', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'published', 89000, '2025-06-02T10:00:00Z', '2025-06-02T10:00:00Z', 'standard', false, false, '{"duration":1500,"language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000017', 'Home Workout: No Equipment Needed', 'Full body workout routine you can do at home. No gym required!', 'https://picsum.photos/seed/workout/800/450', 'https://storage.azeeboplus.com/videos/home-workout.mp4', 'u0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'published', 56000, '2025-05-25T07:00:00Z', '2025-05-25T07:00:00Z', 'basic', false, false, '{"duration":2700,"language":"en"}'),

  -- Movies (5 items)
  ('cnt00001-0000-0000-0000-000000000018', 'Lagos King: The Return', 'A retired crime lord must return to his old ways when his family is threatened. Epic Nollywood action thriller.', 'https://picsum.photos/seed/lagosking/800/450', 'https://storage.azeeboplus.com/videos/lagos-king.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 456000, '2025-05-20T18:00:00Z', '2025-05-20T18:00:00Z', 'premium', true, true, '{"duration":7200,"genre":"action/thriller","language":"en","rating":"16+"}'),
  ('cnt00001-0000-0000-0000-000000000019', 'Ada of Lagos', 'A young woman navigates love, career, and family expectations in modern Lagos.', 'https://picsum.photos/seed/adalagos/800/450', 'https://storage.azeeboplus.com/videos/ada-of-lagos.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 234000, '2025-06-01T17:00:00Z', '2025-06-01T17:00:00Z', 'standard', false, false, '{"duration":6600,"genre":"drama/romance","language":"en","rating":"12+"}'),
  ('cnt00001-0000-0000-0000-000000000020', 'The Ghost of₦aira Falls', 'A supernatural thriller set in a small Nigerian town with a dark secret.', 'https://picsum.photos/seed/ghostfalls/800/450', 'https://storage.azeeboplus.com/videos/ghost-naira-falls.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 123000, '2025-06-10T19:00:00Z', '2025-06-10T19:00:00Z', 'standard', false, false, '{"duration":5400,"genre":"horror/thriller","language":"en","rating":"18+"}'),
  ('cnt00001-0000-0000-0000-000000000021', 'Hustle in Victoria Island', 'Three friends risk everything on a tech startup in Lagos. Based on true events.', 'https://picsum.photos/seed/hustlevi/800/450', 'https://storage.azeeboplus.com/videos/hustle-vi.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 89000, '2025-06-08T16:00:00Z', '2025-06-08T16:00:00Z', 'basic', false, false, '{"duration":6000,"genre":"drama/comedy","language":"en","rating":"12+"}'),
  ('cnt00001-0000-0000-0000-000000000022', 'Love at First Jollof', 'A romantic comedy about two food bloggers who keep meeting at the same jollof rice competition.', 'https://picsum.photos/seed/lovejollof/800/450', 'https://storage.azeeboplus.com/videos/love-jollof.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'published', 178000, '2025-06-14T17:00:00Z', '2025-06-14T17:00:00Z', 'standard', false, false, '{"duration":5400,"genre":"romcom","language":"en","rating":"PG"}'),

  -- Comedy (4 items)
  ('cnt00001-0000-0000-0000-000000000023', 'AY Live 2025: Full Show', 'The biggest comedy show of the year. AY, Bovi, Akpororo, and more deliver non-stop laughs.', 'https://picsum.photos/seed/aylive/800/450', 'https://storage.azeeboplus.com/videos/ay-live-2025.mp4', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 567000, '2025-04-15T19:00:00Z', '2025-04-15T19:00:00Z', 'premium', true, false, '{"duration":10800,"genre":"stand-up/comedy","language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000024', 'Mark Angel Comedy: Episode 345', 'When Emmanuelle tries to write an exam without studying. Classic Naija comedy.', 'https://picsum.photos/seed/markangel/800/450', 'https://storage.azeeboplus.com/videos/markangel-345.mp4', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 890000, '2025-06-12T14:00:00Z', '2025-06-12T14:00:00Z', 'basic', false, false, '{"duration":600,"genre":"sketch comedy","language":"en","language":"pidgin"}'),
  ('cnt00001-0000-0000-0000-000000000025', 'Basketmouth: Yabasi Special', 'Basketmouth goes deep on Nigerian parents, relationships, and Jollof rice politics.', 'https://picsum.photos/seed/basketmouth/800/450', 'https://storage.azeeboplus.com/videos/basketmouth-special.mp4', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'published', 345000, '2025-05-20T20:00:00Z', '2025-05-20T20:00:00Z', 'premium', false, false, '{"duration":5400,"genre":"stand-up","language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000026', 'Craze Clown: Family Drama', 'When Nigerian parents discover TikTok. Pure comedy gold.', 'https://picsum.photos/seed/crazeclown/800/450', 'https://storage.azeeboplus.com/videos/crazeclown-family.mp4', 'u0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'published', 234000, '2025-06-03T12:00:00Z', '2025-06-03T12:00:00Z', 'basic', false, false, '{"duration":480,"genre":"sketch comedy","language":"en"}'),

  -- Sports (2 items)
  ('cnt00001-0000-0000-0000-000000000027', 'NPFL Highlights: Enyimba vs Rangers', 'The Oriental Derby delivers as always. All goals and key moments.', 'https://picsum.photos/seed/npfl/800/450', 'https://storage.azeeboplus.com/videos/npfl-highlights.mp4', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005', 'published', 78000, '2025-06-15T17:00:00Z', '2025-06-15T17:00:00Z', 'basic', false, false, '{"duration":1200,"sport":"football","league":"NPFL"}'),
  ('cnt00001-0000-0000-0000-000000000028', 'Super Eagles World Cup Qualifier Recap', 'Full analysis of Nigeria''s latest World Cup qualifying match.', 'https://picsum.photos/seed/supereagles/800/450', 'https://storage.azeeboplus.com/videos/super-eagles-recap.mp4', 'u0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'published', 456000, '2025-06-11T21:00:00Z', '2025-06-11T21:00:00Z', 'standard', false, false, '{"duration":1800,"sport":"football","league":"FIFA"}'),

  -- Music (2 items)
  ('cnt00001-0000-0000-0000-000000000029', 'Burna Boy: Live in Concert Lagos 2025', 'The full concert recording of Burna Boy''s sold-out Lagos show. An unforgettable night.', 'https://picsum.photos/seed/burnalagos/800/450', 'https://storage.azeeboplus.com/videos/burna-lagos-live.mp4', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'published', 1200000, '2025-05-10T20:00:00Z', '2025-05-10T20:00:00Z', 'premium', true, false, '{"duration":9000,"genre":"afrobeats/concert","language":"en"}'),
  ('cnt00001-0000-0000-0000-000000000030', 'Tems Acoustic Session: Unplugged', 'Tems performs her biggest hits stripped down in an intimate acoustic session.', 'https://picsum.photos/seed/temsacoustic/800/450', 'https://storage.azeeboplus.com/videos/tems-acoustic.mp4', 'u0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'published', 890000, '2025-06-07T19:00:00Z', '2025-06-07T19:00:00Z', 'standard', false, true, '{"duration":3600,"genre":"acoustic/rnb","language":"en"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 10: CONTENT-CATEGORY MAPPINGS
-- ============================================================================

INSERT INTO "content_categories" ("contentId", "categoryId") VALUES
  -- Trending items
  ('cnt00001-0000-0000-0000-000000000001', 'cat00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000018', 'cat00001-0000-0000-0000-000000000001'),
  ('cnt00001-0000-0000-0000-000000000029', 'cat00001-0000-0000-0000-000000000001'),
  -- New releases
  ('cnt00001-0000-0000-0000-000000000012', 'cat00001-0000-0000-0000-000000000002'),
  ('cnt00001-0000-0000-0000-000000000022', 'cat00001-0000-0000-0000-000000000002'),
  ('cnt00001-0000-0000-0000-000000000024', 'cat00001-0000-0000-0000-000000000002'),
  -- Editor picks
  ('cnt00001-0000-0000-0000-000000000030', 'cat00001-0000-0000-0000-000000000003'),
  ('cnt00001-0000-0000-0000-000000000019', 'cat00001-0000-0000-0000-000000000003'),
  -- Exclusive
  ('cnt00001-0000-0000-0000-000000000001', 'cat00001-0000-0000-0000-000000000004'),
  ('cnt00001-0000-0000-0000-000000000018', 'cat00001-0000-0000-0000-000000000004'),
  ('cnt00001-0000-0000-0000-000000000023', 'cat00001-0000-0000-0000-000000000004'),
  -- Free content
  ('cnt00001-0000-0000-0000-000000000005', 'cat00001-0000-0000-0000-000000000005'),
  ('cnt00001-0000-0000-0000-000000000024', 'cat00001-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 11: CONTENT-TAG MAPPINGS
-- ============================================================================

INSERT INTO "content_tags" ("contentId", "tagId") VALUES
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
  ('cnt00001-0000-0000-0000-000000000030', 'tag00001-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 12: MEDIA ASSETS
-- ============================================================================

INSERT INTO "media_assets" (id, "contentItemId", "originalUrl", "thumbnailUrl", format, size, duration) VALUES
  ('m000001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'https://storage.azeeboplus.com/videos/bbnaija-s10-ep45.mp4', 'https://picsum.photos/seed/bbnaija10/800/450', 'video/mp4', 524288000, 3600),
  ('m000001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000002', 'https://storage.azeeboplus.com/videos/rholagos-s2-ep3.mp4', 'https://picsum.photos/seed/rholagos/800/450', 'video/mp4', 393216000, 2700),
  ('m000001-0000-0000-0000-000000000018', 'cnt00001-0000-0000-0000-000000000018', 'https://storage.azeeboplus.com/videos/lagos-king.mp4', 'https://picsum.photos/seed/lagosking/800/450', 'video/mp4', 1073741824, 7200),
  ('m000001-0000-0000-0000-000000000029', 'cnt00001-0000-0000-0000-000000000029', 'https://storage.azeeboplus.com/videos/burna-lagos-live.mp4', 'https://picsum.photos/seed/burnalagos/800/450', 'video/mp4', 2147483647, 9000),
  ('m000001-0000-0000-0000-000000000030', 'cnt00001-0000-0000-0000-000000000030', 'https://storage.azeeboplus.com/videos/tems-acoustic.mp4', 'https://picsum.photos/seed/temsacoustic/800/450', 'video/mp4', 524288000, 3600)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 13: CONTENT RELATIONSHIPS
-- ============================================================================

INSERT INTO "content_relationships" (id, "contentId", "relatedContentId", type) VALUES
  ('rel00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000002', 'related'),
  ('rel00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000004', 'related'),
  ('rel00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000018', 'cnt00001-0000-0000-0000-000000000019', 'related'),
  ('rel00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000019', 'cnt00001-0000-0000-0000-000000000022', 'related'),
  ('rel00001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000029', 'cnt00001-0000-0000-0000-000000000030', 'related')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 14: WALLETS & TRANSACTIONS
-- ============================================================================

INSERT INTO "wallets" (id, "userId", balance, "bonusBalance", "promoBalance", currency, "createdAt", "updatedAt") VALUES
  ('w000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 15000.00, 2500.00, 500.00, 'NGN', '2025-06-01T10:00:00Z', '2025-06-15T12:00:00Z'),
  ('w000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 8500.00, 1000.00, 0.00, 'NGN', '2025-05-20T14:00:00Z', '2025-06-14T18:00:00Z'),
  ('w000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 23000.00, 5000.00, 2000.00, 'NGN', '2025-06-05T08:00:00Z', '2025-06-20T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

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
  ('tx00001-0000-0000-0000-000000000010', 'w000001-0000-0000-0000-000000000001', 'refund', 2500.00, 'completed', 'Refund: Payment issue', 'paystack', 'PSK-REF-001', '2025-06-13T12:00:00Z', '2025-06-13T12:00:00Z')
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

INSERT INTO "comments" (id, "contentId", "userId", text, "createdAt") VALUES
  ('cm00001-0000-0000-0000-000000000001', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'This season is WILD! The nomination game was insane 🔥', '2025-06-15T22:00:00Z'),
  ('cm00001-0000-0000-0000-000000000002', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'Chomzy for the win! She deserves to stay 💪', '2025-06-15T22:15:00Z'),
  ('cm00001-0000-0000-0000-000000000003', 'cnt00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'Why is the production quality so good this season? Azeebo+ really stepped up.', '2025-06-15T22:30:00Z'),
  ('cm00001-0000-0000-0000-000000000004', 'cnt00001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000006', 'Best Nollywood film I''ve seen this year. The plot twists! 🎬', '2025-05-22T14:00:00Z'),
  ('cm00001-0000-0000-0000-000000000005', 'cnt00001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000008', 'The action scenes are so well choreographed. Nollywood is evolving!', '2025-05-23T09:00:00Z'),
  ('cm00001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000006', 'I was THERE! This recording doesn''t do the live experience justice. Amazing!', '2025-05-12T10:00:00Z'),
  ('cm00001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000007', 'Burna never disappoints. The setlist was perfect. 🎵🇬🇭🇳🇬', '2025-05-12T11:30:00Z'),
  ('cm00001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000030', 'a0000001-0000-0000-0000-000000000006', 'Tems in acoustic mode is a whole different experience. Angelic voice! 🎤', '2025-06-08T08:00:00Z'),
  ('cm00001-0000-0000-0000-000000000009', 'cnt00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'The road trip content I never knew I needed. More of this please!', '2025-06-14T18:00:00Z'),
  ('cm00001-0000-0000-0000-000000000010', 'cnt00001-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000007', 'Emmanuelle never fails to crack me up 😂😂', '2025-06-12T16:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 20: WATCH HISTORY
-- ============================================================================

INSERT INTO "watch_history" (id, "userId", "contentId", progress, "watchedAt") VALUES
  ('wh00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000001', 85, '2025-06-15T22:00:00Z'),
  ('wh00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000018', 100, '2025-06-11T10:00:00Z'),
  ('wh00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000029', 67, '2025-05-15T20:00:00Z'),
  ('wh00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000008', 100, '2025-06-11T16:00:00Z'),
  ('wh00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000023', 45, '2025-06-01T20:00:00Z'),
  ('wh00001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000007', 'cnt00001-0000-0000-0000-000000000027', 100, '2025-06-15T18:00:00Z'),
  ('wh00001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000003', 100, '2025-06-02T12:00:00Z'),
  ('wh00001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000030', 92, '2025-06-08T10:00:00Z'),
  ('wh00001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000008', 'cnt00001-0000-0000-0000-000000000019', 78, '2025-06-03T14:00:00Z'),
  ('wh00001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000006', 'cnt00001-0000-0000-0000-000000000005', 100, '2025-06-09T14:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 21: SUBSCRIPTIONS
-- ============================================================================

INSERT INTO "subscriptions" (id, "userId", "planType", status, "startDate", "endDate", "nextBillingDate", "paymentMethod") VALUES
  ('sub0001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'standard', 'active', '2025-06-01T00:00:00Z', '2025-07-01T00:00:00Z', '2025-07-01T00:00:00Z', 'wallet'),
  ('sub0001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'premium', 'active', '2025-05-15T00:00:00Z', '2025-06-15T00:00:00Z', '2025-06-15T00:00:00Z', 'card'),
  ('sub0001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'basic', 'expired', '2025-04-01T00:00:00Z', '2025-05-01T00:00:00Z', NULL, 'wallet')
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
  ('ff00001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000006', 'live_chat_enabled', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 23: AUDIT LOGS (sample)
-- ============================================================================

INSERT INTO "audit_logs" (id, "actorId", "actorType", action, "resourceType", "resourceId", status, metadata, "createdAt") VALUES
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

COMMIT;
