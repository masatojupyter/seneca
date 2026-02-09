-- TimescaleDB initialization script
-- Run this after creating the database: psql -h localhost -p 5433 -U postgres -d seneca_ts -f scripts/init-timescale.sql

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- work_timestamps (打刻)
CREATE TABLE IF NOT EXISTS work_timestamps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       VARCHAR(255) NOT NULL,
  status          VARCHAR(20) NOT NULL, -- 'WORK', 'REST', 'END'
  timestamp       TIMESTAMPTZ NOT NULL,
  memo            TEXT,
  application_status VARCHAR(20) DEFAULT 'NONE', -- 'NONE', 'PENDING', 'APPROVED', 'PAID'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('work_timestamps', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_timestamps_worker_id ON work_timestamps (worker_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_work_timestamps_status ON work_timestamps (application_status, timestamp DESC);

-- work_timestamp_logs (打刻編集履歴)
CREATE TABLE IF NOT EXISTS work_timestamp_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp_id    UUID NOT NULL,
  worker_id       VARCHAR(255) NOT NULL,
  field_name      VARCHAR(50) NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  changed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('work_timestamp_logs', 'changed_at', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_work_timestamp_logs_timestamp_id ON work_timestamp_logs (timestamp_id, changed_at DESC);

-- exchange_rate_history (為替レート履歴)
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          VARCHAR(50) NOT NULL, -- 'coingecko', 'binance', 'kraken'
  crypto          VARCHAR(10) NOT NULL, -- 'XRP', 'BTC', 'ETH'等(ベータ版はXRPのみ)
  fiat            VARCHAR(10) NOT NULL, -- 'USD'(基準通貨)
  rate            DECIMAL(18, 6) NOT NULL,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('exchange_rate_history', 'recorded_at', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rate_crypto ON exchange_rate_history (crypto, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_source ON exchange_rate_history (source, crypto, recorded_at DESC);

-- payment_transactions (支払いトランザクション)
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

-- Convert to hypertable
SELECT create_hypertable('payment_transactions', 'executed_at', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_request_id ON payment_transactions (payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_worker_id ON payment_transactions (worker_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org_id ON payment_transactions (organization_id, executed_at DESC);
