/*
  # Add company size field to accounts table

  1. Changes
    - Add `company_size` column to `accounts` table
      - Type: text (to store the size range)
      - Optional field
      - Valid values: '<100', '100-500', '500-1,000', '1,000-2,500', '2,500-5,000', '5,000-10,000', '10,000+'

  2. Notes
    - This field allows tracking of company size for better account segmentation
    - Size ranges help sales teams understand account potential and personalize outreach
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE accounts ADD COLUMN company_size text;
  END IF;
END $$;
