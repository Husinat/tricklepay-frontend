import { formatTime } from "@/lib/format";
import {
  STREAM_CANCELLED_MESSAGE,
  STREAM_FULLY_WITHDRAWN_MESSAGE,
  STREAM_NOTHING_TO_WITHDRAW_MESSAGE,
  streamLockedUntilCliffMessage,
  streamNotStartedMessage,
} from "@/lib/stream-messages";
import { isStreamSender } from "@/lib/stream-role";
import type { StreamView } from "@/types/stream";

/** Returns whether the connected wallet is allowed to cancel this stream. */
export function canSenderCancel(stream: StreamView, walletAddress: string | null): boolean {
  return Boolean(
    walletAddress &&
      isStreamSender(stream, walletAddress) &&
      stream.status !== "cancelled" &&
      stream.status !== "completed",
  );
}

// Why a recipient cannot withdraw right now. A cliff is the case worth naming:
// the stream is visibly streaming and its vested figure is climbing, so without
// the date the disabled button looks like a bug rather than a schedule.
// Wording lives in lib/stream-messages.ts; this only selects which one fits.
export function blockedReason(stream: StreamView): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now < BigInt(stream.startTime)) {
    return streamNotStartedMessage(formatTime(stream.startTime));
  }
  if (now < BigInt(stream.cliffTime)) {
    return streamLockedUntilCliffMessage(formatTime(stream.cliffTime));
  }
  if (BigInt(stream.withdrawn) >= BigInt(stream.totalAmount)) {
    return STREAM_FULLY_WITHDRAWN_MESSAGE;
  }
  if (stream.cancelled) {
    return STREAM_CANCELLED_MESSAGE;
  }
  return STREAM_NOTHING_TO_WITHDRAW_MESSAGE;
}
