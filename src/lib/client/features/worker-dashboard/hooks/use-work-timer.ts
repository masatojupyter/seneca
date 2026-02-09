'use client';

import { useState, useEffect, useMemo } from 'react';
import type { TimestampData } from '../action/timestamp-actions';

type TimerState = 'IDLE' | 'WORKING' | 'RESTING';

type WorkTimerReturn = {
  state: TimerState;
  formattedTime: string;
};

const TIMER_INTERVAL = 1000;

/**
 * サーバーの打刻データに基づくリアルタイムタイマーフック
 *
 * 直近の打刻ステータスから現在の状態と経過時間を算出
 */
export function useWorkTimer(timestamps: TimestampData[]): WorkTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const lastTimestamp = useMemo(() => getLastTimestamp(timestamps), [timestamps]);

  const state: TimerState = useMemo(() => {
    if (!lastTimestamp) return 'IDLE';
    if (lastTimestamp.status === 'WORK') return 'WORKING';
    if (lastTimestamp.status === 'REST') return 'RESTING';
    return 'IDLE';
  }, [lastTimestamp]);

  const startTimeMs = useMemo(() => {
    if (!lastTimestamp || state === 'IDLE') return null;
    return new Date(lastTimestamp.timestamp).getTime();
  }, [lastTimestamp, state]);

  useEffect(() => {
    if (startTimeMs === null) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = (): void => {
      const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, TIMER_INTERVAL);

    return () => clearInterval(interval);
  }, [startTimeMs]);

  return {
    state,
    formattedTime: formatSeconds(elapsedSeconds),
  };
}

function getLastTimestamp(timestamps: TimestampData[]): TimestampData | null {
  if (timestamps.length === 0) return null;

  const sorted = [...timestamps].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sorted[0];
}

/**
 * 秒数をHH:MM:SS形式にフォーマット
 */
function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((val) => val.toString().padStart(2, '0'))
    .join(':');
}
