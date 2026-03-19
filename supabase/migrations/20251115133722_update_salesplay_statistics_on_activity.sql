/*
  # Update SalesPlay Statistics on Activity Logging

  1. Purpose
    - Automatically update salesplay statistics when activities are logged
    - Track call attempts and call connects
    - Update step completion status when all tasks for a step are completed

  2. New Functions
    - `update_salesplay_call_stats()` - Updates call_attempts and call_connects when a call log is created
    - `check_and_update_step_completion()` - Checks if all tasks for a step are completed and updates the step

  3. New Triggers
    - Trigger on call_logs table to update salesplay statistics
    - Trigger on tasks table to check step completion when task is marked complete

  4. Changes
    - Add step_id column to tasks table to track which step a task belongs to
*/

-- Add step_id to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'step_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN step_id uuid REFERENCES salesplay_steps(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Function to update salesplay call statistics when a call log is created
CREATE OR REPLACE FUNCTION update_salesplay_call_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment call_attempts for every call log
  UPDATE salesplays
  SET call_attempts = call_attempts + 1,
      updated_at = now()
  WHERE id = NEW.salesplay_id;

  -- Increment call_connects if the outcome is 'connected'
  IF NEW.outcome = 'connected' THEN
    UPDATE salesplays
    SET call_connects = call_connects + 1,
        updated_at = now()
    WHERE id = NEW.salesplay_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for call_logs
DROP TRIGGER IF EXISTS trigger_update_salesplay_call_stats ON call_logs;
CREATE TRIGGER trigger_update_salesplay_call_stats
  AFTER INSERT ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_salesplay_call_stats();

-- Function to check and update step completion
CREATE OR REPLACE FUNCTION check_and_update_step_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_step_id uuid;
  v_total_tasks integer;
  v_completed_tasks integer;
BEGIN
  -- Only proceed if the task is now completed and has a step_id
  IF NEW.completed = true AND NEW.step_id IS NOT NULL THEN
    v_step_id := NEW.step_id;
    
    -- Count total tasks for this step
    SELECT COUNT(*) INTO v_total_tasks
    FROM tasks
    WHERE step_id = v_step_id;
    
    -- Count completed tasks for this step
    SELECT COUNT(*) INTO v_completed_tasks
    FROM tasks
    WHERE step_id = v_step_id AND completed = true;
    
    -- If all tasks are completed, mark the step as completed
    IF v_total_tasks > 0 AND v_total_tasks = v_completed_tasks THEN
      UPDATE salesplay_steps
      SET completed = true,
          completed_at = now()
      WHERE id = v_step_id AND completed = false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tasks
DROP TRIGGER IF EXISTS trigger_check_step_completion ON tasks;
CREATE TRIGGER trigger_check_step_completion
  AFTER UPDATE OF completed ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_and_update_step_completion();