import { useEffect, useMemo, useRef } from "react";
import { useEffectEvent } from "react";
import { createMockSocket } from "../services/mockSocket";
import type { Transaction } from "../types/transaction";
import { useTxStore } from "../store/transactions/store";

const FLUSH_MS = 80;
const MAX_BUFFER = 5000;

export function useTransactionStream() {
  const socket = useMemo(() => createMockSocket(), []);

  const ingestBatch = useTxStore((s) => s.ingestBatch);
  const setConnectionStatus = useTxStore((s) => s.setConnectionStatus);
  const addMissed = useTxStore((s) => s.addMissed);
  const paused = useTxStore((s) => s.ui.paused);

  const bufferRef = useRef<Transaction[]>([]);
  const flushTimerRef = useRef<number | null>(null);

  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  const onMessage = useEffectEvent((tx: Transaction) => {
    bufferRef.current.push(tx);

    // cap buffer while paused to avoid memory blowups
    if (bufferRef.current.length > MAX_BUFFER) {
      const overflow = bufferRef.current.length - MAX_BUFFER;
      bufferRef.current.splice(0, overflow); // drop oldest
      addMissed(overflow);
    }
  });

  const flushBuffer = useEffectEvent(() => {
    if (paused) return;
    if (!bufferRef.current.length) return;

    const batch = bufferRef.current;
    bufferRef.current = [];
    ingestBatch(batch);
  });

  const clearReconnectTimer = useEffectEvent(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  });

  const scheduleReconnect = useEffectEvent(() => {
    clearReconnectTimer();

    reconnectAttemptRef.current += 1;
    setConnectionStatus("reconnecting");

    const backoffMs = Math.min(1000 * reconnectAttemptRef.current, 5000);

    reconnectTimerRef.current = window.setTimeout(() => {
      socket.connect();
      reconnectAttemptRef.current = 0;
      setConnectionStatus("connected");
      reconnectTimerRef.current = null;
    }, backoffMs);
  });

  useEffect(() => {
    setConnectionStatus("connecting");
    socket.connect();
    setConnectionStatus("connected");
    reconnectAttemptRef.current = 0;

    const offMsg = socket.onMessage((tx) => onMessage(tx));

    const offDisconnect = socket.onDisconnect((info) => {
      setConnectionStatus("disconnected");
      if (info.missed > 0) addMissed(info.missed);
      scheduleReconnect();
    });

    flushTimerRef.current = window.setInterval(() => {
      flushBuffer();
    }, FLUSH_MS);

    return () => {
      offMsg();
      offDisconnect();
      clearReconnectTimer();

      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;

      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);
}
