/*
  # Backfill step_id for existing tasks

  1. Purpose
    - Update existing tasks that don't have step_id to link them to their corresponding salesplay steps
    - Match tasks to steps based on salesplay_id, task type, and step order/timing

  2. Changes
    - Updates all tasks with NULL step_id to match them with their corresponding steps
    - Uses task type and due date to determine which step a task belongs to
*/

-- Update existing tasks to link them to their corresponding steps
-- This matches tasks to steps based on salesplay, type, and chronological order
UPDATE tasks t
SET step_id = (
  SELECT ss.id
  FROM salesplay_steps ss
  WHERE ss.salesplay_id = t.salesplay_id
    AND ss.type::text = t.type::text
  ORDER BY ss.step_order
  LIMIT 1
)
WHERE t.step_id IS NULL
  AND t.salesplay_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM salesplay_steps ss 
    WHERE ss.salesplay_id = t.salesplay_id 
      AND ss.type::text = t.type::text
  );