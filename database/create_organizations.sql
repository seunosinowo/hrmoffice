-- Create organizations table for multi-tenant HRM
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    industry TEXT,
    company_size TEXT,
    website TEXT,
    address TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
); 