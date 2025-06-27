-- Create organizations table for multi-tenant HRM
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY, -- Unique organization ID
  name VARCHAR(255) NOT NULL UNIQUE, -- Organization name (must be unique)
  logo_url TEXT NOT NULL, -- Organization logo (required)
  created_at TIMESTAMP DEFAULT NOW() -- Creation timestamp
); 