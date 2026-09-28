// Concurrency guard for contract invocations: only one transaction may be
// in flight at a time. Extracted from the invocation flow so the lock can
// be reasoned about and tested without touching network code.

let isInvocationActive = false;

/**
 * Returns whether a contract transaction invocation is currently in progress.
 */
export function isTransactionPending(): boolean {
  return isInvocationActive;
}

/**
 * Acquires the invocation lock. Returns true when acquired, false when
 * another invocation already holds it (the caller should reject with
 * TX_ALREADY_IN_PROGRESS_MESSAGE).
 */
export function acquireInvocation(): boolean {
  if (isInvocationActive) return false;
  isInvocationActive = true;
  return true;
}

/** Releases the invocation lock. Always called from a finally block. */
export function releaseInvocation(): void {
  isInvocationActive = false;
}
