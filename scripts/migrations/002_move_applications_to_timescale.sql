-- ============================================
-- Migration: 002_move_applications_to_timescale
-- Description: 申請マスタをTimescaleDBへ移行
-- Date: 2024-01-27
-- ============================================

-- ============================================
-- 申請マスタテーブル (time_applications)
-- PostgreSQLのTimeApplicationを置き換え
-- ============================================
CREATE TABLE IF NOT EXISTS time_applications (
  id                      VARCHAR(255) NOT NULL,     -- cuid形式
  worker_id               VARCHAR(255) NOT NULL,
  organization_id         VARCHAR(255) NOT NULL,     -- 組織ID（クエリ効率化）

  -- 申請基本情報
  type                    VARCHAR(20) NOT NULL,      -- 'SINGLE', 'BATCH', 'PERIOD'
  start_date              DATE NOT NULL,
  end_date                DATE NOT NULL,
  total_minutes           INT NOT NULL,
  total_amount_usd        DECIMAL(12, 2) NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING/APPROVED/REJECTED/REQUESTED/PAID
  memo                    TEXT,
  timestamp_ids           TEXT[] NOT NULL,           -- 打刻IDの配列
  session_ids             TEXT[],                    -- WorkSession IDの配列

  -- 承認関連
  approved_at             TIMESTAMPTZ,
  approved_by             VARCHAR(255),              -- AdminUser.id
  approved_amount_usd     DECIMAL(12, 2),            -- 承認時点の金額を固定
  hourly_rate_at_approval DECIMAL(10, 2),            -- 承認時点の時給

  -- 却下関連
  rejection_category      VARCHAR(30),               -- TIME_ERROR/MISSING_REST/DUPLICATE/POLICY_VIOLATION/OTHER
  rejection_reason        TEXT,
  rejected_at             TIMESTAMPTZ,
  rejected_by             VARCHAR(255),              -- AdminUser.id

  -- 再申請関連
  original_application_id VARCHAR(255),              -- 再申請元の申請ID
  resubmit_count          INT DEFAULT 0,

  -- 支払い関連
  payment_request_id      VARCHAR(255),              -- PaymentRequest.id

  -- タイムスタンプ
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 複合プライマリキー（Hypertable要件）
  PRIMARY KEY (id, created_at)
);

-- Hypertableへ変換（created_atでパーティション）
SELECT create_hypertable('time_applications', 'created_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_time_applications_worker ON time_applications (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_org ON time_applications (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_status ON time_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_org_status ON time_applications (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_worker_status ON time_applications (worker_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_original ON time_applications (original_application_id);
CREATE INDEX IF NOT EXISTS idx_time_applications_payment ON time_applications (payment_request_id);

-- 複合インデックス（承認待ち一覧用）
CREATE INDEX IF NOT EXISTS idx_time_applications_pending ON time_applications (organization_id, status, created_at DESC)
  WHERE status = 'PENDING';

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================
CREATE OR REPLACE FUNCTION update_time_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_time_applications_updated_at ON time_applications;
CREATE TRIGGER trigger_time_applications_updated_at
  BEFORE UPDATE ON time_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_time_applications_updated_at();

-- ============================================
-- 圧縮ポリシー（90日以上前の完了データ）
-- ============================================
-- ALTER TABLE time_applications SET (
--   timescaledb.compress,
--   timescaledb.compress_segmentby = 'organization_id, worker_id',
--   timescaledb.compress_orderby = 'created_at DESC'
-- );
-- SELECT add_compression_policy('time_applications', INTERVAL '90 days');

-- ============================================
-- Continuous Aggregates（月次集計）
-- ============================================
-- CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_application_stats
-- WITH (timescaledb.continuous) AS
-- SELECT
--   time_bucket('1 month', created_at) AS month,
--   organization_id,
--   status,
--   COUNT(*) AS application_count,
--   SUM(total_minutes) AS total_minutes,
--   SUM(total_amount_usd) AS total_amount_usd
-- FROM time_applications
-- GROUP BY time_bucket('1 month', created_at), organization_id, status
-- WITH NO DATA;
--
-- SELECT add_continuous_aggregate_policy('monthly_application_stats',
--   start_offset => INTERVAL '3 months',
--   end_offset => INTERVAL '1 hour',
--   schedule_interval => INTERVAL '1 day'
-- );

-- ============================================
-- 完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 002_move_applications_to_timescale completed successfully';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - time_applications (Hypertable)';
  RAISE NOTICE 'Created indexes:';
  RAISE NOTICE '  - idx_time_applications_worker';
  RAISE NOTICE '  - idx_time_applications_org';
  RAISE NOTICE '  - idx_time_applications_status';
  RAISE NOTICE '  - idx_time_applications_org_status';
  RAISE NOTICE '  - idx_time_applications_worker_status';
  RAISE NOTICE '  - idx_time_applications_pending (partial)';
  RAISE NOTICE 'Note: Compression and Continuous Aggregates are commented out for manual enabling';
END $$;
