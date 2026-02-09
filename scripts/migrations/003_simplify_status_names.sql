-- Migration: Simplify work timestamp status names
-- Date: 2026-01-28
-- Description: Change status names from WORK_START/WORK_END/REST_START/REST_END to WORK/REST/END

-- ============================================
-- Update work_timestamps table
-- ============================================

-- Update WORK_START -> WORK
UPDATE work_timestamps SET status = 'WORK' WHERE status = 'WORK_START';

-- Update REST_START -> REST
UPDATE work_timestamps SET status = 'REST' WHERE status = 'REST_START';

-- Update WORK_END -> END
UPDATE work_timestamps SET status = 'END' WHERE status = 'WORK_END';

-- Update REST_END -> END (if any exist)
UPDATE work_timestamps SET status = 'END' WHERE status = 'REST_END';

-- ============================================
-- Update work_timestamp_logs table (old_value/new_value columns)
-- ============================================

-- Update old_value column
UPDATE work_timestamp_logs SET old_value = 'WORK' WHERE field_name = 'status' AND old_value = 'WORK_START';
UPDATE work_timestamp_logs SET old_value = 'REST' WHERE field_name = 'status' AND old_value = 'REST_START';
UPDATE work_timestamp_logs SET old_value = 'END' WHERE field_name = 'status' AND old_value = 'WORK_END';
UPDATE work_timestamp_logs SET old_value = 'END' WHERE field_name = 'status' AND old_value = 'REST_END';

-- Update new_value column
UPDATE work_timestamp_logs SET new_value = 'WORK' WHERE field_name = 'status' AND new_value = 'WORK_START';
UPDATE work_timestamp_logs SET new_value = 'REST' WHERE field_name = 'status' AND new_value = 'REST_START';
UPDATE work_timestamp_logs SET new_value = 'END' WHERE field_name = 'status' AND new_value = 'WORK_END';
UPDATE work_timestamp_logs SET new_value = 'END' WHERE field_name = 'status' AND new_value = 'REST_END';

-- ============================================
-- Verification queries (optional, run to verify)
-- ============================================

-- Check remaining old status values in work_timestamps
-- SELECT DISTINCT status FROM work_timestamps;

-- Check remaining old status values in work_timestamp_logs
-- SELECT DISTINCT old_value FROM work_timestamp_logs WHERE field_name = 'status';
-- SELECT DISTINCT new_value FROM work_timestamp_logs WHERE field_name = 'status';

-- ============================================
-- Migration complete
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 003: Status names simplified successfully';
  RAISE NOTICE '  WORK_START -> WORK';
  RAISE NOTICE '  REST_START -> REST';
  RAISE NOTICE '  WORK_END -> END';
  RAISE NOTICE '  REST_END -> END';
END $$;
