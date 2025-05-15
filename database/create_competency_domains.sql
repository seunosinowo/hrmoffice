-- Create competency_domains table if it doesn't exist
CREATE TABLE IF NOT EXISTS competency_domains (
  id SERIAL PRIMARY KEY,
  domain_name VARCHAR(100) NOT NULL,
  category_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(domain_name)
);

DO $$
DECLARE
  has_category_id boolean;
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'competencydomains') THEN
    has_category_id := EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'competencydomains' AND column_name = 'category_id'
    );

    IF has_category_id THEN
      -- If category_id exists, include it in the copy
      INSERT INTO competency_domains (id, domain_name, category_id, created_at)
      SELECT id, name, category_id, created_at
      FROM competencydomains
      ON CONFLICT DO NOTHING;
    ELSE
      -- If category_id doesn't exist, copy without it
      INSERT INTO competency_domains (id, domain_name, created_at)
      SELECT id, name, created_at
      FROM competencydomains
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- Add foreign key constraint to competencies table
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'competencies' AND column_name = 'domain_id'
  ) THEN
    -- Check if the constraint already exists
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE constraint_name = 'competencies_domain_id_fkey_new'
    ) THEN
      -- Add the new foreign key constraint
      ALTER TABLE competencies
      ADD CONSTRAINT competencies_domain_id_fkey_new
      FOREIGN KEY (domain_id) REFERENCES competency_domains(id)
      ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
