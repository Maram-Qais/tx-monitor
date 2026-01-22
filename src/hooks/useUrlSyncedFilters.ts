import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { Currency, TxStatus } from "../types/transaction";
import type { FiltersState, RiskLevel } from "../store/transactions/store";
import { useTxStore } from "../store/transactions/store";

const STATUS_VALUES = ["pending", "processing", "completed", "failed"] as const;
const CURRENCY_VALUES = ["USD", "EUR", "IQD", "GBP"] as const;
const RISK_VALUES = ["all", "low", "medium", "high"] as const;

function isTxStatus(v: string): v is TxStatus {
  return (STATUS_VALUES as readonly string[]).includes(v);
}
function isCurrency(v: string): v is Currency {
  return (CURRENCY_VALUES as readonly string[]).includes(v);
}
function isRiskLevel(v: string): v is RiskLevel {
  return (RISK_VALUES as readonly string[]).includes(v);
}

function parseNumber(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseFiltersFromUrl(sp: URLSearchParams): Partial<FiltersState> {
  const amountMin = parseNumber(sp.get("min"));
  const amountMax = parseNumber(sp.get("max"));

  const dateFrom = sp.get("from");
  const dateTo = sp.get("to");

  const statuses = parseList(sp.get("status")).filter(isTxStatus);
  const currencies = parseList(sp.get("ccy")).filter(isCurrency);

  const riskRaw = sp.get("risk");
  const risk: RiskLevel | undefined = riskRaw && isRiskLevel(riskRaw) ? riskRaw : undefined;

  const q = sp.get("q");
  const searchQuery = q ? q : "";

  const partial: Partial<FiltersState> = {};
  if (amountMin !== null) partial.amountMin = amountMin;
  if (amountMax !== null) partial.amountMax = amountMax;

  if (dateFrom) partial.dateFrom = dateFrom;
  if (dateTo) partial.dateTo = dateTo;

  if (statuses.length) partial.statuses = statuses;
  if (currencies.length) partial.currencies = currencies;

  if (risk) partial.risk = risk;

  if (q !== null) partial.searchQuery = searchQuery;

  return partial;
}

function serializeFiltersToUrl(filters: FiltersState): URLSearchParams {
  const sp = new URLSearchParams();

  // Only include non-default values to keep URL clean/shareable
  if (filters.amountMin !== null) sp.set("min", String(filters.amountMin));
  if (filters.amountMax !== null) sp.set("max", String(filters.amountMax));

  if (filters.dateFrom) sp.set("from", filters.dateFrom);
  if (filters.dateTo) sp.set("to", filters.dateTo);

  if (filters.statuses.length) sp.set("status", filters.statuses.join(","));
  if (filters.currencies.length) sp.set("ccy", filters.currencies.join(","));

  if (filters.risk !== "all") sp.set("risk", filters.risk);

  const q = filters.searchQuery.trim();
  if (q) sp.set("q", q);

  return sp;
}

/**
 * URL <-> store sync
 * - On first mount: URL -> store (apply filters from query params)
 * - After that: store -> URL (replaceState)
 */
export function useUrlSyncedFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useTxStore((s) => s.filters);
  const setFilters = useTxStore((s) => s.setFilters);

  // guard (also avoids StrictMode double-effect)
  const didInitRef = useRef(false);

  // 1) URL -> store (once)
  useEffect(() => {
    if (didInitRef.current) return;

    const parsed = parseFiltersFromUrl(searchParams);
    const hasAny = Object.keys(parsed).length > 0;

    if (hasAny) {
      setFilters(parsed);
    }

    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // 2) store -> URL
  const nextParams = useMemo(() => serializeFiltersToUrl(filters), [filters]);

  useEffect(() => {
    if (!didInitRef.current) return;

    const nextStr = nextParams.toString();
    const currStr = searchParams.toString();

    if (nextStr !== currStr) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [nextParams, searchParams, setSearchParams]);
}
