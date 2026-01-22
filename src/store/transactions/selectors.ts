import { useTxStore } from "./store";

export const useUI = () => useTxStore((s) => s.ui);
export const useConnectionStatus = () => useTxStore((s) => s.ui.connectionStatus);
export const useMissedCount = () => useTxStore((s) => s.ui.missedCount);
export const usePaused = () => useTxStore((s) => s.ui.paused);
export const useAutoScroll = () => useTxStore((s) => s.ui.autoScroll);

export const useFilters = () => useTxStore((s) => s.filters);
export const useFilteredIds = () => useTxStore((s) => s.filteredIds);
export const useById = () => useTxStore((s) => s.byId);
