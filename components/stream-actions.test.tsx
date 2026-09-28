import { describe, expect, it, vi } from "vitest";

import type { StreamView } from "@/types/stream";

import { StreamActions, canSenderCancel } from "./stream-actions";

const stream: StreamView = {
  id: "1",
  sender: "G-SENDER",
  recipient: "G-RECIPIENT",
  token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  totalAmount: "10000000",
  withdrawn: "0",
  vested: "5000000",
  withdrawable: "5000000",
  locked: "5000000",
  startTime: "1700000000",
  endTime: "1700003600",
  cliffTime: "1700000000",
  cancelled: false,
  status: "streaming",
  progress: 5000,
};

describe("canSenderCancel", () => {
  it("allows the sender to cancel an active stream", () => {
    expect(canSenderCancel(stream, stream.sender)).toBe(true);
  });

  it("does not allow the recipient to cancel", () => {
    expect(canSenderCancel(stream, stream.recipient)).toBe(false);
  });

  it("does not allow cancellation after completion", () => {
    expect(canSenderCancel({ ...stream, status: "completed" }, stream.sender)).toBe(false);
  });

  it("does not allow cancellation when there is no connected wallet", () => {
    expect(canSenderCancel(stream, null)).toBe(false);
  });

  // The comparison a wrong-account mistake would slip through: any deviation
  // from the sender's exact address — case, whitespace, or otherwise — must
  // read as "not the sender," never as a near-enough match.
  describe("address comparison", () => {
    it("is case-sensitive", () => {
      expect(canSenderCancel(stream, stream.sender.toLowerCase())).toBe(false);
    });

    it("does not trim or otherwise normalise whitespace", () => {
      expect(canSenderCancel(stream, ` ${stream.sender}`)).toBe(false);
      expect(canSenderCancel(stream, `${stream.sender} `)).toBe(false);
    });

    it("is consistent across repeated calls with the same inputs", () => {
      const results = Array.from({ length: 5 }, () => canSenderCancel(stream, stream.sender));
      expect(results).toEqual([true, true, true, true, true]);
    });

    it("matches on value, not on how the string was built", () => {
      // Reassembled via concatenation rather than copied whole, so this
      // exercises value equality rather than relying on both sides
      // happening to be the same in-memory string.
      const reassembled = stream.sender.slice(0, 2) + stream.sender.slice(2);
      expect(canSenderCancel(stream, reassembled)).toBe(true);
    });
  });
});

vi.mock("@/hooks/use-stream-actions", () => ({
  useStreamActions: vi.fn().mockReturnValue({
    busy: null,
    confirmingCancel: false,
    timeoutHash: null,
    withdrawable: "0",
    amountInput: "",
    amountError: null,
    nothingToWithdraw: true,
    stage: "idle",
    lastTxHash: null,
    error: null,
  }),
}));

describe("StreamActions component rendering", () => {
  it("renders the cancel control when the current caller is the stream sender", () => {
    const element = StreamActions({ stream, walletAddress: stream.sender, onComplete: vi.fn() });
    
    // We expect the cancel control to be in the tree, meaning it's not null and rendered
    const children = element!.props.children;
    // The cancel control is rendered because canCancel is true
    const hasCancelControl = children.some(
      (child: { type?: { name?: string } } | null | undefined) =>
        Boolean(child?.type && child.type.name === "CancelStreamControl"),
    );
    expect(hasCancelControl).toBe(true);
  });

  it("does not render the cancel control when the current caller is a non-sender viewer", () => {
    // We'll use the recipient as the wallet address. The recipient is allowed to view actions (WithdrawPanel)
    const element = StreamActions({ stream, walletAddress: stream.recipient, onComplete: vi.fn() });
    
    const children = element!.props.children;
    // The cancel control should be absent
    const hasCancelControl = children.some(
      (child: { type?: { name?: string } } | null | undefined) =>
        Boolean(child?.type && child.type.name === "CancelStreamControl"),
    );
    expect(hasCancelControl).toBe(false);
  });

  it("renders nothing (no action controls) when caller is an unrelated third-party wallet", () => {
    const element = StreamActions({ stream, walletAddress: "GTHIRD_PARTY_UNRELATED_ADDRESS", onComplete: vi.fn() });
    expect(element).toBeNull();
  });
});
