/* @vitest-environment jsdom */

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StreamDetail } from "@/components/stream-detail";
import { useWallet } from "@/components/wallet-provider";
import { useAccrual } from "@/hooks/use-accrual";
import { formatTokenAmount } from "@/lib/format";
import { formatSchedule, NO_CLIFF_LABEL } from "@/lib/schedule";
import type { StreamView } from "@/types/stream";
import type { WalletState } from "@/types/wallet";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("@/components/wallet-provider", () => ({
  useWallet: vi.fn(),
}));

vi.mock("@/hooks/use-accrual", () => ({
  useAccrual: vi.fn(),
}));

// StreamActions has its own coverage (stream-actions.test.tsx). Here it's
// stubbed down to the one thing StreamDetail is responsible for: handing it
// the connected wallet address so the right party's controls can appear.
vi.mock("@/components/stream-actions", () => ({
  StreamActions: ({ stream, walletAddress }: { stream: StreamView; walletAddress: string | null }) => {
    if (!walletAddress) return null;
    if (walletAddress !== stream.sender && walletAddress !== stream.recipient) return null;
    return <div data-testid="stream-actions" data-wallet={walletAddress} />;
  },
}));

const NO_WALLET: WalletState = {
  address: null,
  network: null,
  connecting: false,
  error: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const STREAM: StreamView = {
  id: "123",
  sender: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
  recipient: "GBBZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7",
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

describe("StreamDetail", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.mocked(useAccrual).mockReturnValue({ vested: 5_000_000n, withdrawable: 5_000_000n });
    vi.mocked(useWallet).mockReturnValue(NO_WALLET);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("renders the schedule and the balances", async () => {
    await act(async () => {
      root.render(<StreamDetail stream={STREAM} onComplete={vi.fn()} />);
    });

    const text = container.textContent ?? "";
    const schedule = formatSchedule(STREAM);

    // Balances: withdrawable now, plus vested-of-total.
    expect(text).toContain(formatTokenAmount("5000000", STREAM.token));
    expect(text).toContain(formatTokenAmount(STREAM.totalAmount, STREAM.token));

    // Schedule: start, end, and cliff, in the same wording lib/schedule produces.
    expect(text).toContain(schedule.start.local);
    expect(text).toContain(schedule.end.local);
    expect(text).toContain(NO_CLIFF_LABEL);
  });

  it("passes the connected wallet through so that party's actions appear", async () => {
    vi.mocked(useWallet).mockReturnValue({ ...NO_WALLET, address: STREAM.recipient });

    await act(async () => {
      root.render(<StreamDetail stream={STREAM} onComplete={vi.fn()} />);
    });

    const actions = container.querySelector('[data-testid="stream-actions"]');
    expect(actions).not.toBeNull();
    expect(actions?.getAttribute("data-wallet")).toBe(STREAM.recipient);
  });

  it("shows no actions when no wallet is connected", async () => {
    await act(async () => {
      root.render(<StreamDetail stream={STREAM} onComplete={vi.fn()} />);
    });

    expect(container.querySelector('[data-testid="stream-actions"]')).toBeNull();
  });

  it("renders stream data read-only with no action controls for an unrelated third-party wallet", async () => {
    const unrelatedWallet = "GCCZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
    vi.mocked(useWallet).mockReturnValue({ ...NO_WALLET, address: unrelatedWallet });

    await act(async () => {
      root.render(<StreamDetail stream={STREAM} onComplete={vi.fn()} />);
    });

    const text = container.textContent ?? "";
    const schedule = formatSchedule(STREAM);

    // Stream data still renders
    expect(text).toContain(`Stream #${STREAM.id}`);
    expect(text).toContain(formatTokenAmount("5000000", STREAM.token));
    expect(text).toContain(formatTokenAmount(STREAM.totalAmount, STREAM.token));
    expect(text).toContain(schedule.start.local);

    // No action controls render for unrelated wallet
    expect(container.querySelector('[data-testid="stream-actions"]')).toBeNull();
  });
});
