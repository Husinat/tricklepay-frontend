import type { StreamStatus } from "@/types/stream";

/**
 * The single place status colours are chosen. Both the badge pill and the
 * legend dot read from here, so adding a status means adding one entry and
 * the two views agree by construction.
 */
export const STREAM_STATUS_COLORS: Record<StreamStatus, { dot: string; pill: string }> = {
  pending: {
    dot: "bg-neutral-400",
    pill: "border border-neutral-700 bg-neutral-800 text-neutral-300",
  },
  streaming: {
    dot: "bg-green-400",
    pill: "border border-green-700/50 bg-green-950/40 text-green-300",
  },
  completed: {
    dot: "bg-blue-400",
    pill: "border border-blue-700/50 bg-blue-950/40 text-blue-300",
  },
  cancelled: {
    dot: "bg-red-400",
    pill: "border border-red-700/50 bg-red-950/40 text-red-300",
  },
};

export const STREAM_STATUS_META: Record<
  StreamStatus,
  { dot: string; style: string; icon: string; label: string; description: string }
> = {
  pending: {
    dot: STREAM_STATUS_COLORS.pending.dot,
    style: STREAM_STATUS_COLORS.pending.pill,
    icon: "⏳",
    label: "Pending",
    description: "Start time not yet reached",
  },
  streaming: {
    dot: STREAM_STATUS_COLORS.streaming.dot,
    style: STREAM_STATUS_COLORS.streaming.pill,
    icon: "●",
    label: "Streaming",
    description: "Tokens are actively vesting",
  },
  completed: {
    dot: STREAM_STATUS_COLORS.completed.dot,
    style: STREAM_STATUS_COLORS.completed.pill,
    icon: "✓",
    label: "Completed",
    description: "Fully vested and ended",
  },
  cancelled: {
    dot: STREAM_STATUS_COLORS.cancelled.dot,
    style: STREAM_STATUS_COLORS.cancelled.pill,
    icon: "✕",
    label: "Cancelled",
    description: "Stopped before end time",
  },
};
