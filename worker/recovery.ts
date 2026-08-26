export const recoverableIntermediateStatuses = [
  "SOURCE_TX_PENDING",
  "WAITING_ATTESTATION",
  "GENERATING_PROOF",
  "PROOF_READY",
  "SUBMITTING",
  "SUBMITTED",
] as const;

export const staleJobMilliseconds = 60_000;

export function shouldReclaimAfterRestart(
  status: string,
  updatedAt: Date,
  now = new Date(),
) {
  return (
    recoverableIntermediateStatuses.some((candidate) => candidate === status) &&
    now.getTime() - updatedAt.getTime() >= staleJobMilliseconds
  );
}
