-- ============================================
-- TimescaleDB 統合初期化スクリプト
-- Seneca System: 全テーブル・機能の一括セットアップ
-- ============================================
-- このファイルは以下を統合しています:
--   - init-timescaledb.sql
--   - migrations/001_add_work_sessions.sql
--   - migrations/002_move_applications_to_timescale.sql
-- ============================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================
-- 1. 打刻テーブル (work_timestamps)
-- ============================================
CREATE TABLE IF NOT EXISTS work_timestamps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       VARCHAR(255) NOT NULL,
  status          VARCHAR(20) NOT NULL, -- 'WORK', 'REST', 'END'
  timestamp       TIMESTAMPTZ NOT NULL,
  memo            TEXT,
  application_status VARCHAR(20) DEFAULT 'NONE', -- 'NONE', 'PENDING', 'APPROVED', 'PAID'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('work_timestamps', 'timestamp', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_work_timestamps_worker ON work_timestamps (worker_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_work_timestamps_status ON work_timestamps (application_status, timestamp DESC);

-- ============================================
-- 2. 打刻編集履歴テーブル (work_timestamp_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS work_timestamp_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp_id    UUID NOT NULL,
  worker_id       VARCHAR(255) NOT NULL,
  field_name      VARCHAR(50) NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  changed_at      TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('work_timestamp_logs', 'changed_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_work_timestamp_logs_worker ON work_timestamp_logs (worker_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_timestamp_logs_timestamp ON work_timestamp_logs (timestamp_id, changed_at DESC);

-- ============================================
-- 3. 時間申請ログテーブル (time_application_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS time_application_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      VARCHAR(255) NOT NULL,
  worker_id           VARCHAR(255) NOT NULL,
  action              VARCHAR(20) NOT NULL,   -- 'CREATED', 'UPDATED', 'DELETED', 'SUBMITTED'
  type                VARCHAR(20),            -- 'SINGLE', 'BATCH', 'PERIOD'
  start_date          DATE,
  end_date            DATE,
  total_minutes       INTEGER,
  total_amount_usd    DECIMAL(12, 2),
  status              VARCHAR(20),            -- 'PENDING', 'APPROVED', 'REJECTED'
  memo                TEXT,
  timestamp_ids       TEXT[],
  metadata            JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('time_application_logs', 'created_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_time_application_logs_app ON time_application_logs (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_application_logs_worker ON time_application_logs (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_application_logs_action ON time_application_logs (action, created_at DESC);

-- ============================================
-- 4. 時間申請承認ログテーブル (time_application_approval_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS time_application_approval_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      VARCHAR(255) NOT NULL,
  worker_id           VARCHAR(255) NOT NULL,
  admin_id            VARCHAR(255) NOT NULL,
  action              VARCHAR(20) NOT NULL,   -- 'APPROVED', 'REJECTED'
  previous_status     VARCHAR(20) NOT NULL,
  new_status          VARCHAR(20) NOT NULL,
  rejection_reason    TEXT,
  total_amount_usd    DECIMAL(12, 2),
  metadata            JSONB,
  approved_at         TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('time_application_approval_logs', 'approved_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_approval_logs_app ON time_application_approval_logs (application_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_worker ON time_application_approval_logs (worker_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_admin ON time_application_approval_logs (admin_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_action ON time_application_approval_logs (action, approved_at DESC);

-- ============================================
-- 5. 給与受領ログテーブル (payment_request_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_request_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id  VARCHAR(255) NOT NULL,
  worker_id           VARCHAR(255) NOT NULL,
  action              VARCHAR(20) NOT NULL,   -- 'CREATED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  application_ids     TEXT[],
  amount_usd          DECIMAL(12, 2),
  crypto_type         VARCHAR(10),            -- 'XRP', 'BTC', 'ETH'
  crypto_rate         DECIMAL(18, 6),
  crypto_amount       DECIMAL(18, 6),
  crypto_address      TEXT,
  previous_status     VARCHAR(20),
  new_status          VARCHAR(20) NOT NULL,
  admin_id            VARCHAR(255),
  transaction_hash    VARCHAR(255),
  error_message       TEXT,
  metadata            JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('payment_request_logs', 'created_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_payment_request_logs_request ON payment_request_logs (payment_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_worker ON payment_request_logs (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_action ON payment_request_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_status ON payment_request_logs (new_status, created_at DESC);

-- ============================================
-- 6. 為替レート履歴テーブル (exchange_rate_history)
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          VARCHAR(50) NOT NULL, -- 'coingecko', 'binance', 'kraken'
  crypto          VARCHAR(10) NOT NULL, -- 'XRP', 'BTC', 'ETH'
  fiat            VARCHAR(10) NOT NULL, -- 'USD'
  rate            DECIMAL(18, 6) NOT NULL,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('exchange_rate_history', 'recorded_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_crypto ON exchange_rate_history (crypto, recorded_at DESC);

-- ============================================
-- 7. 支払いトランザクションテーブル (payment_transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id  VARCHAR(255) NOT NULL,
  organization_id     VARCHAR(255) NOT NULL,
  worker_id           VARCHAR(255) NOT NULL,
  amount_usd          DECIMAL(12, 2) NOT NULL,
  crypto_type         VARCHAR(10) NOT NULL,
  crypto_rate         DECIMAL(18, 6) NOT NULL,
  crypto_amount       DECIMAL(18, 6) NOT NULL,
  transaction_hash    VARCHAR(255),
  status              VARCHAR(20) NOT NULL,
  error_message       TEXT,
  executed_at         TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('payment_transactions', 'executed_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_request ON payment_transactions (payment_request_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org ON payment_transactions (organization_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_worker ON payment_transactions (worker_id, executed_at DESC);

-- ============================================
-- 8. 支払いハッシュログテーブル (payment_hash_logs)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_hash_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id  VARCHAR(255) NOT NULL,
  data_hash           VARCHAR(64) NOT NULL,
  canonical_data      JSONB NOT NULL,
  transaction_hash    VARCHAR(255),
  verified_at         TIMESTAMPTZ,
  verification_result BOOLEAN,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('payment_hash_logs', 'created_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_payment_hash_payment ON payment_hash_logs (payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_hash_tx ON payment_hash_logs (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payment_hash_hash ON payment_hash_logs (data_hash);

-- ============================================
-- 9. 時間申請マスタテーブル (time_applications)
-- ============================================
CREATE TABLE IF NOT EXISTS time_applications (
  id                      VARCHAR(255) NOT NULL,
  worker_id               VARCHAR(255) NOT NULL,
  organization_id         VARCHAR(255) NOT NULL,

  -- 申請基本情報
  type                    VARCHAR(20) NOT NULL,      -- 'SINGLE', 'BATCH', 'PERIOD'
  start_date              DATE NOT NULL,
  end_date                DATE NOT NULL,
  total_minutes           INT NOT NULL,
  total_amount_usd        DECIMAL(12, 2) NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING/APPROVED/REJECTED/REQUESTED/PAID
  memo                    TEXT,
  timestamp_ids           TEXT[] NOT NULL,
  session_ids             TEXT[],

  -- 承認関連
  approved_at             TIMESTAMPTZ,
  approved_by             VARCHAR(255),
  approved_amount_usd     DECIMAL(12, 2),
  hourly_rate_at_approval DECIMAL(10, 2),

  -- 却下関連
  rejection_category      VARCHAR(30),               -- TIME_ERROR/MISSING_REST/DUPLICATE/POLICY_VIOLATION/OTHER
  rejection_reason        TEXT,
  rejected_at             TIMESTAMPTZ,
  rejected_by             VARCHAR(255),

  -- 再申請関連
  original_application_id VARCHAR(255),
  resubmit_count          INT DEFAULT 0,

  -- 支払い関連
  payment_request_id      VARCHAR(255),

  -- タイムスタンプ
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id, created_at)
);

SELECT create_hypertable('time_applications', 'created_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_time_applications_worker ON time_applications (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_org ON time_applications (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_status ON time_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_org_status ON time_applications (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_worker_status ON time_applications (worker_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_applications_original ON time_applications (original_application_id);
CREATE INDEX IF NOT EXISTS idx_time_applications_payment ON time_applications (payment_request_id);
CREATE INDEX IF NOT EXISTS idx_time_applications_pending ON time_applications (organization_id, status, created_at DESC)
  WHERE status = 'PENDING';

-- ============================================
-- トリガー: time_applications の updated_at 自動更新
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
-- トリガー: 承認後の打刻編集制限
-- ============================================
CREATE OR REPLACE FUNCTION check_timestamp_editable()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.application_status IN ('APPROVED', 'REQUESTED', 'PAID') THEN
      RAISE EXCEPTION 'Cannot delete timestamp with application_status: %. Approved timestamps are immutable.', OLD.application_status;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.application_status IN ('APPROVED', 'REQUESTED', 'PAID') THEN
      IF OLD.status != NEW.status OR
         OLD.timestamp != NEW.timestamp OR
         OLD.memo IS DISTINCT FROM NEW.memo THEN
        RAISE EXCEPTION 'Cannot edit timestamp with application_status: %. Only application_status can be changed.', OLD.application_status;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_approved_timestamp_edit ON work_timestamps;
CREATE TRIGGER prevent_approved_timestamp_edit
  BEFORE UPDATE OR DELETE ON work_timestamps
  FOR EACH ROW
  EXECUTE FUNCTION check_timestamp_editable();

-- ============================================
-- 初期化完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TimescaleDB 統合初期化が完了しました';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '作成されたHypertables:';
  RAISE NOTICE '  1. work_timestamps        - 打刻データ';
  RAISE NOTICE '  2. work_timestamp_logs    - 打刻編集履歴';
  RAISE NOTICE '  3. time_application_logs  - 申請ログ';
  RAISE NOTICE '  4. time_application_approval_logs - 承認ログ';
  RAISE NOTICE '  5. payment_request_logs   - 給与受領ログ';
  RAISE NOTICE '  6. exchange_rate_history  - 為替レート履歴';
  RAISE NOTICE '  7. payment_transactions   - 支払いトランザクション';
  RAISE NOTICE '  8. payment_hash_logs      - 支払いハッシュログ';
  RAISE NOTICE '  9. time_applications      - 時間申請マスタ';
  RAISE NOTICE '';
  RAISE NOTICE '作成されたトリガー:';
  RAISE NOTICE '  - trigger_time_applications_updated_at';
  RAISE NOTICE '  - prevent_approved_timestamp_edit';
  RAISE NOTICE '============================================';
END $$;
