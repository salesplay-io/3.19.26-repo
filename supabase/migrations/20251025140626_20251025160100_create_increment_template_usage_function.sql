/*
  # Create Increment Template Usage Function

  1. Purpose
    - Create a database function to atomically increment template usage count
    - Update the last_used timestamp when a template is used

  2. Function
    - `increment_template_usage(template_id uuid)` - Increments usage_count and updates last_used
*/

CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE templates
  SET 
    usage_count = usage_count + 1,
    last_used = now()
  WHERE id = template_id;
END;
$$;