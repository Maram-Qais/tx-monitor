import type { FiltersState } from "../store/transactions/store";

export type FilterPreset = {
  id: string;
  name: string;
  filters: FiltersState;
  createdAt: number;
};

const KEY = "txmonitor.filterPresets.v1";

function safeParse(json: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isNumberOrNull(v: unknown): v is number | null {
  return v === null || (typeof v === "number" && Number.isFinite(v));
}

function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function isFiltersState(v: unknown): v is FiltersState {
  if (!isRecord(v)) return false;

  return (
    isNumberOrNull(v.amountMin) &&
    isNumberOrNull(v.amountMax) &&
    isStringOrNull(v.dateFrom) &&
    isStringOrNull(v.dateTo) &&
    isStringArray(v.statuses) &&
    isStringArray(v.currencies) &&
    (v.risk === "all" ||
      v.risk === "low" ||
      v.risk === "medium" ||
      v.risk === "high") &&
    typeof v.searchQuery === "string"
  );
}

function isPreset(x: unknown): x is FilterPreset {
  if (!isRecord(x)) return false;

  return (
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    typeof x.createdAt === "number" &&
    Number.isFinite(x.createdAt) &&
    isFiltersState(x.filters)
  );
}

export function loadPresets(): FilterPreset[] {
  const raw = safeParse(localStorage.getItem(KEY));
  if (!Array.isArray(raw)) return [];
  return raw.filter(isPreset).sort((a, b) => b.createdAt - a.createdAt);
}

export function savePreset(name: string, filters: FiltersState): FilterPreset[] {
  const trimmed = name.trim();
  if (!trimmed) return loadPresets();

  const preset: FilterPreset = {
    id: crypto?.randomUUID?.() ?? String(Date.now()),
    name: trimmed,
    filters,
    createdAt: Date.now(),
  };

  const next = [preset, ...loadPresets()];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deletePreset(id: string): FilterPreset[] {
  const next = loadPresets().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
