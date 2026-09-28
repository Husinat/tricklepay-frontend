// Orchestration for contract invocations: guard → network check →
// preparing → signing → submitting → confirming. Extracted so the stage
// flow can be followed without reading the implementation of each step;
// each step lives in its own module (guard, network, transaction, confirm).

import type { Contract, xdr } from "@stellar/stellar-sdk";

import { confirm } from "@/lib/contract-confirm";
import { acquireInvocation, releaseInvocation } from "@/lib/contract-guard";
import { TX_ALREADY_IN_PROGRESS_MESSAGE } from "@/lib/contract-messages";
import { ensureWalletNetwork, server } from "@/lib/contract-network";
import {
  buildAndPrepareTransaction,
  signPreparedTransaction,
  submitSignedTransaction,
} from "@/lib/contract-transaction";
import type { TxStage } from "@/types/contract";

// Builds, signs (via Freighter), submits, and confirms a contract invocation,
// returning the transaction hash once it succeeds on-chain.
//
// onStageChange is called at the start of each stage so the UI can show
// progress. It is not called for the pre-stage guard checks (concurrency lock
// and network mismatch), because those fail before any meaningful work begins.
export async function invoke(
  caller: string,
  buildOp: (contract: Contract) => xdr.Operation,
  onStageChange?: (stage: TxStage) => void,
): Promise<string> {
  if (!acquireInvocation()) {
    throw new Error(TX_ALREADY_IN_PROGRESS_MESSAGE);
  }

  try {
    await ensureWalletNetwork();

    // ── STAGE: preparing ──────────────────────────────────────────────────
    onStageChange?.("preparing");
    const srv = server();
    const prepared = await buildAndPrepareTransaction(srv, caller, buildOp);

    // ── STAGE: signing ────────────────────────────────────────────────────
    onStageChange?.("signing");
    const signedTxXdr = await signPreparedTransaction(prepared.toXDR(), caller);

    // ── STAGE: submitting ─────────────────────────────────────────────────
    onStageChange?.("submitting");
    const hash = await submitSignedTransaction(srv, signedTxXdr);

    // ── STAGE: confirming ─────────────────────────────────────────────────
    onStageChange?.("confirming");
    return await confirm(srv, hash);
  } finally {
    releaseInvocation();
  }
}
