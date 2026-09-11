export interface WithId {
  id: string;
}

export function updateById<T extends WithId>(list: T[], id: string, patch: Partial<T>): T[] {
  return list.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

export function removeById<T extends WithId>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

export function uid(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return Math.random().toString(36).slice(2, 9);
}
