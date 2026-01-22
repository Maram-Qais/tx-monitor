import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTxStore } from "../../store/transactions/store";

function formatTimestamp(d: Date) {
  return d.toLocaleString();
}

type Anchor = { id: string; offset: number } | null;

export default function TransactionTable() {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const ids = useTxStore((s) => s.filteredIds);
  const byId = useTxStore((s) => s.byId);
  const seqById = useTxStore((s) => s.seqById);
  const selectTx = useTxStore((s) => s.selectTx);
  const autoScroll = useTxStore((s) => s.ui.autoScroll);
  const prevFirstIdRef = useRef<string | null>(null);
  const [flashIds, setFlashIds] = useState<Record<string, true>>({});
  const anchorRef = useRef<Anchor>(null);

  const rowVirtualizer = useVirtualizer({

    count: ids.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  useLayoutEffect(() => {
    if (autoScroll) return;
    const el = parentRef.current;
    if (!el) return;

    const anchor = anchorRef.current;
    if (!anchor) return;

    const idx = ids.indexOf(anchor.id);
    if (idx === -1) return;

    rowVirtualizer.scrollToIndex(idx, { align: "start" });
    el.scrollTop = el.scrollTop + anchor.offset;
  }, [ids, autoScroll, rowVirtualizer]);

  useLayoutEffect(() => {
    if (autoScroll) return;
    const el = parentRef.current;
    if (!el) return;
    if (!virtualItems.length) return;

    const first = virtualItems[0];
    const id = ids[first.index];
    if (!id) return;

    anchorRef.current = { id, offset: el.scrollTop - first.start };
  }, [autoScroll, ids, virtualItems]);

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

  useEffect(() => {
    if (!autoScroll) return;
    if (!ids.length) return;

    const el = parentRef.current;
    if (!el) return;

    const nearTop = el.scrollTop < 120;
    if (nearTop) {
      rowVirtualizer.scrollToIndex(0, { align: "start" });
    }
  }, [autoScroll, ids[0], ids.length, rowVirtualizer]);

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
                    {formatTimestamp(tx.timestamp)}
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
