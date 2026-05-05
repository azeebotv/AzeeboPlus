-- Initial Universes
INSERT INTO universes (id, name, display_name, description, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'lifestyle', 'Lifestyle', 'Culture, stories, and lifestyle content', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'sports', 'Sports', 'Sports events and related content', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'reality', 'Reality TV', 'Reality television shows and content', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'movie', 'Movies', 'Movies and film content', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'comedy', 'Comedy', 'Comedy shows and content', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'games', 'Gaming', 'Gaming and esports content', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Initial Categories
INSERT INTO categories (id, name, slug, description, created_at, updated_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Featured', 'featured', 'Featured content', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', 'Trending', 'trending', 'Trending content', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440003', 'New Release', 'new-release', 'Recently released content', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440004', 'Exclusive', 'exclusive', 'Exclusive content', NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440005', 'Premium', 'premium', 'Premium content', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
