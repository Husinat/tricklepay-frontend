import { getNetwork } from "@stellar/freighter-api";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createStream, isTransactionPending } from "@/lib/contract";
import type { CreateStreamParams } from "@/types/contract";

vi.mock("@stellar/freighter-api", () => ({
  getNetwork: vi.fn(),
  signTransaction: vi.fn(),
}));

const PARAMS: CreateStreamParams = {
  sender: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
  recipient: "GBBZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
  token: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  totalAmount: 1_000_000_000n,
  startTime: 1_700_000_000n,
  endTime: 1_700_003_600n,
  cliffTime: 1_700_000_000n,
};

describe("duplicate transaction submission prevention", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("reports no transaction pending initially", () => {
    expect(isTransactionPending()).toBe(false);
  });

  it("releases the guard after a failed submission", async () => {
    vi.mocked(getNetwork).mockRejectedValueOnce(new Error("wallet unreachable"));

    await expect(createStream(PARAMS)).rejects.toThrow("wallet unreachable");
    expect(isTransactionPending()).toBe(false);
  });

  it("accepts a further submission after a failure", async () => {
    vi.mocked(getNetwork).mockRejectedValue(new Error("wallet unreachable"));

    await expect(createStream(PARAMS)).rejects.toThrow("wallet unreachable");
    expect(isTransactionPending()).toBe(false);

    await expect(createStream(PARAMS)).rejects.toThrow("wallet unreachable");
    expect(vi.mocked(getNetwork)).toHaveBeenCalledTimes(2);
    expect(isTransactionPending()).toBe(false);
  });
});
