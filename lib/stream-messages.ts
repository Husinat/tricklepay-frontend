// User-facing copy for why a recipient cannot withdraw right now, kept apart
// from lib/stream-actions.ts so tone can be reviewed without reading the
// schedule logic. The blockedReason() helper there only decides *which* of
// these strings applies — the wording lives here and is reused unchanged.

/** Shown when everything vested has already been withdrawn. */
export const STREAM_FULLY_WITHDRAWN_MESSAGE = "Fully withdrawn.";

/** Shown when the stream was cancelled before anything more could vest. */
export const STREAM_CANCELLED_MESSAGE = "This stream was cancelled.";

/** Fallback when nothing is withdrawable but no more specific reason fits. */
export const STREAM_NOTHING_TO_WITHDRAW_MESSAGE = "Nothing to withdraw yet.";

/** Shown when the stream has not started yet; includes the formatted start. */
export function streamNotStartedMessage(formattedStart: string): string {
  return `Starts ${formattedStart}.`;
}

// Shown when the stream is between start and cliff: it is visibly streaming
// and the vested figure is climbing, so the date is named — without it the
// disabled button looks like a bug rather than a schedule.
export function streamLockedUntilCliffMessage(formattedCliff: string): string {
  return `Locked until the cliff on ${formattedCliff}.`;
}
