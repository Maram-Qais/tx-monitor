import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTxStore } from "../../store/transactions/store";

const ROW_PX = 48;

export default function TransactionTable() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const ids = useTxStore((s) => s.filteredIds);
  const byId = useTxStore((s) => s.byId);
  const seqById = useTxStore((s) => s.seqById);
  const selectTx = useTxStore((s) => s.selectTx);
  const autoScroll = useTxStore((s) => s.ui.autoScroll);

  //  Fast timestamp formatting (no per-row toLocaleString calls)
  const tsFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    []
  );

  // highlight new rows at TOP
  const prevFirstIdRef = useRef<string | null>(null);
  const [flashIds, setFlashIds] = useState<Record<string, true>>({});

  const rowVirtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_PX,
    overscan: 5, // ✅ lower work
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  /**
   *  Viewport stability when autoScroll is OFF (and user is NOT at top)
   * Instead of O(n) ids.indexOf(...), we use totalSize delta.
   * If the list grows because new rows prepended, totalSize increases.
   */
  const prevTotalSizeRef = useRef(0);
  const prevTopIdForDeltaRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const prevTotal = prevTotalSizeRef.current;
    const nextTotal = totalSize;

    const prevTop = prevTopIdForDeltaRef.current;
    const nextTop = ids[0] ?? null;

    const nearTop = el.scrollTop < 120;

    // Only compensate when:
    // - autoScroll OFF
    // - user is NOT near top (so we don't push them away from latest)
    // - top id changed (likely prepend)
    // - total size grew
    if (!autoScroll && !nearTop && prevTop && nextTop && nextTop !== prevTop) {
      const delta = nextTotal - prevTotal;
      if (delta > 0) el.scrollTop += delta;
    }

    prevTotalSizeRef.current = nextTotal;
    prevTopIdForDeltaRef.current = nextTop;
  }, [autoScroll, ids, totalSize]);

  // Highlight newly prepended rows (new at TOP)
  useEffect(() => {
    const firstId = ids[0] ?? null;
    const prevFirst = prevFirstIdRef.current;

    if (!prevFirst) {
      prevFirstIdRef.current = firstId;
      return;
    }

    if (firstId && firstId !== prevFirst) {
      const newlyAdded: Record<string, true> = {};
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i]!;
        if (id === prevFirst) break;
        newlyAdded[id] = true;
        if (i >= 120) break;
      }

      if (Object.keys(newlyAdded).length) {
        setFlashIds((prev) => ({ ...prev, ...newlyAdded }));
        window.setTimeout(() => {
          setFlashIds((prev) => {
            const copy = { ...prev };
            for (const k of Object.keys(newlyAdded)) delete copy[k];
            return copy;
          });
        }, 1300);
      }
    }

    prevFirstIdRef.current = firstId;
  }, [ids]);

  // Auto-scroll ON => follow TOP (latest) only when user is near TOP
  useEffect(() => {
    if (!autoScroll) return;
    if (!ids.length) return;

    const el = parentRef.current;
    if (!el) return;

    const nearTop = el.scrollTop < 120;
    if (nearTop) rowVirtualizer.scrollToIndex(0, { align: "start" });
  }, [autoScroll, ids.length, ids[0], rowVirtualizer]);

  const header = useMemo(() => {
    return (
      <div className="sticky top-0 z-10 grid grid-cols-12 gap-3 border-b bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
        <div className="col-span-1 text-right">#</div>
        <div className="col-span-3">ID</div>
        <div className="col-span-2">Timestamp</div>
        <div className="col-span-1 text-right">Amount</div>
        <div className="col-span-1">CCY</div>
        <div className="col-span-1">Sender</div>
        <div className="col-span-1">Receiver</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1 text-right">Risk</div>
      </div>
    );
  }, []);

  return (
    <div className="h-[calc(100vh-190px)] overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700">
      {header}

      <div ref={parentRef} className="h-full overflow-auto">
        <div style={{ height: totalSize, position: "relative" }}>
          {virtualItems.map((v) => {
            const id = ids[v.index]!;
            const tx = byId[id];
            if (!tx) return null;

            return (
              <button
                key={id}
                onClick={() => selectTx(id)}
                className="absolute left-0 right-0 text-left"
                style={{ transform: `translateY(${v.start}px)` }}
              >
                <div
                  className={[
                    "grid grid-cols-12 items-center gap-3 border-b px-3 py-2 text-sm",
                    "hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800",
                    flashIds[id] ? "tx-flash" : "",
                  ].join(" ")}
                >
                  <div className="col-span-1 text-right text-xs text-slate-500 dark:text-slate-400">
                    {seqById[id] ?? "-"}
                  </div>

                  <div className="col-span-3 truncate font-mono text-xs text-slate-700 dark:text-slate-200">
                    {tx.id}
                  </div>

                  <div className="col-span-2 truncate text-xs text-slate-600 dark:text-slate-300">
                    {tsFmt.format(tx.timestamp)}
                  </div>

                  <div className="col-span-1 text-right text-xs text-slate-700 dark:text-slate-200">
                    {tx.amount.toFixed(2)}
                  </div>

                  <div className="col-span-1 text-xs text-slate-600 dark:text-slate-300">
                    {tx.currency}
                  </div>

                  <div className="col-span-1 truncate text-xs text-slate-700 dark:text-slate-200">
                    {tx.sender.name}
                  </div>

                  <div className="col-span-1 truncate text-xs text-slate-700 dark:text-slate-200">
                    {tx.receiver.name}
                  </div>

                  <div className="col-span-1 text-xs text-slate-600 dark:text-slate-300">
                    {tx.status}
                  </div>

                  <div className="col-span-1 text-right text-xs text-slate-700 dark:text-slate-200">
                    {tx.riskScore}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {ids.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Waiting for transactions…
          </div>
        ) : null}
      </div>
    </div>
  );
}
