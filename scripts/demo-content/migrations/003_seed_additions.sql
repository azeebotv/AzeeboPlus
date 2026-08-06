-- =============================================================================
-- Azeebo+ Seed Data Additions — Missing Tables
-- Generated to fill gaps in 002_seed_demo_data.sql
-- Uses existing user/creator IDs from the main seed file
-- =============================================================================

-- ============================================================================
-- LIFESTYLE UNIVERSE: Celebrity Entries
-- ============================================================================

INSERT INTO "celebrity_entry" (id, name, slug, bio, coverImage, profession, nationality, "isFeatured", "viewCount", status, "createdById", "publishedAt", "createdAt", "updatedAt") VALUES
  ('cel00001-0000-0000-0000-000000000001', 'Davido', 'davido', 'Nigerian singer, songwriter, and record producer. One of the most influential African artists.', '/images/celebrities/davido.jpg', 'Musician', 'Nigerian', true, 125000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000002', 'Burna Boy', 'burna-boy', 'Grammy-winning Afro-fusion artist from Port Harcourt, Nigeria.', '/images/celebrities/burna-boy.jpg', 'Musician', 'Nigerian', true, 198000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000003', 'Tiwa Savage', 'tiwa-savage', 'Nigerian singer, songwriter, and actress. Queen of Afrobeats.', '/images/celebrities/tiwa-savage.jpg', 'Musician', 'Nigerian', true, 167000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000004', 'Funke Akindele', 'funke-akindele', 'Nigerian actress, producer, and director. Known for Jenifa and box office hits.', '/images/celebrities/funke-akindele.jpg', 'Actress', 'Nigerian', true, 145000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000005', 'Wizkid', 'wizkid', 'Ayodeji Ibrahim Balogun, known professionally as Wizkid. Afrobeats superstar.', '/images/celebrities/wizkid.jpg', 'Musician', 'Nigerian', true, 234000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000006', 'Don Jazzy', 'don-jazzy', 'Nigerian record producer, songwriter, and entrepreneur. Mavin Records founder.', '/images/celebrities/don-jazzy.jpg', 'Producer', 'Nigerian', false, 89000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000007', 'Rmd', 'rmd-actor', 'Richard Mofe-Damijo. Veteran Nollywood actor and former Delta State Commissioner.', '/images/celebrities/rmd.jpg', 'Actor', 'Nigerian', false, 76000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-03-15T00:00:00Z', NOW(), NOW()),
  ('cel00001-0000-0000-0000-000000000008', 'Genevieve Nnaji', 'genevieve-nnaji', 'Nigerian actress, director, and producer. One of Africa biggest movie stars.', '/images/celebrities/genevieve.jpg', 'Actress', 'Nigerian', true, 112000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIFESTYLE UNIVERSE: City Guide Entries
-- ============================================================================

INSERT INTO "city_guide_entry" (id, name, slug, type, description, coverImage, address, city, country, latitude, longitude, rating, "priceLevel", hours, amenities, status, "viewCount", "createdById", "publishedAt", "createdAt", "updatedAt") VALUES
  ('cg000001-0000-0000-0000-000000000001', 'Terra Kulture', 'terra-kulture', 'venue', 'Lagos premier art, culture, and entertainment center. Live shows, art gallery, restaurant.', '/images/city-guide/terra-kulture.jpg', '14 Tiamiyu Savage Street, Victoria Island', 'Lagos', 'Nigeria', 6.4281, 3.4219, 4.5, 3, 'Mon-Sat 9AM-10PM, Sun 12PM-8PM', ARRAY['wifi','parking','restaurant','gallery'], 'published', 34000, 'a0000001-0000-0000-0000-000000000001', '2025-01-20T00:00:00Z', NOW(), NOW()),
  ('cg000001-0000-0000-0000-000000000002', 'Nike Art Gallery', 'nike-art-gallery', 'gallery', 'One of the largest art galleries in West Africa with over 7,000 artworks.', '/images/city-guide/nike-art.jpg', '2 Eti Osa South Union, Lekki Phase 1', 'Lagos', 'Nigeria', 6.4281, 3.4219, 4.7, 2, 'Mon-Sat 10AM-6PM', ARRAY['wifi','parking','air conditioning'], 'published', 28000, 'a0000001-0000-0000-0000-000000000001', '2025-01-20T00:00:00Z', NOW(), NOW()),
  ('cg000001-0000-0000-0000-000000000003', 'Eko Hotels & Suites', 'eko-hotels', 'hotel', 'Lagos most prestigious hotel and event center. Host to major concerts and galas.', '/images/city-guide/eko-hotels.jpg', 'Adetokunbo Ademola Street, Victoria Island', 'Lagos', 'Nigeria', 6.4281, 3.4219, 4.6, 4, '24/7', ARRAY['wifi','pool','spa','gym','restaurant','parking'], 'published', 45000, 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z', NOW(), NOW()),
  ('cg000001-0000-0000-0000-000000000004', 'Buka Hut', 'buka-hut', 'restaurant', 'Authentic Nigerian buka experience. Best of local cuisine in a vibrant setting.', '/images/city-guide/buka-hut.jpg', '15 Bode Thomas Street, Surulere', 'Lagos', 'Nigeria', 6.4281, 3.4219, 4.3, 1, 'Mon-Sun 8AM-11PM', ARRAY['wifi','outdoor seating','delivery'], 'published', 19000, 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z', NOW(), NOW()),
  ('cg000001-0000-0000-0000-000000000005', 'Freedom Park', 'freedom-park', 'park', 'Historical park and memorial on the site of the old Broad Street Prison. Cultural events hub.', '/images/city-guide/freedom-park.jpg', '1 Broad Street, Lagos Island', 'Lagos', 'Nigeria', 6.4281, 3.4219, 4.4, 1, 'Mon-Sun 8AM-9PM', ARRAY['wifi','parking','art installations','events space'], 'published', 22000, 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIFESTYLE UNIVERSE: Music Entries
-- ============================================================================

INSERT INTO "music_entry" (id, title, slug, type, description, coverImage, "artistName", "albumName", duration, genre, "trackUrl", "isPremium", "playCount", status, "createdById", "publishedAt", "createdAt", "updatedAt") VALUES
  ('mus00001-0000-0000-0000-000000000001', 'Essence', 'essence', 'single', 'Chart-topping Afrobeats hit featuring Tems.', '/images/music/essence.jpg', 'Wizkid', 'Made in Lagos', 234, 'Afrobeats', 'https://cdn.azeeboplus.com/music/essence.mp3', false, 567000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000002', 'Last Last', 'last-last', 'single', 'Burna Boy global smash hit sampling Toni Braxton.', '/images/music/last-last.jpg', 'Burna Boy', 'Love Damini', 198, 'Afrobeats', 'https://cdn.azeeboplus.com/music/last-last.mp3', false, 890000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-01-20T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000003', 'Bandana', 'bandana', 'single', 'Asake and Fireboy DML collaborate on this street anthem.', '/images/music/bandana.jpg', 'Asake', 'Mr. Money With The Vibe', 210, 'Afrobeats', 'https://cdn.azeeboplus.com/music/bandana.mp3', false, 445000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000004', 'Calm Down', 'calm-down', 'single', 'Rema global hit that topped charts worldwide.', '/images/music/calm-down.jpg', 'Rema', 'Rave & Roses', 224, 'Afrobeats', 'https://cdn.azeeboplus.com/music/calm-down.mp3', false, 1200000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-01-15T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000005', 'Love Nwantiti', 'love-nwantiti', 'single', 'CKay viral love song that became a global phenomenon.', '/images/music/love-nwantiti.jpg', 'CKay', 'Boyfriend', 186, 'Afrobeats', 'https://cdn.azeeboplus.com/music/love-nwantiti.mp3', false, 2300000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000006', 'Joha', 'joha', 'single', 'Asake catchy track from the sophomore album.', '/images/music/joha.jpg', 'Asake', 'Work of Art', 195, 'Afrobeats', 'https://cdn.azeeboplus.com/music/joha.mp3', false, 678000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000007', 'Premiere Concert Live', 'premiere-concert-live', 'concert', 'Live recording from the Azeebo+ Premiere Concert 2025.', '/images/music/concert-live.jpg', 'Various Artists', NULL, 7200, 'Live', 'https://cdn.azeeboplus.com/music/concert-live.mp3', true, 34000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-04-01T00:00:00Z', NOW(), NOW()),
  ('mus00001-0000-0000-0000-000000000008', 'Acoustic Sessions Vol. 1', 'acoustic-sessions-vol1', 'album', 'Unplugged versions of Afrobeats favorites.', '/images/music/acoustic-vol1.jpg', 'Various Artists', 'Acoustic Sessions', 3600, 'Acoustic', 'https://cdn.azeeboplus.com/music/acoustic-vol1.mp3', true, 12000, 'published', 'a0000001-0000-0000-0000-000000000001', '2025-05-01T00:00:00Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIFESTYLE UNIVERSE: Nightlife Entries
-- ============================================================================

INSERT INTO "nightlife_entry" (id, name, slug, type, description, coverImage, address, city, country, latitude, longitude, hours, "dressCode", "coverCharge", rating, status, "viewCount", "createdById", "publishedAt", "createdAt", "updatedAt") VALUES
  ('nig00001-0000-0000-0000-000000000001', 'Quilox', 'quilox', 'club', 'Lagos most exclusive nightclub. VIP sections, international DJs, premium experience.', '/images/nightlife/quilox.jpg', '1 Ozumba Mbadiwe Avenue, Victoria Island', 'Lagos', 'Nigeria', 6.4281, 3.4219, 'Thu-Sun 10PM-5AM', 'Smart Casual', 15000, 4.5, 'published', 67000, 'a0000001-0000-0000-0000-000000000001', '2025-01-20T00:00:00Z', NOW(), NOW()),
  ('nig00001-0000-0000-0000-000000000002', 'Club DNA', 'club-dna', 'club', 'The heart of Lagos nightlife. Live performances and DJ sets.', '/images/nightlife/club-dna.jpg', '5 Adeola Odeku Street, Victoria Island', 'Lagos', 'Nigeria', 6.4281, 3.4219, 'Thu-Sun 10PM-4AM', 'Casual', 5000, 4.2, 'published', 45000, 'a0000001-0000-0000-0000-000000000001', '2025-02-01T00:00:00Z', NOW(), NOW()),
  ('nig00001-0000-0000-0000-000000000003', 'The Place Lounge', 'the-place-lounge', 'lounge', 'Chill lounge with rooftop views, craft cocktails, and live jazz nights.', '/images/nightlife/the-place.jpg', '12 Akin Adesola Street, Victoria Island', 'Lagos', 'Nigeria', 6.4281, 3.4219, 'Wed-Sun 5PM-2AM', 'Smart Casual', 3000, 4.3, 'published', 23000, 'a0000001-0000-0000-0000-000000000001', '2025-02-15T00:00:00Z', NOW(), NOW()),
  ('nig00001-0000-0000-0000-000000000004', 'Bature Brewery', 'bature-brewery', 'bar', 'Craft beer brewery with live music, trivia nights, and outdoor seating.', '/images/nightlife/bature.jpg', '27 Awolowo Road, Ikoyi', 'Lagos', 'Nigeria', 6.4281, 3.4219, 'Tue-Sun 4PM-12AM', 'Casual', 0, 4.1, 'published', 18000, 'a0000001-0000-0000-0000-000000000001', '2025-03-01T00:00:00Z', NOW(), NOW()),
  ('nig00001-0000-0000-0000-000000000005', 'Cubo', 'cubo-lagos', 'club', 'Multi-level club with different music genres on each floor.', '/images/nightlife/cubo.jpg', '13B Admiralty Way, Lekki Phase 1', 'Lagos', 'Nigeria', 6.4281, 3.4219, 'Fri-Sun 10PM-5AM', 'Smart Casual', 10000, 4.4, 'published', 31000, 'a0000001-0000-0000-0000-000000000001', '2025-03-15T00:00:00Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIFESTYLE UNIVERSE: Influencer Entries
-- ============================================================================

INSERT INTO "influencer_entry" (id, "userId", slug, "displayName", bio, "avatarUrl", "coverImage", category, "followerCount", "followingCount", "postCount", "isVerified", "socialLinks", "collaborationCount", status, "createdAt", "updatedAt") VALUES
  ('inf00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'tunde-creates', 'Tunde Creates', 'Content creator specializing in lifestyle and travel vlogs from Lagos.', '/images/avatars/tunde.jpg', '/images/banners/tunde.jpg', 'Lifestyle', 520000, 890, 234, true, '{"instagram":"@tundecreates","twitter":"@tundecreates","youtube":"@tundecreates"}', 45, 'published', NOW(), NOW()),
  ('inf00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'ngozi-vibes', 'Ngozi Vibes', 'Fashion and beauty influencer. Showing the best of Lagos style.', '/images/avatars/ngozi.jpg', '/images/banners/ngozi.jpg', 'Fashion', 380000, 456, 189, true, '{"instagram":"@ngozivibes","tiktok":"@ngozivibes"}', 32, 'published', NOW(), NOW()),
  ('inf00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000011', 'chinedu-sports', 'Chinedu Sports', 'Sports commentator and football analyst. Breaking down Naija football.', '/images/avatars/chinedu.jpg', '/images/banners/chinedu.jpg', 'Sports', 290000, 234, 156, false, '{"twitter":"@chinedusports","youtube":"@chinedusports"}', 18, 'published', NOW(), NOW()),
  ('inf00001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000012', 'tunde-gaming', 'Tunde Gaming', 'Nigeria top gaming content creator. Reviews, streams, and esports.', '/images/avatars/tunde-gamer.jpg', '/images/banners/tunde-gamer.jpg', 'Gaming', 180000, 123, 98, false, '{"twitch":"@tundegaming","youtube":"@tundegaming"}', 12, 'published', NOW(), NOW()),
  ('inf00001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000006', 'kemi-watches', 'Kemi Watch', 'Movie critic and entertainment commentator. Honest reviews of Nollywood.', '/images/avatars/kemi.jpg', '/images/banners/kemi.jpg', 'Entertainment', 145000, 345, 67, false, '{"twitter":"@kemiwatch","instagram":"@kemiwatches"}', 8, 'published', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIFESTYLE UNIVERSE: Polls
-- ============================================================================

INSERT INTO "polls" (id, title, slug, description, "coverImage", status, "totalVotes", "createdById", "expiresAt", "createdAt", "updatedAt") VALUES
  ('pol00001-0000-0000-0000-000000000001', 'Best Afrobeats Album of 2025', 'best-afrobeats-album-2025', 'Which album dominated the year?', '/images/polls/afrobeats.jpg', 'active', 2450, 'a0000001-0000-0000-0000-000000000001', '2025-12-31T23:59:59Z', NOW(), NOW()),
  ('pol00001-0000-0000-0000-000000000002', 'Favorite Lagos Food Spot', 'favorite-lagos-food', 'Where do you eat when you are in Lagos?', '/images/polls/food.jpg', 'active', 1890, 'a0000001-0000-0000-0000-000000000001', '2025-12-31T23:59:59Z', NOW(), NOW()),
  ('pol00001-0000-0000-0000-000000000003', 'Best Nollywood Actor 2025', 'best-nollywood-actor-2025', 'Vote for the best Nollywood actor this year.', '/images/polls/nollywood.jpg', 'active', 3200, 'a0000001-0000-0000-0000-000000000001', '2025-12-31T23:59:59Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "poll_options" (id, "pollId", text, "voteCount", "createdAt") VALUES
  ('pol00001-0000-0000-0000-000000000010', 'pol00001-0000-0000-0000-000000000001', 'Burna Boy - Love Damini', 890, NOW()),
  ('pol00001-0000-0000-0000-000000000011', 'pol00001-0000-0000-0000-000000000001', 'Wizkid - More Love Less Ego', 756, NOW()),
  ('pol00001-0000-0000-0000-000000000012', 'pol00001-0000-0000-0000-000000000001', 'Asake - Work of Art', 534, NOW()),
  ('pol00001-0000-0000-0000-000000000013', 'pol00001-0000-0000-0000-000000000001', 'Rema - Rave & Roses Ultra', 270, NOW()),
  ('pol00001-0000-0000-0000-000000000020', 'pol00001-0000-0000-0000-000000000002', 'Buka Hut', 678, NOW()),
  ('pol00001-0000-0000-0000-000000000021', 'pol00001-0000-0000-0000-000000000002', 'The Place Lounge', 456, NOW()),
  ('pol00001-0000-0000-0000-000000000022', 'pol00001-0000-0000-0000-000000000002', 'Terra Kulture', 389, NOW()),
  ('pol00001-0000-0000-0000-000000000023', 'pol00001-0000-0000-0000-000000000002', 'Nike Art Gallery Cafe', 367, NOW()),
  ('pol00001-0000-0000-0000-000000000030', 'pol00001-0000-0000-0000-000000000003', 'Richard Mofe-Damijo', 1100, NOW()),
  ('pol00001-0000-0000-0000-000000000031', 'pol00001-0000-0000-0000-000000000003', 'Funke Akindele', 980, NOW()),
  ('pol00001-0000-0000-0000-000000000032', 'pol00001-0000-0000-0000-000000000003', 'Genevieve Nnaji', 720, NOW()),
  ('pol00001-0000-0000-0000-000000000033', 'pol00001-0000-0000-0000-000000000003', 'Yul Edochie', 400, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIFESTYLE UNIVERSE: Quizzes
-- ============================================================================

INSERT INTO "quizzes" (id, title, slug, description, "coverImage", category, difficulty, "timeLimit", status, "playCount", "createdById", "createdAt", "updatedAt") VALUES
  ('QUIZ0001-0000-0000-0000-000000000001', 'Nollywood Trivia', 'nollywood-trivia', 'Test your knowledge of Nigerian cinema!', '/images/quizzes/nollywood.jpg', 'entertainment', 'easy', 60, 'published', 4500, 'a0000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('QUIZ0001-0000-0000-0000-000000000002', 'Afrobeats Quiz', 'afrobeats-quiz', 'How well do you know Afrobeats?', '/images/quizzes/afrobeats.jpg', 'music', 'medium', 45, 'published', 6700, 'a0000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('QUIZ0001-0000-0000-0000-000000000003', 'Lagos Culture Quiz', 'lagos-culture-quiz', 'How much do you know about Lagos culture?', '/images/quizzes/lagos.jpg', 'lifestyle', 'easy', 60, 'published', 3200, 'a0000001-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "quiz_questions" (id, "quizId", question, options, "correctAnswer", explanation, points, "order") VALUES
  ('QQ000001-0000-0000-0000-000000000001', 'QUIZ0001-0000-0000-0000-000000000001', 'Who directed the movie Lionheart?', ARRAY['Genevieve Nnaji', 'Kunle Afolayan', 'Mo Abudu', 'Kemi Adetiba'], 0, 'Genevieve Nnaji made her directorial debut with Lionheart in 2018.', 10, 1),
  ('QQ000001-0000-0000-0000-000000000002', 'QUIZ0001-0000-0000-0000-000000000001', 'What year was Nollywood established?', ARRAY['1990', '1992', '1995', '1998'], 1, 'Nollywood is generally considered to have started in 1992 with the release of Living in Bondage.', 10, 2),
  ('QQ000001-0000-0000-0000-000000000003', 'QUIZ0001-0000-0000-0000-000000000001', 'Which Nollywood film grossed over 1 billion Naira?', ARRAY['The Wedding Party', 'Omo Ghetto', 'Lion Heart', 'Citation'], 1, 'Omo Ghetto: The Saga became the highest-grossing Nollywood film.', 10, 3),
  ('QQ000001-0000-0000-0000-000000000010', 'QUIZ0001-0000-0000-0000-000000000002', 'Which artist released the song Essence?', ARRAY['Burna Boy', 'Wizkid', 'Davido', 'Rema'], 1, 'Essence by Wizkid featuring Tems was a global hit.', 10, 1),
  ('QQ000001-0000-0000-0000-000000000011', 'QUIZ0001-0000-0000-0000-000000000002', 'What does Afrobeats mean?', ARRAY['African + Beats', 'Afro + Beatz', 'Africa + Beat', 'Afrobeat'], 0, 'Afrobeats is a portmanteau of African and Beats, describing the contemporary West African pop genre.', 10, 2),
  ('QQ000001-0000-0000-0000-000000000012', 'QUIZ0001-0000-0000-0000-000000000002', 'Who is known as the King of Afrobeats?', ARRAY['Wizkid', 'Burna Boy', 'Davido', 'Fela Kuti'], 3, 'Fela Kuti is widely regarded as the pioneer and King of Afrobeats.', 10, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMEDY UNIVERSE: Comedy Series
-- ============================================================================

INSERT INTO "comedy_series" (id, title, description, thumbnail, banner, "creatorId", status, "createdAt", "updatedAt") VALUES
  ('cvs00001-0000-0000-0000-000000000001', 'Naija Skit Masters', 'Weekly comedy skits featuring the funniest situations in Nigerian daily life.', '/images/comedy/series/naija-skit.jpg', '/images/comedy/series/naija-skit-banner.jpg', 'a0000001-0000-0000-0000-000000000003', 'active', NOW(), NOW()),
  ('cvs00001-0000-0000-0000-000000000002', 'Lagos Laughs', 'Comedy series set in Lagos, exploring the humor in urban Nigerian life.', '/images/comedy/series/lagos-laughs.jpg', '/images/comedy/series/lagos-laughs-banner.jpg', 'a0000001-0000-0000-0000-000000000004', 'active', NOW(), NOW()),
  ('cvs00001-0000-0000-0000-000000000003', 'Office Gist', 'Workplace comedy following the daily drama in a Lagos tech startup.', '/images/comedy/series/office-gist.jpg', '/images/comedy/series/office-gist-banner.jpg', 'a0000001-0000-0000-0000-000000000005', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "comedy_episodes" (id, "seriesId", title, description, thumbnail, "mediaUrl", duration, "viewCount", "order", "createdAt", "updatedAt") VALUES
  ('cve00001-0000-0000-0000-000000000001', 'cvs00001-0000-0000-0000-000000000001', 'NEPA vs Generator', 'When the light goes out and the generator refuses to start.', '/images/comedy/episodes/nepa-gen.jpg', 'https://cdn.azeeboplus.com/comedy/nepa-gen.mp4', 420, 34000, 1, NOW(), NOW()),
  ('cve00001-0000-0000-0000-000000000002', 'cvs00001-0000-0000-0000-000000000001', 'Market Price Drama', 'The hilarious negotiation tactics at Balogun Market.', '/images/comedy/episodes/market.jpg', 'https://cdn.azeeboplus.com/comedy/market-price.mp4', 380, 28000, 2, NOW(), NOW()),
  ('cve00001-0000-0000-0000-000000000003', 'cvs00001-0000-0000-0000-000000000002', 'Danfo Driver', 'The adventures of a Lagos danfo driver and his passengers.', '/images/comedy/episodes/danfo.jpg', 'https://cdn.azeeboplus.com/comedy/danfo.mp4', 360, 45000, 1, NOW(), NOW()),
  ('cve00001-0000-0000-0000-000000000004', 'cvs00001-0000-0000-0000-000000000003', 'First Day at Work', 'New employee tries to navigate the office politics.', '/images/comedy/episodes/first-day.jpg', 'https://cdn.azeeboplus.com/comedy/first-day.mp4', 450, 23000, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "comedy_specials" (id, title, description, thumbnail, "mediaUrl", duration, "comedianId", genre, "isPremium", price, currency, "viewCount", "likeCount", "releaseDate", "createdAt", "updatedAt") VALUES
  ('csp00001-0000-0000-0000-000000000001', 'Live at Eko Hotel', 'Stand-up comedy special filmed live at Eko Hotel Convention Center.', '/images/comedy/specials/live-eko.jpg', 'https://cdn.azeeboplus.com/comedy/live-eko.mp4', 5400, (SELECT id FROM "comedian_profiles" LIMIT 1), 'stand-up', true, 2500, 'NGN', 67000, 8900, '2025-03-15T00:00:00Z', NOW(), NOW()),
  ('csp00001-0000-0000-0000-000000000002', 'Lagos Nights', 'An evening of comedy exploring the nightlife and social scenes of Lagos.', '/images/comedy/specials/lagos-nights.jpg', 'https://cdn.azeeboplus.com/comedy/lagos-nights.mp4', 4800, (SELECT id FROM "comedian_profiles" LIMIT 1), 'stand-up', false, 0, 'NGN', 45000, 6700, '2025-05-20T00:00:00Z', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MOVIE UNIVERSE: Movies
-- ============================================================================

INSERT INTO "movies" (id, title, description, thumbnail, banner, "mediaUrl", "universeId", "creatorId", status, "viewCount", metadata, "createdAt", "updatedAt") VALUES
  ('mov00001-0000-0000-0000-000000000001', 'Lagos Love Story', 'A romantic drama set in the bustling streets of Lagos, following two young professionals.', '/images/movies/lagos-love.jpg', '/images/movies/lagos-love-banner.jpg', 'https://cdn.azeeboplus.com/movies/lagos-love.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 123000, '{"duration":7200,"genre":"romance","language":"en","year":2025,"rating":"12+"}', NOW(), NOW()),
  ('mov00001-0000-0000-0000-000000000002', 'The Setup', 'An action thriller about a man caught in a web of deception in Abuja.', '/images/movies/the-setup.jpg', '/images/movies/the-setup-banner.jpg', 'https://cdn.azeeboplus.com/movies/the-setup.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'published', 89000, '{"duration":6600,"genre":"thriller","language":"en","year":2025,"rating":"15+"}', NOW(), NOW()),
  ('mov00001-0000-0000-0000-000000000003', 'Oxygen', 'A sci-fi drama exploring AI consciousness in near-future Lagos.', '/images/movies/oxygen.jpg', '/images/movies/oxygen-banner.jpg', 'https://cdn.azeeboplus.com/movies/oxygen.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 67000, '{"duration":7800,"genre":"sci-fi","language":"en","year":2025,"rating":"12+"}', NOW(), NOW()),
  ('mov00001-0000-0000-0000-000000000004', 'October 1', 'A historical drama set during Nigerian independence in 1960.', '/images/movies/october-1.jpg', '/images/movies/october-1-banner.jpg', 'https://cdn.azeeboplus.com/movies/october-1.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'published', 156000, '{"duration":9000,"genre":"historical","language":"en","year":2025,"rating":"PG"}', NOW(), NOW()),
  ('mov00001-0000-0000-0000-000000000005', 'Living in Bondage', 'The classic remastered - a story of wealth, power, and the occult.', '/images/movies/living-bondage.jpg', '/images/movies/living-bondage-banner.jpg', 'https://cdn.azeeboplus.com/movies/living-bondage.mp4', 'u0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'published', 234000, '{"duration":8400,"genre":"drama","language":"en","year":2025,"rating":"18+"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "premieres" (id, "movieId", "startsAt", "endsAt", status, "createdAt", "updatedAt") VALUES
  ('pre00001-0000-0000-0000-000000000001', 'mov00001-0000-0000-0000-000000000001', '2025-08-15T19:00:00Z', '2025-08-15T22:00:00Z', 'scheduled', NOW(), NOW()),
  ('pre00001-0000-0000-0000-000000000002', 'mov00001-0000-0000-0000-000000000003', '2025-09-20T20:00:00Z', '2025-09-20T23:00:00Z', 'scheduled', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERTICAL UNIVERSE: Storyworlds (via UniverseMap)
-- ============================================================================

INSERT INTO "universe_maps" (id, name, slug, description, "coverImage", status, "createdAt", "updatedAt") VALUES
  ('um000001-0000-0000-0000-000000000001', 'Agbala Olodumare', 'agbala-olodumare', 'A premium African storytelling universe with interconnected characters and rich mythology.', '/images/vertical/agbala-banner.jpg', 'published', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "titles" (id, name, slug, type, description, "coverImage", "releaseYear", status, rating, "universeId", "viewCount", "createdAt", "updatedAt") VALUES
  ('tit00001-0000-0000-0000-000000000001', 'The Awakening', 'the-awakening', 'series', 'The first season of the Agbala saga. A young woman discovers her destiny.', '/images/vertical/awakening.jpg', 2025, 'ongoing', 4.8, 'um000001-0000-0000-0000-000000000001', 89000, NOW(), NOW()),
  ('tit00001-0000-0000-0000-000000000002', 'Legacy of the Crown', 'legacy-of-the-crown', 'series', 'A political drama set in a fictional African kingdom.', '/images/vertical/legacy-crown.jpg', 2025, 'ongoing', 4.6, 'um000001-0000-0000-0000-000000000001', 56000, NOW(), NOW()),
  ('tit00001-0000-0000-0000-000000000003', 'Rivers of Time', 'rivers-of-time', 'film', 'A time-travel adventure across pre-colonial West Africa.', '/images/vertical/rivers-time.jpg', 2025, 'completed', 4.5, 'um000001-0000-0000-0000-000000000001', 34000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "characters" (id, name, slug, description, "avatarUrl", role, status, "universeId", "createdAt", "updatedAt") VALUES
  ('chr00001-0000-0000-0000-000000000001', 'Adaeze', 'adaeze', 'A young woman from Lagos who discovers she has ancient powers tied to the Agbala mythology.', '/images/vertical/adaeze.jpg', 'protagonist', 'active', 'um000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('chr00001-0000-0000-0000-000000000002', 'Emeka', 'emeka', 'A traditional ruler caught between modern politics and ancient customs.', '/images/vertical/emeka.jpg', 'supporting', 'active', 'um000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('chr00001-0000-0000-0000-000000000003', 'Nneka', 'nneka', 'A mysterious figure from the spirit world who guides Adaeze on her journey.', '/images/vertical/nneka.jpg', 'mentor', 'active', 'um000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('chr00001-0000-0000-0000-000000000004', 'Obinna', 'obinna', 'Adaeze childhood friend who becomes her ally and love interest.', '/images/vertical/obinna.jpg', 'supporting', 'active', 'um000001-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "lore_entries" (id, title, slug, category, content, excerpt, "coverImage", importance, "universeId", "viewCount", status, "createdAt", "updatedAt") VALUES
  ('lor00001-0000-0000-0000-000000000001', 'The Agbala Prophecy', 'agbala-prophecy', 'mythology', 'In the beginning, the Agbala Olodumare spoke through the ancient ones. The prophecy foretold of a chosen one who would unite the seven realms and restore balance to the world. This prophecy has been passed down through generations, with each generation adding their own interpretations.', 'The ancient prophecy that drives the entire Agbala storyline.', '/images/vertical/lore/prophecy.jpg', 'critical', 'um000001-0000-0000-0000-000000000001', 45000, 'published', NOW(), NOW()),
  ('lor00001-0000-0000-0000-000000000002', 'The Seven Realms', 'seven-realms', 'geography', 'The world of Agbala is divided into seven mystical realms: the Realm of Light, the Shadow Realm, the Water Realm, the Earth Realm, the Sky Realm, the Spirit Realm, and the Human Realm. Each realm has its own guardians and rules.', 'The seven mystical realms that make up the Agbala universe.', '/images/vertical/lore/realms.jpg', 'high', 'um000001-0000-0000-0000-000000000001', 38000, 'published', NOW(), NOW()),
  ('lor00001-0000-0000-0000-000000000003', 'The Crown of Unity', 'crown-of-unity', 'artifacts', 'An ancient artifact said to have the power to unite all seven realms. It was lost centuries ago during the Great War, and its location remains one of the biggest mysteries in Agbala history.', 'The legendary artifact at the center of the quest.', '/images/vertical/lore/crown.jpg', 'high', 'um000001-0000-0000-0000-000000000001', 29000, 'published', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "crossovers" (id, title, slug, description, "coverImage", "startDate", "endDate", status, "createdAt", "updatedAt") VALUES
  ('cox00001-0000-0000-0000-000000000001', 'The Convergence', 'the-convergence', 'When characters from different titles meet for the first time.', '/images/vertical/crossovers/convergence.jpg', '2025-06-01T00:00:00Z', '2025-08-31T23:59:59Z', 'completed', NOW(), NOW()),
  ('cox00001-0000-0000-0000-000000000002', 'Worlds Collide', 'worlds-collide', 'The epic crossover event that changes everything.', '/images/vertical/crossovers/worlds-collide.jpg', '2025-09-01T00:00:00Z', NULL, 'announced', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "theories" (id, title, slug, content, "authorId", "authorName", "spoilerLevel", "accessLevel", status, "viewCount", "likeCount", "createdAt", "updatedAt") VALUES
  ('THR00001-0000-0000-0000-000000000001', 'Adaeze is the Chosen One', 'adaeze-chosen-one', 'Evidence suggests Adaeze is the one foretold in the Agbala Prophecy. Her connection to the Spirit Realm and her ability to see beyond the veil are telltale signs.', 'a0000001-0000-0000-0000-000000000006', 'Kemi Watch', 'none', 'published', 'published', 12000, 890, NOW(), NOW()),
  ('THR00001-0000-0000-0000-000000000002', 'The Shadow Realm Connection', 'shadow-realm-connection', 'What if the Shadow Realm is not evil, but misunderstood? The evidence points to a deeper history between the realms.', 'a0000001-0000-0000-0000-000000000007', 'Olumide F', 'mild', 'published', 'published', 8500, 670, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "timeline_events" (id, title, description, date, type, importance, "universeId", "createdAt", "updatedAt") VALUES
  ('tle00001-0000-0000-0000-000000000001', 'The Great Awakening', 'The moment Adaeze discovers her powers and the Agbala Prophecy is set in motion.', '2025-01-15T00:00:00Z', 'story', 'critical', 'um000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('tle00001-0000-0000-0000-000000000002', 'The Crown Discovered', 'Adaeze finds the first clue to the Crown of Unity location.', '2025-03-20T00:00:00Z', 'story', 'high', 'um000001-0000-0000-0000-000000000001', NOW(), NOW()),
  ('tle00001-0000-0000-0000-000000000003', 'The Convergence Begins', 'Characters from different titles meet for the first time at the Festival of Realms.', '2025-06-01T00:00:00Z', 'story', 'critical', 'um000001-0000-0000-0000-000000000001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SPORTS: Highlights
-- ============================================================================

INSERT INTO "highlights" (id, "eventId", "creatorId", title, description, thumbnail, "mediaUrl", "viewCount", "createdAt", "updatedAt") VALUES
  ('hig00001-0000-0000-0000-000000000001', (SELECT id FROM "sports_events" LIMIT 1), 'a0000001-0000-0000-0000-000000000011', 'Goal of the Week', 'The stunning free kick that won the match.', '/images/sports/highlights/goal-week.jpg', 'https://cdn.azeeboplus.com/sports/goal-week.mp4', 89000, NOW(), NOW()),
  ('hig00001-0000-0000-0000-000000000002', (SELECT id FROM "sports_events" LIMIT 1), 'a0000001-0000-0000-0000-000000000011', 'Match Highlights: Eagles vs Lions', 'Full highlights from the thriller match.', '/images/sports/highlights/eagles-lions.jpg', 'https://cdn.azeeboplus.com/sports/eagles-lions.mp4', 120000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PAYMENT SYSTEM: Sample Payments
-- ============================================================================

INSERT INTO "payments" (id, "userId", amount, currency, status, provider, reference, description, "createdAt", "updatedAt") VALUES
  ('pay00001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 5000, 'NGN', 'completed', 'paystack', 'REF-PAY-001', 'Wallet funding via Paystack', NOW(), NOW()),
  ('pay00001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 10000, 'NGN', 'completed', 'paystack', 'REF-PAY-002', 'Wallet funding via Paystack', NOW(), NOW()),
  ('pay00001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 2500, 'NGN', 'completed', 'flutterwave', 'REF-PAY-003', 'Wallet funding via Flutterwave', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
