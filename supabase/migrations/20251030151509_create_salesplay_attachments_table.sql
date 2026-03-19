/*
  # Create SalesPlay Attachments Table

  1. New Tables
    - `salesplay_attachments`
      - `id` (uuid, primary key)
      - `salesplay_id` (uuid, foreign key to salesplays table)
      - `file_name` (text) - Original name of the file
      - `file_size` (integer) - Size in bytes
      - `file_type` (text) - MIME type
      - `storage_path` (text) - Path to file in Supabase Storage
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `salesplay_attachments` table
    - Add policies for authenticated users to manage their own attachments

  3. Storage
    - Create a storage bucket for salesplay attachments
*/

-- Create the salesplay_attachments table
CREATE TABLE IF NOT EXISTS salesplay_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesplay_id uuid REFERENCES salesplays(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE salesplay_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for salesplay_attachments
CREATE POLICY "Users can view attachments for their salesplays"
  ON salesplay_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesplays
      WHERE salesplays.id = salesplay_attachments.salesplay_id
      AND salesplays.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for their salesplays"
  ON salesplay_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salesplays
      WHERE salesplays.id = salesplay_attachments.salesplay_id
      AND salesplays.user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete their own attachments"
  ON salesplay_attachments
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create storage bucket for salesplay attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('salesplay-attachments', 'salesplay-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload attachments"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'salesplay-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'salesplay-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'salesplay-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);