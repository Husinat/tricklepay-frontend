// The one place a stream's schedule — start, end, cliff, and what's left — is
// turned into display text. The card, the table, the detail page and the
// create-stream review all show the same fields; going through here means they
// phrase them identically, so two screens side by side can't disagree.

import { formatTime, relativeTime, timeRemaining } from "@/lib/format";
import { formatUtcFromUnixSeconds } from "@/lib/timezone";
import type { StreamStatus } from "@/types/stream";

/** Shown wherever a stream has no cliff — one wording for every view. */
export const NO_CLIFF_LABEL = "None (streams from the start)";

// Streams from the API carry Unix seconds as strings; the create flow holds
// them as bigints. Both are accepted so neither caller converts by hand.
type UnixSeconds = string | bigint;

export interface ScheduleInput {
  startTime: UnixSeconds;
  endTime: UnixSeconds;
  cliffTime: UnixSeconds;
}

/** One point in a schedule, in every form the views show it. */
export interface ScheduleMoment {
  /** The instant in the visitor's local timezone. */
  local: string;
  /** The same instant in UTC, so it can be confirmed without doing the arithmetic. */
  utc: string;
  /** A countdown to it ("starts in 2d 3h"), or the past form ("started") once it has gone by. */
  countdown: string;
}

export interface FormattedSchedule {
  start: ScheduleMoment;
  end: ScheduleMoment;
  /** `null` when the stream has no cliff, so callers show `NO_CLIFF_LABEL` instead. */
  cliff: ScheduleMoment | null;
}

/** A stream has a cliff only when it falls after the start; equal times mean none. */
export function hasCliff(schedule: Pick<ScheduleInput, "startTime" | "cliffTime">): boolean {
  return String(schedule.cliffTime) !== String(schedule.startTime);
}

function moment(unixSeconds: UnixSeconds, verb: string): ScheduleMoment {
  const seconds = String(unixSeconds);
  return {
    local: formatTime(seconds),
    utc: formatUtcFromUnixSeconds(seconds),
    countdown: relativeTime(seconds, verb),
  };
}

/** Start, end and cliff of a schedule, ready to render. */
export function formatSchedule(schedule: ScheduleInput): FormattedSchedule {
  return {
    start: moment(schedule.startTime, "starts"),
    end: moment(schedule.endTime, "ends"),
    cliff: hasCliff(schedule) ? moment(schedule.cliffTime, "cliff") : null,
  };
}

/** Only a stream that hasn't finished has time remaining to show. */
function isActive(status: StreamStatus): boolean {
  return status === "streaming" || status === "pending";
}

/**
 * What a list row shows for a stream that hasn't finished: for a pending
 * stream the time until it starts ("starts in 2d 3h"), otherwise the time
 * until it ends ("ends in 2d 3h"). Returns `null` when it has already
 * completed or been cancelled and there is nothing left to count down.
 * Lists show this in place of the schedule; the caller decides what to render
 * for `null` (the card shows nothing, the table a dash).
 *
 * `startTime` is optional so callers that only know the end time keep the
 * previous ends-in wording; pass it for pending streams to get the
 * starts-in wording the recipient actually wants before accrual begins.
 */
export function formatRemaining(stream: {
  startTime?: string;
  endTime: string;
  status: StreamStatus;
}): string | null {
  if (!isActive(stream.status)) return null;
  if (stream.status === "pending" && stream.startTime !== undefined) {
    // A pending stream counts down to its start while that moment is still
    // ahead — the figure a recipient wants before accrual begins. Once the
    // start has passed (stale or inconsistent data), fall back to the
    // ends-in wording so a row never flips to a bare "started" label.
    const startMs = Number(String(stream.startTime)) * 1000;
    if (Number.isFinite(startMs) && startMs > Date.now()) {
      return relativeTime(String(stream.startTime), "starts");
    }
  }
  return timeRemaining(stream.endTime);
}
