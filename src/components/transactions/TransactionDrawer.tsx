import { useEffect, useMemo, useOptimistic } from "react";
import { useFormStatus } from "react-dom";
import { useTxStore } from "../../store/transactions/store";
import type { TxStatus } from "../../types/transaction";
import { flagTransaction } from "../../services/flagTransaction";

function fmt(d: Date) {
  return d.toLocaleString();
}

type StepState = "done" | "current" | "todo";
type Step = { label: string; state: StepState };

function buildTimeline(status: TxStatus): Step[] {
  if (status === "pending") {
    return [
      { label: "Created", state: "current" },
      { label: "Processing", state: "todo" },
      { label: "Completed / Failed", state: "todo" },
    ];
  }
  if (status === "processing") {
    return [
      { label: "Created", state: "done" },
      { label: "Processing", state: "current" },
      { label: "Completed / Failed", state: "todo" },
    ];
  }
  return [
    { label: "Created", state: "done" },
    { label: "Processing", state: "done" },
    { label: status === "failed" ? "Failed" : "Completed", state: "current" },
  ];
}

function StepDot({ state }: { state: StepState }) {
  const cls =
    state === "done"
      ? "bg-slate-900 dark:bg-slate-100"
      : state === "current"
      ? "bg-slate-500 dark:bg-slate-400"
      : "bg-slate-200 dark:bg-slate-800";
  return <span className={`h-2.5 w-2.5 rounded-full ${cls}`} />;
}

function StepLine({ done }: { done: boolean }) {
  return <span className={`h-0.5 flex-1 ${done ? "bg-slate-900 dark:bg-slate-100" : "bg-slate-200 dark:bg-slate-800"}`} />;
}

function FlagSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={[
        "w-full rounded-lg px-3 py-2 text-sm font-medium transition",
        disabled || pending
          ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          : "bg-amber-500 text-slate-950 hover:bg-amber-400",
      ].join(" ")}
    >
      {pending ? "Flagging…" : disabled ? "Flagged" : "Flag as Suspicious"}
    </button>
  );
}

export default function TransactionDrawer() {
  const selectedId = useTxStore((s) => s.ui.selectedId);
  const byId = useTxStore((s) => s.byId);
  const selectTx = useTxStore((s) => s.selectTx);
  const setFlagged = useTxStore((s) => s.setFlagged);

  const tx = selectedId ? byId[selectedId] : null;

  const steps = useMemo(() => (tx ? buildTimeline(tx.status) : []), [tx]);

  const baseFlagged = tx?.flagged ?? false;
  const [optimisticFlagged, setOptimisticFlagged] = useOptimistic(
    baseFlagged,
    (_current, next: boolean) => next
  );

  async function flagAction() {
    if (!tx) return;
    if (tx.flagged) return;

    setOptimisticFlagged(true);

    try {
      await flagTransaction(tx.id);
      setFlagged(tx.id, true);
    } catch {
      setOptimisticFlagged(false);
    }
  }

  useEffect(() => {
    if (!selectedId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || target?.isContentEditable;

      if (isTyping) return;

      if (e.key === "Escape") selectTx(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, selectTx]);

  if (!selectedId) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close transaction details"
        className="absolute inset-0 bg-black/40"
        onClick={() => selectTx(null)}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l bg-white shadow-xl dark:bg-slate-950 dark:border-slate-800">
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Transaction Details
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Timeline + Flag Action
            </div>
          </div>

          <button
            type="button"
            onClick={() => selectTx(null)}
            className="rounded-lg border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!tx ? (
            <div className="rounded-lg border p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
              Transaction not found (may have been evicted).
            </div>
          ) : (
            <>
              {/* Timeline */}
              <div className="rounded-xl border p-3 dark:border-slate-800">
                <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Timeline
                </div>

                <div className="flex items-center gap-2">
                  {steps.map((s, i) => (
                    <div key={s.label} className="flex flex-1 items-center gap-2">
                      <div className="flex items-center gap-2">
                        <StepDot state={s.state} />
                        <div
                          className={[
                            "text-xs",
                            s.state === "current"
                              ? "text-slate-900 dark:text-slate-100 font-medium"
                              : "text-slate-600 dark:text-slate-300",
                          ].join(" ")}
                        >
                          {s.label}
                        </div>
                      </div>

                      {i !== steps.length - 1 ? (
                        <StepLine done={steps[i].state === "done"} />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-3 dark:border-slate-800">
                <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Actions
                </div>

                <form action={flagAction}>
                  <FlagSubmitButton disabled={optimisticFlagged} />
                </form>

                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Flagged: <span className="font-medium">{optimisticFlagged ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="rounded-xl border p-3 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">ID</div>
                <div className="mt-1 break-all font-mono text-xs text-slate-900 dark:text-slate-100">
                  {tx.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Timestamp</div>
                  <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {fmt(tx.timestamp)}
                  </div>
                </div>

                <div className="rounded-xl border p-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Amount</div>
                  <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {tx.amount.toFixed(2)} {tx.currency}
                  </div>
                </div>

                <div className="rounded-xl border p-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Status</div>
                  <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {tx.status}
                  </div>
                </div>

                <div className="rounded-xl border p-3 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Risk</div>
                  <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {tx.riskScore}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-3 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Sender</div>
                <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {tx.sender.name}{" "}
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    ({tx.sender.id})
                  </span>
                </div>
              </div>

              <div className="rounded-xl border p-3 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Receiver</div>
                <div className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                  {tx.receiver.name}{" "}
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    ({tx.receiver.id})
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
