import { useEffect, useMemo, useRef, useState } from "react";
import type { Currency, TxStatus } from "../../types/transaction";
import type { RiskLevel } from "../../store/transactions/store";
import { useTxStore } from "../../store/transactions/store";
import Button from "../ui/Button";
import { deletePreset, loadPresets, savePreset, type FilterPreset } from "../../services/filterPresets";

const STATUSES: TxStatus[] = ["pending", "processing", "completed", "failed"];
const CURRENCIES: Currency[] = ["USD", "EUR", "IQD", "GBP"];
const RISKS: RiskLevel[] = ["all", "low", "medium", "high"];

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function toNumberOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function FiltersBar() {
  const filters = useTxStore((s) => s.filters);
  const setFilters = useTxStore((s) => s.setFilters);

  const [minText, setMinText] = useState(filters.amountMin?.toString() ?? "");
  const [maxText, setMaxText] = useState(filters.amountMax?.toString() ?? "");

  const [searchText, setSearchText] = useState(filters.searchQuery ?? "");
  const debounceRef = useRef<number | null>(null);

  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [presetName, setPresetName] = useState("");

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  useEffect(() => setMinText(filters.amountMin?.toString() ?? ""), [filters.amountMin]);
  useEffect(() => setMaxText(filters.amountMax?.toString() ?? ""), [filters.amountMax]);
  useEffect(() => setSearchText(filters.searchQuery ?? ""), [filters.searchQuery]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      setFilters({ searchQuery: searchText });
      debounceRef.current = null;
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.amountMin !== null) n++;
    if (filters.amountMax !== null) n++;
    if (filters.dateFrom) n++;
    if (filters.dateTo) n++;
    if (filters.statuses.length) n++;
    if (filters.currencies.length) n++;
    if (filters.risk !== "all") n++;
    if (filters.searchQuery.trim()) n++;
    return n;
  }, [filters]);

  const applyAmount = () => {
    setFilters({
      amountMin: toNumberOrNull(minText),
      amountMax: toNumberOrNull(maxText),
    });
  };

  const clearAll = () => {
    setFilters({
      amountMin: null,
      amountMax: null,
      dateFrom: null,
      dateTo: null,
      statuses: [],
      currencies: [],
      risk: "all",
      searchQuery: "",
    });
  };

  const onApplyPreset = (id: string) => {
    setSelectedPresetId(id);
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setFilters(p.filters); 
  };

  const onSavePreset = () => {
    const next = savePreset(presetName, filters);
    setPresets(next);
    setPresetName("");
    setSelectedPresetId(next[0]?.id ?? "");
  };

  const onDeletePreset = () => {
    if (!selectedPresetId) return;
    const next = deletePreset(selectedPresetId);
    setPresets(next);
    setSelectedPresetId("");
  };

  return (
    <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex flex-col gap-3">
        {/* Presets row */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Presets
            </label>
            <div className="flex gap-2">
              <select
                value={selectedPresetId}
                onChange={(e) => onApplyPreset(e.target.value)}
                className="h-10 w-full min-w-[240px] rounded-lg border bg-white px-2 text-sm text-slate-900 outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              >
                <option value="">— Select preset —</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <Button variant="outline" onClick={onDeletePreset} disabled={!selectedPresetId}>
                Delete
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1 lg:w-[420px]">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Save current filters as preset
            </label>
            <div className="flex gap-2">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. High risk USD failures"
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
              <Button onClick={onSavePreset} disabled={!presetName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Amount min</label>
              <input
                value={minText}
                onChange={(e) => setMinText(e.target.value)}
                onBlur={applyAmount}
                inputMode="decimal"
                placeholder="e.g. 100"
                className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Amount max</label>
              <input
                value={maxText}
                onChange={(e) => setMaxText(e.target.value)}
                onBlur={applyAmount}
                inputMode="decimal"
                placeholder="e.g. 5000"
                className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Date from</label>
              <input
                type="date"
                value={filters.dateFrom ?? ""}
                onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
                className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Date to</label>
              <input
                type="date"
                value={filters.dateTo ?? ""}
                onChange={(e) => setFilters({ dateTo: e.target.value || null })}
                className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 lg:w-[360px]">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Search (ID / sender / receiver)
            </label>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search transactions…"
              className="h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Status:</span>
              {STATUSES.map((st) => {
                const active = filters.statuses.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilters({ statuses: toggleInList(filters.statuses, st) })}
                    className={[
                      "h-8 rounded-full border px-3 text-xs transition",
                      active
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Currency:</span>
              {CURRENCIES.map((ccy) => {
                const active = filters.currencies.includes(ccy);
                return (
                  <button
                    key={ccy}
                    type="button"
                    onClick={() => setFilters({ currencies: toggleInList(filters.currencies, ccy) })}
                    className={[
                      "h-8 rounded-full border px-3 text-xs transition",
                      active
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {ccy}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Risk:</span>
              <select
                value={filters.risk}
                onChange={(e) => setFilters({ risk: e.target.value as RiskLevel })}
                className="h-9 rounded-lg border bg-white px-2 text-sm text-slate-900 outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
              >
                {RISKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Active filters: {activeCount}
            </div>
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
