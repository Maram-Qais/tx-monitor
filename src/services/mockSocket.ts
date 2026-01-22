import type { Transaction } from "../types/transaction";

type MessageHandler = (tx: Transaction) => void;
type DisconnectInfo = { missed: number };
type DisconnectHandler = (info: DisconnectInfo) => void;

export interface MockSocket {
  connect: () => void;
  disconnect: () => void;
  onMessage: (cb: MessageHandler) => () => void;
  onDisconnect: (cb: DisconnectHandler) => () => void;
  isConnected: () => boolean;
}

const CURRENCIES = ["USD", "EUR", "IQD", "GBP"] as const;
const STATUSES = ["pending", "processing", "completed", "failed"] as const;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

function makeName() {
  const first = ["Ali", "Sara", "Omar", "Noor", "Hassan", "Zainab", "Yusuf", "Mariam"];
  const last = ["Kareem", "Ahmed", "Hadi", "Saleh", "Hussein", "Jabbar", "Younis", "Naji"];
  return `${pick(first)} ${pick(last)}`;
}

function makeParty() {
  return { id: crypto.randomUUID().slice(0, 8), name: makeName() };
}

function generateTransaction(): Transaction {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    amount: Math.round((Math.random() * 10_000 + 5) * 100) / 100,
    currency: pick(CURRENCIES),
    sender: makeParty(),
    receiver: makeParty(),
    status: pick(STATUSES),
    riskScore: randInt(0, 100),
    flagged: false,
  };
}

export function createMockSocket(): MockSocket {
  let connected = false;

  let msgHandlers: MessageHandler[] = [];
  let disconnectHandlers: DisconnectHandler[] = [];

  let burstTimeoutId: number | null = null;
  let chaosIntervalId: number | null = null;

  // track scheduled tx timeouts -> if we disconnect before they fire, they're "missed"
  const pendingTxTimeouts = new Set<number>();

  const emitMessage = (tx: Transaction) => msgHandlers.forEach((h) => h(tx));
  const emitDisconnect = (info: DisconnectInfo) => disconnectHandlers.forEach((h) => h(info));

  const clearPendingTxTimeouts = () => {
    for (const id of pendingTxTimeouts) window.clearTimeout(id);
    const missed = pendingTxTimeouts.size;
    pendingTxTimeouts.clear();
    return missed;
  };

  const clearTimers = () => {
    if (burstTimeoutId !== null) window.clearTimeout(burstTimeoutId);
    if (chaosIntervalId !== null) window.clearInterval(chaosIntervalId);
    burstTimeoutId = null;
    chaosIntervalId = null;
  };

  const scheduleNextBurst = () => {
    if (!connected) return;

    const delay = randInt(2000, 3000); 
    burstTimeoutId = window.setTimeout(() => {
      if (!connected) return;

      const burstSize = randInt(50, 100);

      for (let i = 0; i < burstSize; i++) {
        const latencyMs = randInt(10, 250);
        const timeoutId = window.setTimeout(() => {
          pendingTxTimeouts.delete(timeoutId);
          if (!connected) return;
          emitMessage(generateTransaction());
        }, latencyMs);

        pendingTxTimeouts.add(timeoutId);
      }

      scheduleNextBurst();
    }, delay);
  };

  const startChaosDisconnects = () => {
    chaosIntervalId = window.setInterval(() => {
      if (!connected) return;

      const shouldDisconnect = Math.random() < 0.08;
      if (shouldDisconnect) {
        connected = false;
        clearTimers();
        const missed = clearPendingTxTimeouts();
        emitDisconnect({ missed });
      }
    }, 3000);
  };

  const connect = () => {
    if (connected) return;
    connected = true;
    scheduleNextBurst();
    startChaosDisconnects();
  };

  const disconnect = () => {
    if (!connected) return;
    connected = false;
    clearTimers();
    const missed = clearPendingTxTimeouts();
    emitDisconnect({ missed });
  };

  const onMessage = (cb: MessageHandler) => {
    msgHandlers.push(cb);
    return () => {
      msgHandlers = msgHandlers.filter((x) => x !== cb);
    };
  };

  const onDisconnect = (cb: DisconnectHandler) => {
    disconnectHandlers.push(cb);
    return () => {
      disconnectHandlers = disconnectHandlers.filter((x) => x !== cb);
    };
  };

  const isConnected = () => connected;

  return { connect, disconnect, onMessage, onDisconnect, isConnected };
}
