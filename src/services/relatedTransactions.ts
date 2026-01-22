import type { Transaction } from "../types/transaction";

export type RelatedTx = Transaction;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

function scoreRelated(source: Transaction, candidate: Transaction): number {
  if (source.id === candidate.id) return -1;

  let score = 0;
  if (source.sender.id === candidate.sender.id) score += 5;
  if (source.receiver.id === candidate.receiver.id) score += 5;

  if (source.sender.name === candidate.sender.name) score += 2;
  if (source.receiver.name === candidate.receiver.name) score += 2;

  if (source.currency === candidate.currency) score += 2;
  if (source.status === candidate.status) score += 1;

  const bucket = (x: number) => (x < 34 ? 0 : x < 67 ? 1 : 2);
  if (bucket(source.riskScore) === bucket(candidate.riskScore)) score += 1;

  return score;
}

export async function fetchRelatedTransactions(
  source: Transaction,
  pool: Transaction[],
  limit = 8
): Promise<RelatedTx[]> {
  await sleep(300 + Math.floor(Math.random() * 500));

  const ranked = pool
    .map((tx) => ({ tx, s: scoreRelated(source, tx) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.tx);

  return ranked;
}
