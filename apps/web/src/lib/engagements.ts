import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Engagement } from "./types.js";
import { loadAll } from "./store.js";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const API_TOKEN = (import.meta.env.VITE_API_TOKEN as string | undefined) ?? "";

function authHeaders(): Record<string, string> {
  return API_TOKEN ? { authorization: `Bearer ${API_TOKEN}` } : {};
}

async function apiList(): Promise<Engagement[]> {
  const res = await fetch(`${API_BASE}/api/engagements`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<Engagement[]>;
}

async function apiPut(e: Engagement): Promise<void> {
  const res = await fetch(`${API_BASE}/api/engagements/${e.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(e),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
}

async function apiDelete(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/engagements/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
}

// Server state via Workers + D1; falls back to localStorage when the
// API is unreachable (local dev without wrangler, Pages preview).
// placeholderData keeps the local list visible while revalidating,
// so useServer is true only after a real fetch succeeds.
export function useEngagements(initial: Engagement[]): {
  list: Engagement[];
  useServer: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
} {
  const q = useQuery({
    queryKey: ["engagements"],
    queryFn: apiList,
    placeholderData: initial,
    retry: false,
    staleTime: 30_000,
  });
  return {
    list: q.data ?? initial,
    useServer: q.isSuccess,
    isLoading: q.isPending,
    error: q.isError ? (q.error instanceof Error ? q.error.message : "request failed") : null,
    retry: () => q.refetch(),
  };
}

export async function migrateLocalToServer(list: Engagement[]): Promise<number> {
  let pushed = 0;
  for (const e of list) {
    await apiPut(e);
    pushed += 1;
  }
  return pushed;
}

export function useDeleteEngagement(): (id: Engagement["id"]) => Promise<void> {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: apiDelete,
    onSettled: () => qc.invalidateQueries({ queryKey: ["engagements"] }),
  });
  return (id: string) => mut.mutateAsync(id).catch(() => undefined);
}

export function useSaveEngagement(): (e: Engagement) => Promise<void> {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: apiPut,
    onSettled: () => qc.invalidateQueries({ queryKey: ["engagements"] }),
  });
  return (e: Engagement) => {
    try {
      const prev = loadAll();
      const next = prev.some((x) => x.id === e.id)
        ? prev.map((x) => (x.id === e.id ? e : x))
        : [e, ...prev];
      localStorage.setItem("formc.engagements.v4", JSON.stringify(next));
    } catch {
      // storage full/blocked — server remains source of truth
    }
    return mut.mutateAsync(e).catch(() => undefined);
  };
}
