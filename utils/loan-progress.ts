export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Compute progress from LIST endpoint fields:
 * - totalMonths = duration
 * - remainingMonths = numberRemainingInstallments (can be negative)
 *
 * We clamp remaining between [0, total] so the ring is always valid.
 */
export function getLoanProgressFromList(
  duration: number,
  remainingFromList?: number,
) {
  const totalMonths = Math.max(duration ?? 0, 0);
  const remainingRaw = remainingFromList ?? 0;

  const remainingMonths = clamp(remainingRaw, 0, totalMonths);

  return { totalMonths, remainingMonths };
}

/**
 * Fallback for DETAILS endpoint if list is not available.
 * Your sample shows installmentsNumber is unreliable, so we use lastTriggeredInstallment.
 */
export function getLoanProgressFromDetails(params: {
  duration?: number;
  totalInstallmentsNumber?: number;
  lastTriggeredInstallment?: number;
}) {
  const totalMonths = Math.max(
    params.totalInstallmentsNumber ?? params.duration ?? 0,
    0,
  );

  const paid = Math.max(params.lastTriggeredInstallment ?? 0, 0);
  const remainingMonths = clamp(totalMonths - paid, 0, totalMonths);

  return { totalMonths, remainingMonths };
}
