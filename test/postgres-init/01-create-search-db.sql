-- Creates the dedicated search-service test database. The postgres-test
-- container initializes with POSTGRES_DB=azeebo_payment_test; this script
-- (mounted into /docker-entrypoint-initdb.d/) adds the search schema's
-- database on first boot so the search pg_trgm e2e has a target. The e2e
-- suite applies the schema itself (`prisma db push`, schema-first).
CREATE DATABASE azeebo_search_test;
