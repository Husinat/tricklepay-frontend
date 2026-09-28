// Network concerns for contract invocations: the RPC server factory, the
// Freighter network normalisation, and the pre-flight network-mismatch
// guard. Extracted so network setup can evolve without touching the
// build/sign/submit/confirm steps.

import { getNetwork } from "@stellar/freighter-api";
import { rpc } from "@stellar/stellar-sdk";

import { config } from "@/lib/config";
import { wrongNetworkMessage } from "@/lib/contract-messages";

// Local copy of the wallet-utils normalisation so this module does not
// depend on unrelated helpers; mirrors wallet-provider.tsx so the wallet vs
// app comparison stays consistent.
export function normalizeNetwork(network: string): string {
  const lower = network.toLowerCase();
  if (lower.includes("test")) return "testnet";
  if (lower.includes("public")) return "mainnet";
  return lower;
}

export function server(): rpc.Server {
  return new rpc.Server(config.rpcUrl, { allowHttp: config.rpcUrl.startsWith("http://") });
}

/**
 * Rejects immediately if Freighter's active network does not match the
 * network the app is configured for. A transaction built against the wrong
 * passphrase would be rejected by the RPC anyway; checking here gives a
 * clear, actionable error before any round-trip or signing prompt.
 * A Freighter failure here is silently skipped rather than blocking the call.
 */
export async function ensureWalletNetwork(): Promise<void> {
  const netResult = await getNetwork();
  if (!netResult.error) {
    const walletNetwork = normalizeNetwork(netResult.network);
    if (walletNetwork !== config.network) {
      throw new Error(wrongNetworkMessage(walletNetwork, config.network));
    }
  }
}
