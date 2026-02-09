-- Migration: 004_drop_work_sessions
-- Date: 2026-02-09
-- Description: Drop unused work_sessions related tables

-- ============================================
-- Drop tables (in order of dependencies)
-- ============================================

-- Drop work_session_logs first (depends on work_sessions)
DROP TABLE IF EXISTS work_session_logs;

-- Drop work_session_timestamps (junction table)
DROP TABLE IF EXISTS work_session_timestamps;

-- Drop work_sessions (main table)
DROP TABLE IF EXISTS work_sessions;

-- ============================================
-- Verification
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 004_drop_work_sessions completed successfully';
  RAISE NOTICE 'Dropped tables:';
  RAISE NOTICE '  - work_session_logs';
  RAISE NOTICE '  - work_session_timestamps';
  RAISE NOTICE '  - work_sessions';
END $$;
