-- Admin User (password: admin123 - bcrypt hash)
INSERT INTO users (id, email, password, display_name, role, created_at, updated_at)
VALUES (
  '770e8400-e29b-41d4-a716-446655440001',
  'admin@azeebo.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4/X4/X4/X4/X4/X4',
  'Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
