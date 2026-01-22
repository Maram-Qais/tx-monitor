import { Activity } from "react";
import PageHeader from "../components/layout/header/PageHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import TransactionTable from "../components/transactions/TransactionTable";
import FiltersBar from "../components/transactions/FiltersBar";
import { useTransactionStream } from "../hooks/useTransactionStream";
import { useTxStore } from "../store/transactions/store";
import { useUrlSyncedFilters } from "../hooks/useUrlSyncedFilters";
import TransactionDrawer from "../components/transactions/TransactionDrawer";
import TransactionTableSkeleton from "../components/transactions/TransactionTableSkeleton";

export default function MonitorPage() {
  useUrlSyncedFilters();
  useTransactionStream();

  const status = useTxStore((s) => s.ui.connectionStatus);
  const missed = useTxStore((s) => s.ui.missedCount);

  const paused = useTxStore((s) => s.ui.paused);
  const togglePaused = useTxStore((s) => s.togglePaused);

  const autoScroll = useTxStore((s) => s.ui.autoScroll);
  const setAutoScroll = useTxStore((s) => s.setAutoScroll);
  const hasData = useTxStore((s) => s.orderedIds.length > 0);


  return (
    <div className="min-h-full">
      <PageHeader
        title="Real-Time Transaction Monitor"
        subtitle="Live feed + filtering (presets next)"
        right={
          <>
            <Badge>WS: {status}</Badge>
            {missed > 0 ? <Badge>Missed: {missed}</Badge> : null}

            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>

            <Button onClick={togglePaused} variant="outline">
              {paused ? "Resume" : "Pause"}
            </Button>
          </>
        }
      />

      <div className="p-5 space-y-3">
  <FiltersBar />

 <Activity mode={paused ? "hidden" : "visible"}>
  {hasData ? <TransactionTable /> : <TransactionTableSkeleton />}
</Activity>
  <TransactionDrawer />

  {paused ? (
    <div className="rounded-xl border bg-white p-4 text-sm text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
      Stream paused
    </div>
  ) : null}
</div>

    </div>
  );
}
