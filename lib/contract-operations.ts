// Public write entry points for the stream contract (create, withdraw,
// withdraw_amount, cancel). Each funnels through invoke(); this module only
// maps application params to contract calls.

import { Address, nativeToScVal } from "@stellar/stellar-sdk";

import { invoke } from "@/lib/contract-invoke";
import type { CreateStreamParams, TxStage } from "@/types/contract";

export async function createStream(
  params: CreateStreamParams,
  onStageChange?: (stage: TxStage) => void,
): Promise<string> {
  return invoke(
    params.sender,
    (contract) =>
      contract.call(
        "create_stream",
        new Address(params.sender).toScVal(),
        new Address(params.recipient).toScVal(),
        new Address(params.token).toScVal(),
        nativeToScVal(params.totalAmount, { type: "i128" }),
        nativeToScVal(params.startTime, { type: "u64" }),
        nativeToScVal(params.endTime, { type: "u64" }),
        nativeToScVal(params.cliffTime, { type: "u64" }),
      ),
    onStageChange,
  );
}

export async function withdraw(
  caller: string,
  streamId: bigint,
  onStageChange?: (stage: TxStage) => void,
): Promise<string> {
  return invoke(
    caller,
    (contract) => contract.call("withdraw", nativeToScVal(streamId, { type: "u64" })),
    onStageChange,
  );
}

/**
 * Withdraws a specific amount from a stream instead of the full vested balance.
 * Maps to the contract's `withdraw_amount(id, amount)` entry point.
 * `amount` is in base units (7 decimal places, the Stellar stroop standard).
 */
export async function withdrawAmount(
  caller: string,
  streamId: bigint,
  amount: bigint,
  onStageChange?: (stage: TxStage) => void,
): Promise<string> {
  return invoke(
    caller,
    (contract) =>
      contract.call(
        "withdraw_amount",
        nativeToScVal(streamId, { type: "u64" }),
        nativeToScVal(amount, { type: "i128" }),
      ),
    onStageChange,
  );
}

export async function cancel(
  caller: string,
  streamId: bigint,
  onStageChange?: (stage: TxStage) => void,
): Promise<string> {
  return invoke(
    caller,
    (contract) => contract.call("cancel", nativeToScVal(streamId, { type: "u64" })),
    onStageChange,
  );
}
