#!/bin/bash

# TimescaleDB初期化スクリプト実行

set -e

echo "TimescaleDBの初期化を開始します..."

# 環境変数の確認
if [ -z "$TIMESCALE_URL" ]; then
  echo "エラー: TIMESCALE_URL環境変数が設定されていません"
  exit 1
fi

# SQLスクリプトの実行
psql "$TIMESCALE_URL" -f "$(dirname "$0")/init-timescaledb.sql"

echo "TimescaleDBの初期化が完了しました"
