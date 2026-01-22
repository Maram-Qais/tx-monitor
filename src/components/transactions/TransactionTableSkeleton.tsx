import Skeleton from "../ui/Skeleton";

const ROWS = 12;

export default function TransactionTableSkeleton() {
  return (
    <div className="h-[calc(100vh-250px)] overflow-hidden rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700">
      {/* header */}
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

      {/* rows */}
      <div className="p-2">
        <div className="space-y-2">
          {Array.from({ length: ROWS }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-12 items-center gap-3 border-b px-3 py-2 dark:border-slate-800"
            >
              <Skeleton className="col-span-1 h-4 w-6 justify-self-end" />
              <Skeleton className="col-span-3 h-4" />
              <Skeleton className="col-span-2 h-4" />
              <Skeleton className="col-span-1 h-4 w-14 justify-self-end" />
              <Skeleton className="col-span-1 h-4 w-10" />
              <Skeleton className="col-span-1 h-4" />
              <Skeleton className="col-span-1 h-4" />
              <Skeleton className="col-span-1 h-4 w-16" />
              <Skeleton className="col-span-1 h-4 w-10 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
