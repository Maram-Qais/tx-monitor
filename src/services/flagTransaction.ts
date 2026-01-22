export async function flagTransaction(id: string): Promise<void> {
  const delay = 250 + Math.floor(Math.random() * 650);
  await new Promise((r) => window.setTimeout(r, delay));

  const fail = Math.random() < 0.1;
  if (fail) {
    throw new Error(`Failed to flag transaction ${id}`);
  }
}
