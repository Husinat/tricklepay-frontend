import { describe, expect, it } from "vitest";

import { SkipLink } from "./skip-link";

describe("SkipLink", () => {
  it("is visually hidden by default and becomes visible on focus", () => {
    const el = SkipLink();
    const classes = (el.props.className as string).split(/\s+/).filter(Boolean);

    // sr-only hides it; focus:not-sr-only is Tailwind's mechanism for
    // reversing that the moment the link receives keyboard focus.
    expect(classes).toContain("sr-only");
    expect(classes).toContain("focus:not-sr-only");
  });

  it("targets the main content region", () => {
    const el = SkipLink();
    expect(el.type).toBe("a");
    expect(el.props.href).toBe("#main-content");
  });
});
