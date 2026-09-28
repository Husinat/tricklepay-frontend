import { describe, expect, it } from "vitest";

import { STREAM_STATUS_META } from "@/lib/stream-status";
import type { StreamStatus } from "@/types/stream";

import { StreamStatusLegend } from "./stream-status-legend";

// Same set the badge, card, and table components render — see
// stream-status-badge.test.tsx and stream-card.test.tsx.
const STATUSES: StreamStatus[] = ["pending", "streaming", "completed", "cancelled"];

describe("StreamStatusLegend", () => {
  it("renders exactly one entry per status, matching the statuses used elsewhere", () => {
    const el = StreamStatusLegend();
    const entries = el.props.children as { key: string }[];

    expect(entries).toHaveLength(STATUSES.length);
    expect(entries.map((entry) => entry.key).sort()).toEqual([...STATUSES].sort());
  });

  it("labels every entry with that status's shared label and description", () => {
    const el = StreamStatusLegend();
    const json = JSON.stringify(el);

    for (const status of STATUSES) {
      expect(json).toContain(STREAM_STATUS_META[status].label);
      expect(json).toContain(STREAM_STATUS_META[status].description);
    }
  });

  it("gives the legend an accessible label", () => {
    const el = StreamStatusLegend();
    expect(el.props["aria-label"]).toBe("Stream status legend");
  });
});
