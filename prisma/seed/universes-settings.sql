-- Seed default universes with feature flags
-- This script should be run after database migration

-- Insert default universes
INSERT INTO universes (id, name, displayName, description, icon, color, isEnabled, sortOrder, metadata, createdAt, updatedAt)
VALUES
  (gen_random_uuid(), 'reality', 'Reality Shows', 'Reality TV shows and competitions', '🎭', '#EC4899', true, 1, '{"genre": "reality"}', NOW(), NOW()),
  (gen_random_uuid(), 'sports', 'Sports', 'Live sports, highlights, and analysis', '⚽', '#EF4444', true, 2, '{"genre": "sports"}', NOW(), NOW()),
  (gen_random_uuid(), 'games', 'Games', 'Gaming content, streams, and esports', '🎮', '#3B82F6', true, 3, '{"genre": "gaming"}', NOW(), NOW()),
  (gen_random_uuid(), 'comedy', 'Comedy', 'Stand-up, sketches, and comedy shows', '😂', '#F59E0B', true, 4, '{"genre": "comedy"}', NOW(), NOW()),
  (gen_random_uuid(), 'lifestyle', 'Lifestyle', 'Fashion, beauty, and lifestyle content', '💄', '#8B5CF6', true, 5, '{"genre": "lifestyle"}', NOW(), NOW()),
  (gen_random_uuid(), 'movie', 'Movies', 'Movies, trailers, and reviews', '🎬', '#6366F1', true, 6, '{"genre": "movies"}', NOW(), NOW()),
  (gen_random_uuid(), 'vertical', 'Vertical', 'Short-form vertical video content', '📱', '#10B981', true, 7, '{"genre": "shorts"}', NOW(), NOW()),
  (gen_random_uuid(), 'creator', 'Creators', 'Creator-exclusive content', '✨', '#F97316', true, 8, '{"genre": "creator"}', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert feature flags for Reality universe
INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'voting_enabled',
  true,
  '{"allow_multiple_votes": false}',
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'reality'
ON CONFLICT (universeId, featureKey) DO NOTHING;

INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'live_chat_enabled',
  true,
  '{"moderation_level": "strict"}',
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'reality'
ON CONFLICT (universeId, featureKey) DO NOTHING;

INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'predictions_enabled',
  false,
  NULL,
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'reality'
ON CONFLICT (universeId, featureKey) DO NOTHING;

-- Insert feature flags for Sports universe
INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'live_scores_enabled',
  true,
  NULL,
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'sports'
ON CONFLICT (universeId, featureKey) DO NOTHING;

INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'predictions_enabled',
  true,
  '{"allow_betting": false}',
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'sports'
ON CONFLICT (universeId, featureKey) DO NOTHING;

-- Insert feature flags for Games universe
INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'streaming_enabled',
  true,
  NULL,
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'games'
ON CONFLICT (universeId, featureKey) DO NOTHING;

INSERT INTO universe_feature_flags (id, universeId, featureKey, isEnabled, metadata, createdAt, updatedAt)
SELECT
  gen_random_uuid(),
  u.id,
  'tournaments_enabled',
  true,
  NULL,
  NOW(),
  NOW()
FROM universes u
WHERE u.name = 'games'
ON CONFLICT (universeId, featureKey) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (id, key, value, category, description, isPublic, createdAt, updatedAt)
VALUES
  (gen_random_uuid(), 'site_name', '"Azeebo+"', 'general', 'Platform name', true, NOW(), NOW()),
  (gen_random_uuid(), 'site_description', '"The ultimate entertainment platform"', 'general', 'Platform description', true, NOW(), NOW()),
  (gen_random_uuid(), 'site_tagline', '"Discover, Create, Engage"', 'general', 'Platform tagline', true, NOW(), NOW()),
  (gen_random_uuid(), 'max_upload_size', '"104857600"', 'general', 'Maximum upload size in bytes (100MB)', false, NOW(), NOW()),
  (gen_random_uuid(), 'allowed_file_types', '["mp4", "mov", "avi", "mkv"]', 'general', 'Allowed video file types', false, NOW(), NOW()),
  (gen_random_uuid(), 'seo_title', '"Azeebo+ - Entertainment Platform"', 'seo', 'Default SEO title', true, NOW(), NOW()),
  (gen_random_uuid(), 'seo_description', '"Discover amazing content across reality, sports, gaming, comedy, and more on Azeebo+"', 'seo', 'Default SEO description', true, NOW(), NOW()),
  (gen_random_uuid(), 'seo_keywords', '["entertainment", "streaming", "reality", "sports", "gaming", "comedy"]', 'seo', 'Default SEO keywords', true, NOW(), NOW()),
  (gen_random_uuid(), 'social_twitter', '"@azeeboplus"', 'social', 'Twitter handle', true, NOW(), NOW()),
  (gen_random_uuid(), 'social_instagram', '"@azeeboplus"', 'social', 'Instagram handle', true, NOW(), NOW()),
  (gen_random_uuid(), 'social_facebook', '"azeeboplus"', 'social', 'Facebook page', true, NOW(), NOW()),
  (gen_random_uuid(), 'social_youtube', '"@azeeboplus"', 'social', 'YouTube channel', true, NOW(), NOW()),
  (gen_random_uuid(), 'contact_email', '"support@azeeboplus.com"', 'contact', 'Contact email address', true, NOW(), NOW()),
  (gen_random_uuid(), 'support_email', '"help@azeeboplus.com"', 'contact', 'Support email address', true, NOW(), NOW()),
  (gen_random_uuid(), 'maintenance_mode', 'false', 'system', 'Enable maintenance mode', false, NOW(), NOW()),
  (gen_random_uuid(), 'registration_enabled', 'true', 'system', 'Allow new user registrations', false, NOW(), NOW()),
  (gen_random_uuid(), 'creator_approval_required', 'true', 'system', 'Require approval for new creators', false, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
