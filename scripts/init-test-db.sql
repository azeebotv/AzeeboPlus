-- Initialize test database
-- This script runs when the postgres-test container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test_azeebo;

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA test_azeebo TO azeebo_test;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test_azeebo TO azeebo_test;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA test_azeebo TO azeebo_test;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Test database initialized successfully';
END $$;