-- TimescaleDB初期化スクリプト
-- Seneca System: 打刻・ログ・為替レートの時系列データ管理

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================
-- 打刻テーブル
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

-- Hypertableへ変換
SELECT create_hypertable('work_timestamps', 'timestamp', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_work_timestamps_worker ON work_timestamps (worker_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_work_timestamps_status ON work_timestamps (application_status, timestamp DESC);

-- ============================================
-- 打刻編集履歴テーブル
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

-- Hypertableへ変換
SELECT create_hypertable('work_timestamp_logs', 'changed_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_work_timestamp_logs_worker ON work_timestamp_logs (worker_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_timestamp_logs_timestamp ON work_timestamp_logs (timestamp_id, changed_at DESC);

-- ============================================
-- 時間申請ログテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS time_application_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      VARCHAR(255) NOT NULL,  -- PostgreSQLのTimeApplication.id
  worker_id           VARCHAR(255) NOT NULL,
  action              VARCHAR(20) NOT NULL,   -- 'CREATED', 'UPDATED', 'DELETED', 'SUBMITTED'
  type                VARCHAR(20),            -- 'SINGLE', 'BATCH', 'PERIOD'
  start_date          DATE,
  end_date            DATE,
  total_minutes       INTEGER,
  total_amount_usd    DECIMAL(12, 2),
  status              VARCHAR(20),            -- 'PENDING', 'APPROVED', 'REJECTED'
  memo                TEXT,
  timestamp_ids       TEXT[],                 -- 打刻IDの配列
  metadata            JSONB,                  -- その他のメタデータ
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('time_application_logs', 'created_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_time_application_logs_app ON time_application_logs (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_application_logs_worker ON time_application_logs (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_application_logs_action ON time_application_logs (action, created_at DESC);

-- ============================================
-- 時間申請承認ログテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS time_application_approval_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      VARCHAR(255) NOT NULL,  -- PostgreSQLのTimeApplication.id
  worker_id           VARCHAR(255) NOT NULL,
  admin_id            VARCHAR(255) NOT NULL,  -- 承認した管理者のID
  action              VARCHAR(20) NOT NULL,   -- 'APPROVED', 'REJECTED'
  previous_status     VARCHAR(20) NOT NULL,   -- 承認前のステータス
  new_status          VARCHAR(20) NOT NULL,   -- 承認後のステータス
  rejection_reason    TEXT,                   -- 却下理由
  total_amount_usd    DECIMAL(12, 2),
  metadata            JSONB,                  -- その他のメタデータ
  approved_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('time_application_approval_logs', 'approved_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_approval_logs_app ON time_application_approval_logs (application_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_worker ON time_application_approval_logs (worker_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_admin ON time_application_approval_logs (admin_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_logs_action ON time_application_approval_logs (action, approved_at DESC);

-- ============================================
-- 給与受領ログテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS payment_request_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id  VARCHAR(255) NOT NULL,  -- PostgreSQLのPaymentRequest.id
  worker_id           VARCHAR(255) NOT NULL,
  action              VARCHAR(20) NOT NULL,   -- 'CREATED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  application_ids     TEXT[],                 -- 申請IDの配列
  amount_usd          DECIMAL(12, 2),
  crypto_type         VARCHAR(10),            -- 'XRP', 'BTC', 'ETH'
  crypto_rate         DECIMAL(18, 6),         -- 暗号資産/USDレート
  crypto_amount       DECIMAL(18, 6),         -- 暗号資産数量
  crypto_address      TEXT,                   -- 送金先アドレス
  previous_status     VARCHAR(20),            -- 前のステータス
  new_status          VARCHAR(20) NOT NULL,   -- 新しいステータス
  admin_id            VARCHAR(255),           -- 承認した管理者のID(承認時のみ)
  transaction_hash    VARCHAR(255),           -- トランザクションハッシュ(完了時のみ)
  error_message       TEXT,                   -- エラーメッセージ(失敗時のみ)
  metadata            JSONB,                  -- その他のメタデータ
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('payment_request_logs', 'created_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_request ON payment_request_logs (payment_request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_worker ON payment_request_logs (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_action ON payment_request_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_request_logs_status ON payment_request_logs (new_status, created_at DESC);

-- ============================================
-- 為替レート履歴テーブル
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          VARCHAR(50) NOT NULL, -- 'coingecko', 'binance', 'kraken'
  crypto          VARCHAR(10) NOT NULL, -- 'XRP', 'BTC', 'ETH'等(ベータ版はXRPのみ)
  fiat            VARCHAR(10) NOT NULL, -- 'USD'(基準通貨)
  rate            DECIMAL(18, 6) NOT NULL,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('exchange_rate_history', 'recorded_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_exchange_rate_crypto ON exchange_rate_history (crypto, recorded_at DESC);

-- ============================================
-- 支払いトランザクションテーブル
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id  VARCHAR(255) NOT NULL,
  organization_id     VARCHAR(255) NOT NULL,
  worker_id           VARCHAR(255) NOT NULL,
  amount_usd          DECIMAL(12, 2) NOT NULL,  -- 金額(USD)
  crypto_type         VARCHAR(10) NOT NULL,     -- 'XRP', 'BTC', 'ETH'等
  crypto_rate         DECIMAL(18, 6) NOT NULL,  -- 暗号資産/USDレート
  crypto_amount       DECIMAL(18, 6) NOT NULL,  -- 暗号資産数量
  transaction_hash    VARCHAR(255),
  status              VARCHAR(20) NOT NULL,
  error_message       TEXT,
  executed_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('payment_transactions', 'executed_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_transactions_request ON payment_transactions (payment_request_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org ON payment_transactions (organization_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_worker ON payment_transactions (worker_id, executed_at DESC);

-- ============================================
-- 初期化完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'TimescaleDB初期化が完了しました';
  RAISE NOTICE '作成されたHypertables:';
  RAISE NOTICE '  - work_timestamps';
  RAISE NOTICE '  - work_timestamp_logs';
  RAISE NOTICE '  - time_application_logs';
  RAISE NOTICE '  - time_application_approval_logs';
  RAISE NOTICE '  - payment_request_logs';
  RAISE NOTICE '  - exchange_rate_history';
  RAISE NOTICE '  - payment_transactions';
END $$;
