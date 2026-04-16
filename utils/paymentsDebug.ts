type DebugOpts = {
  dedupeKey?: "id" | "id_or_reference" | "reference";
};

const safeMs = (d: any): { ok: boolean; ms: number; reason: string } => {
  if (d == null) return { ok: false, ms: -1, reason: "empty" };

  // Accept string ISO or number or Date
  const dt = d instanceof Date ? d : new Date(d);
  const ms = dt.getTime();

  if (Number.isNaN(ms)) return { ok: false, ms: -1, reason: "invalid" };
  return { ok: true, ms, reason: "ok" };
};

const getDedupeKey = (p: any, dedupeKey: DebugOpts["dedupeKey"]) => {
  const id = p?.id != null ? String(p.id) : "";
  const ref =
    p?.transactionReference != null
      ? String(p.transactionReference)
      : p?.ref != null
        ? String(p.ref)
        : "";

  if (dedupeKey === "id") return id || ref || `${p?.paymentDate ?? ""}`;
  if (dedupeKey === "reference") return ref || id || `${p?.paymentDate ?? ""}`;

  // id_or_reference (default)
  return id || ref || `${p?.paymentDate ?? ""}`;
};

export function normalizePaymentsWithDebug<T extends Record<string, any>>(
  tag: "RECENT" | "HISTORY" | string,
  input: T[],
  opts: DebugOpts = { dedupeKey: "id_or_reference" },
): T[] {
  const arr = Array.isArray(input) ? input : [];
  // console.log(`[${tag}] ===============================`);
  // console.log(`[${tag}] normalizePaymentsWithDebug input size = ${arr.length}`);
  // console.log(
  //   `[${tag}] first 10 received (RAW ORDER):`,
  //   JSON.stringify(arr.slice(0, 10)),
  // );

  // Dedupe (keep newest for same key)
  const map = new Map<string, T>();
  for (const p of arr) {
    const k = getDedupeKey(p, opts.dedupeKey);
    if (!k) continue;

    const next = p;
    const prev = map.get(k);

    if (!prev) {
      map.set(k, next);
      continue;
    }

    // keep the most recent by paymentDate
    const prevMs = safeMs(prev?.paymentDate ?? prev?.sortRaw).ms;
    const nextMs = safeMs(next?.paymentDate ?? next?.sortRaw).ms;
    map.set(k, nextMs >= prevMs ? next : prev);
  }

  const unique = Array.from(map.values());
  // console.log(`[${tag}] unique size after dedupe = ${unique.length}`);

  // date health
  let emptyDates = 0;
  let invalidDates = 0;

  for (const p of unique) {
    const v = p?.paymentDate ?? p?.sortRaw;
    if (v == null) emptyDates++;
    else if (!safeMs(v).ok) invalidDates++;
  }

  // console.log(
  //   `[${tag}] date health: emptyDates=${emptyDates}, invalidDates=${invalidDates}`,
  // );

  // sort desc by paymentDate
  const sorted = unique
    .map((p) => {
      const raw = p?.paymentDate ?? p?.sortRaw;
      const { ok, ms, reason } = safeMs(raw);
      return { p, ok, ms, reason, sortRaw: raw };
    })
    .sort((a, b) => b.ms - a.ms)
    .map((x) => x.p);

  // log top 10 after sort
  const top = sorted.slice(0, 10).map((p: any) => {
    const raw = p?.paymentDate ?? p?.sortRaw;
    const { ok, ms, reason } = safeMs(raw);
    return {
      id: p?.id,
      ms,
      ok,
      reason,
      ref: p?.transactionReference ?? p?.ref ?? null,
      sortRaw: raw ?? null,
      status: p?.transactionStatus ?? p?.status ?? null,
    };
  });

  // console.log(`[${tag}] top 10 AFTER sort:`, JSON.stringify(top));
  // console.log(`[${tag}] ===============================`);

  return sorted as T[];
}
