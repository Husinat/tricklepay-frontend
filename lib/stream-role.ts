// Single rule for deciding whether the connected wallet is a stream's
// sender or recipient. Stellar strkeys are case-sensitive and significant
// byte-for-byte, so the comparison is strict equality with no trimming or
// lower-casing — any deviation reads as "not that party". Centralising it
// here keeps every component deciding a role consistent.

import type { StreamView } from "@/types/stream";

/**
 * Strict address equality: true only when both sides are the exact same
 * string. Nullish or mismatched values are never equal.
 */
export function isSameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  return typeof a === "string" && typeof b === "string" && a === b;
}

/** Whether the connected wallet is the sender of this stream. */
export function isStreamSender(stream: StreamView, walletAddress: string | null): boolean {
  return isSameAddress(walletAddress, stream.sender);
}

/** Whether the connected wallet is the recipient of this stream. */
export function isStreamRecipient(stream: StreamView, walletAddress: string | null): boolean {
  return isSameAddress(walletAddress, stream.recipient);
}
