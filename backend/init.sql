-- Initial database setup for Credit Risk System
-- This file is executed when PostgreSQL container starts

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions to creditrisk user
GRANT ALL PRIVILEGES ON SCHEMA public TO creditrisk;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO creditrisk;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO creditrisk;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO creditrisk;

-- Note: Tables will be created by SQLAlchemy models
-- This ensures no conflicts between init.sql and SQLAlchemy