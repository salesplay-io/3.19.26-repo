/*
  # Add salesplay_id to leads table

  1. Changes
    - Add `salesplay_id` column to `leads` table
      - Links a lead to a specific salesplay
      - Optional field (nullable) to maintain backward compatibility
      - Foreign key reference to salesplays table with CASCADE delete

  2. Notes
    - This allows leads to be associated with a specific salesplay
    - A contact can be a lead in one salesplay but not in others
    - Existing leads will have NULL salesplay_id until updated
*/

-- Add salesplay_id column to leads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'salesplay_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN salesplay_id uuid REFERENCES salesplays(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_salesplay_id ON leads(salesplay_id);