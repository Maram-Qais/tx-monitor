import { create } from "zustand";
import type { Transaction, Currency, TxStatus } from "../../types/transaction";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export type RiskLevel = "all" | "low" | "medium" | "high";

export type FiltersState = {
  amountMin: number | null;
  amountMax: number | null;
  dateFrom: string | null; // YYYY-MM-DD
  dateTo: string | null; // YYYY-MM-DD
  statuses: TxStatus[];
  currencies: Currency[];
  risk: RiskLevel;
  searchQuery: string;
};

type UIState = {
  paused: boolean;
  autoScroll: boolean;
  selectedId: string | null;
  connectionStatus: ConnectionStatus;
  missedCount: number;
};

type TxById = Record<string, Transaction>;

type TxStore = {
  // Data
  byId: TxById;
  orderedIds: string[]; 
  filteredIds: string[]; 

  seqById: Record<string, number>;
  nextSeq: number;

  ui: UIState;
  filters: FiltersState;


  ingestBatch: (batch: Transaction[]) => void;
  recomputeFiltered: () => void;
  setFilters: (partial: Partial<FiltersState>) => void;

  setConnectionStatus: (s: ConnectionStatus) => void;
  addMissed: (count: number) => void;
  resetMissed: () => void;

  togglePaused: () => void;
  setAutoScroll: (v: boolean) => void;
  selectTx: (id: string | null) => void;
  setFlagged: (id: string, flagged: boolean) => void;

};

const MAX_KEEP = 50_000;

const defaultFilters: FiltersState = {
  amountMin: null,
  amountMax: null,
  dateFrom: null,
  dateTo: null,
  statuses: [],
  currencies: [],
  risk: "all",
  searchQuery: "",
};

function riskMatches(level: RiskLevel, score: number) {
  if (level === "all") return true;
  if (level === "low") return score < 34;
  if (level === "medium") return score >= 34 && score < 67;
  return score >= 67;
}

function txMatchesFilters(tx: Transaction, f: FiltersState): boolean {
  if (f.amountMin !== null && tx.amount < f.amountMin) return false;
  if (f.amountMax !== null && tx.amount > f.amountMax) return false;

  if (f.dateFrom) {
    const fromMs = new Date(f.dateFrom + "T00:00:00").getTime();
    if (tx.timestamp.getTime() < fromMs) return false;
  }
  if (f.dateTo) {
    const toMs = new Date(f.dateTo + "T23:59:59").getTime();
    if (tx.timestamp.getTime() > toMs) return false;
  }

  if (f.statuses.length && !f.statuses.includes(tx.status)) return false;
  if (f.currencies.length && !f.currencies.includes(tx.currency)) return false;

  if (!riskMatches(f.risk, tx.riskScore)) return false;

  const q = f.searchQuery.trim().toLowerCase();
  if (q) {
    const hay = [
      tx.id,
      tx.sender.name,
      tx.receiver.name,
      tx.sender.id,
      tx.receiver.id,
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export const useTxStore = create<TxStore>((set, get) => ({
  byId: {},
  orderedIds: [],
  filteredIds: [],

  seqById: {},
  nextSeq: 1,

ui: {
  paused: false,
  autoScroll: false,
  selectedId: null,
  connectionStatus: "connecting",
  missedCount: 0,
},


  filters: defaultFilters,

  ingestBatch: (batch) => {
    if (!batch.length) return;

    set((state) => {
      const byId: TxById = { ...state.byId };
      const seqById = { ...state.seqById };
      let nextSeq = state.nextSeq;

      const newIds: string[] = [];

      for (const tx of batch) {
        byId[tx.id] = tx;
        newIds.push(tx.id);

        if (seqById[tx.id] === undefined) {
          seqById[tx.id] = nextSeq;
          nextSeq += 1;
        }
      }

      const orderedIds = [...newIds, ...state.orderedIds].slice(0, MAX_KEEP);

      const matchedNew = newIds.filter((id) =>
        txMatchesFilters(byId[id], state.filters)
      );
      const filteredIds = [...matchedNew, ...state.filteredIds].slice(0, MAX_KEEP);

      return { byId, seqById, nextSeq, orderedIds, filteredIds };
    });
  },

  recomputeFiltered: () => {
    const { orderedIds, byId, filters } = get();
    const filteredIds = orderedIds.filter((id) => txMatchesFilters(byId[id], filters));
    set({ filteredIds });
  },

  setFilters: (partial) => {
    set((state) => ({ filters: { ...state.filters, ...partial } }));
    get().recomputeFiltered();
  },

  setConnectionStatus: (s) =>
    set((state) => ({ ui: { ...state.ui, connectionStatus: s } })),

  addMissed: (count) =>
    set((state) => ({
      ui: { ...state.ui, missedCount: state.ui.missedCount + count },
    })),

  resetMissed: () => set((state) => ({ ui: { ...state.ui, missedCount: 0 } })),

  togglePaused: () =>
    set((state) => ({ ui: { ...state.ui, paused: !state.ui.paused } })),

  setAutoScroll: (v) => set((state) => ({ ui: { ...state.ui, autoScroll: v } })),

  selectTx: (id) => set((state) => ({ ui: { ...state.ui, selectedId: id } })),
  setFlagged: (id, flagged) =>
  set((state) => {
    const existing = state.byId[id];
    if (!existing) return state;
    return {
      byId: {
        ...state.byId,
        [id]: { ...existing, flagged },
      },
    };
  }),

}));
