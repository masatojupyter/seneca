-- ============================================
-- Migration: 001_add_work_sessions
-- Description: WorkSession テーブルと関連機能の追加
-- Date: 2024-01-27
-- ============================================

-- ============================================
-- WorkSession テーブル
-- WORK_START から WORK_END までを1セッションとして管理
-- ============================================
CREATE TABLE IF NOT EXISTS work_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       VARCHAR(255) NOT NULL,
  work_start_id   UUID NOT NULL,           -- 最初の WORK_START 打刻ID
  work_end_id     UUID,                    -- WORK_END 打刻ID（未完結時はNULL）
  start_at        TIMESTAMPTZ NOT NULL,    -- セッション開始時刻
  end_at          TIMESTAMPTZ,             -- セッション終了時刻（未完結時はNULL）
  work_minutes    INT DEFAULT 0,           -- 実働時間（分）
  rest_minutes    INT DEFAULT 0,           -- 休憩時間（分）
  status          VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'COMPLETED', 'PENDING', 'APPROVED', 'REJECTED', 'REQUESTED', 'PAID'
  application_id  VARCHAR(255),            -- 紐づくTimeApplication.id（申請後に設定）
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('work_sessions', 'start_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_work_sessions_worker ON work_sessions (worker_id, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_status ON work_sessions (status, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_sessions_application ON work_sessions (application_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_work_start ON work_sessions (work_start_id);

-- ============================================
-- WorkSession と Timestamp の中間テーブル
-- セッションに属する全打刻を管理
-- ============================================
CREATE TABLE IF NOT EXISTS work_session_timestamps (
  session_id      UUID NOT NULL,
  timestamp_id    UUID NOT NULL,
  sequence_order  INT NOT NULL,            -- セッション内の順序（1から開始）
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, timestamp_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_session_timestamps_session ON work_session_timestamps (session_id);
CREATE INDEX IF NOT EXISTS idx_session_timestamps_timestamp ON work_session_timestamps (timestamp_id);

-- ============================================
-- WorkSession ログテーブル
-- セッションの状態変更履歴を記録
-- ============================================
CREATE TABLE IF NOT EXISTS work_session_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL,
  worker_id       VARCHAR(255) NOT NULL,
  action          VARCHAR(20) NOT NULL,    -- 'CREATED', 'COMPLETED', 'REOPENED', 'SUBMITTED', 'APPROVED', 'REJECTED'
  work_minutes    INT,
  rest_minutes    INT,
  previous_status VARCHAR(20),
  new_status      VARCHAR(20),
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('work_session_logs', 'created_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_work_session_logs_session ON work_session_logs (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_session_logs_worker ON work_session_logs (worker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_session_logs_action ON work_session_logs (action, created_at DESC);

-- ============================================
-- 承認後の打刻編集制限トリガー
-- application_status が 'APPROVED', 'REQUESTED', 'PAID' の打刻は編集不可
-- ============================================
CREATE OR REPLACE FUNCTION check_timestamp_editable()
RETURNS TRIGGER AS $$
BEGIN
  -- 削除操作の場合
  IF TG_OP = 'DELETE' THEN
    IF OLD.application_status IN ('APPROVED', 'REQUESTED', 'PAID') THEN
      RAISE EXCEPTION 'Cannot delete timestamp with application_status: %. Approved timestamps are immutable.', OLD.application_status;
    END IF;
    RETURN OLD;
  END IF;

  -- 更新操作の場合
  IF TG_OP = 'UPDATE' THEN
    -- application_status の変更は許可（システムによる状態遷移のため）
    IF OLD.application_status IN ('APPROVED', 'REQUESTED', 'PAID') THEN
      -- application_status 以外のフィールドが変更されていないかチェック
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

-- トリガー作成（既存の場合は置換）
DROP TRIGGER IF EXISTS prevent_approved_timestamp_edit ON work_timestamps;
CREATE TRIGGER prevent_approved_timestamp_edit
  BEFORE UPDATE OR DELETE ON work_timestamps
  FOR EACH ROW
  EXECUTE FUNCTION check_timestamp_editable();

-- ============================================
-- 支払いハッシュログテーブル
-- XRPLトランザクションに記録するハッシュの検証用
-- ============================================
CREATE TABLE IF NOT EXISTS payment_hash_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id  VARCHAR(255) NOT NULL,
  data_hash           VARCHAR(64) NOT NULL,    -- SHA-256 ハッシュ（64文字）
  canonical_data      JSONB NOT NULL,          -- 正規化されたデータ（検証用）
  transaction_hash    VARCHAR(255),            -- XRPLトランザクションハッシュ
  verified_at         TIMESTAMPTZ,             -- 検証日時
  verification_result BOOLEAN,                 -- 検証結果
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Hypertableへ変換
SELECT create_hypertable('payment_hash_logs', 'created_at', if_not_exists => TRUE);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_payment_hash_payment ON payment_hash_logs (payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_hash_tx ON payment_hash_logs (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_payment_hash_hash ON payment_hash_logs (data_hash);

-- ============================================
-- 完了メッセージ
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_add_work_sessions completed successfully';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - work_sessions (Hypertable)';
  RAISE NOTICE '  - work_session_timestamps';
  RAISE NOTICE '  - work_session_logs (Hypertable)';
  RAISE NOTICE '  - payment_hash_logs (Hypertable)';
  RAISE NOTICE 'Created trigger:';
  RAISE NOTICE '  - prevent_approved_timestamp_edit on work_timestamps';
END $$;
