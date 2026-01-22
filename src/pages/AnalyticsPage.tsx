import { useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "../components/layout/header/PageHeader";
import { useTxStore } from "../store/transactions/store";
import type { Currency, TxStatus, Transaction } from "../types/transaction";
import AnalyticsSkeleton from "../components/analytics/AnalyticsSkeleton";

type MinutePoint = { minute: string; count: number };
type StatusPoint = { status: TxStatus; count: number };
type CurrencyPoint = { currency: Currency; volume: number };

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

export default function AnalyticsPage() {
  const orderedIds = useTxStore((s) => s.orderedIds);
  const byId = useTxStore((s) => s.byId);
  const hasData = orderedIds.length > 0;


  const data = useMemo(() => {
    const now = Date.now();
    const windowMs = 30 * 60 * 1000;
    const cutoff = now - windowMs;

    // buckets (30 minutes)
    const perMinute: MinutePoint[] = Array.from({ length: 30 }, (_, i) => {
      const t = cutoff + (i + 1) * 60_000;
      const label = new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return { minute: label, count: 0 };
    });

    const statusCounts: Record<TxStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    const currencyVolume: Record<Currency, number> = {
      USD: 0,
      EUR: 0,
      IQD: 0,
      GBP: 0,
    };

    let txCount = 0;
    let totalVolume = 0;
    let flaggedCount = 0;

    let procSumMs = 0;
    let procN = 0;

    for (const id of orderedIds) {
      const tx: Transaction | undefined = byId[id];
      if (!tx) continue;

      const t = tx.timestamp.getTime();
      if (t < cutoff) break; // orderedIds is newest-first, so we can stop early

      txCount += 1;
      totalVolume += tx.amount;
      if (tx.flagged) flaggedCount += 1;

      statusCounts[tx.status] += 1;
      currencyVolume[tx.currency] += tx.amount;

      // per-minute bucket
      const idx = Math.floor((t - cutoff) / 60_000);
      if (idx >= 0 && idx < 30) perMinute[idx].count += 1;

      // "avg processing time" approximation (mock): time since created for completed/failed
      if (tx.status === "completed" || tx.status === "failed") {
        procSumMs += now - t;
        procN += 1;
      }
    }

    const statusPie: StatusPoint[] = (Object.keys(statusCounts) as TxStatus[]).map((k) => ({
      status: k,
      count: statusCounts[k],
    }));

    const currencyBar: CurrencyPoint[] = (Object.keys(currencyVolume) as Currency[]).map((k) => ({
      currency: k,
      volume: Math.round(currencyVolume[k] * 100) / 100,
    }));

    const avgProcessingMs = procN ? procSumMs / procN : 0;

    return {
      perMinute,
      statusPie,
      currencyBar,
      summary: {
        txCount,
        totalVolume: Math.round(totalVolume * 100) / 100,
        flaggedCount,
        avgProcessingMs,
      },
    };
  }, [orderedIds, byId]);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Analytics"
        subtitle="Real-time metrics (last 30 minutes)"
      />
{!hasData ? (
  <AnalyticsSkeleton />
) : (
      <div className="p-5 space-y-5">
        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Transaction count</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {data.summary.txCount}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Total volume</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {data.summary.totalVolume.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Flagged count</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {data.summary.flaggedCount}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg processing time</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {formatMs(data.summary.avgProcessingMs)}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Line: tx/min */}
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              Transactions per minute (last 30 minutes)
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.perMinute}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="minute" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie: status distribution */}
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              Status distribution
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={data.statusPie}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={110}
                    label
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar: volume by currency */}
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
            <div className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
              Volume by currency
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.currencyBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="currency" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Note: analytics uses a 30-minute rolling window to match the chart spec.
        </div>
      </div>
     )}
    </div>
  );
}