import { NextRequest, NextResponse } from "next/server";
import { PAYTO_ADDRESS } from "@/app/lib/x402-server";
import { AGENT, BANKR_AGENT, USDC_CONTRACT, type Receipt, type TokenTransferApiResponse } from "@/app/types";
import { ADDRESS_LABELS, CONTRACTS, SERVICE_LABELS } from "@/data/config";

const BASESCAN_API = "https://base.blockscout.com/api";

// Helper to label addresses
function labelAddress(address: string): string | undefined {
  const addr = address.toLowerCase();
  for (const [key, label] of Object.entries(ADDRESS_LABELS)) {
    if (key.toLowerCase() === addr) return label;
  }
  return undefined;
}

// Helper to resolve service from transaction
function getServiceFromTx(tx: { to: string; from: string }, wallet: string): string | undefined {
  const to = tx.to.toLowerCase();
  const from = tx.from.toLowerCase();
  const other = from === wallet.toLowerCase() ? to : from;

  // Check against hardcoded contract addresses first
  if (other === CONTRACTS.X402_FACILITATOR.toLowerCase()) return SERVICE_LABELS[CONTRACTS.X402_FACILITATOR.toLowerCase()];
  if (other === CONTRACTS.VIRTUALS_ACP.toLowerCase()) return SERVICE_LABELS[CONTRACTS.VIRTUALS_ACP.toLowerCase()];

  return labelAddress(other);
}

// Helper to resolve agent info from address
function resolveAgent(address: string) {
  const lower = address.toLowerCase();
  if (lower === AGENT.wallet.toLowerCase()) return { id: AGENT.id, name: AGENT.name, ens: AGENT.ens, avatar: AGENT.avatar };
  if (lower === BANKR_AGENT.wallet.toLowerCase()) return { id: BANKR_AGENT.id, name: BANKR_AGENT.name, avatar: BANKR_AGENT.avatar };
  const label = labelAddress(address);
  if (label && label.includes('(')) {
    // Extract name from "Name (Type)" format
    const parts = label.split(' (');
    if (parts.length > 0) return { id: 0, name: parts[0], avatar: undefined };
  }
  return undefined;
}

async function fetchReceipts(wallet: string, limit: number) {
  const params = new URLSearchParams({
    module: "account",
    action: "tokentx",
    address: wallet,
    contractaddress: USDC_CONTRACT,
    sort: "desc",
    page: "1",
    offset: String(limit),
  });

  if (process.env.BASESCAN_API_KEY) {
    params.set("apikey", process.env.BASESCAN_API_KEY);
  }

  const res = await fetch(`${BASESCAN_API}?${params}`, {
    next: { revalidate: 30 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== "1" || !Array.isArray(data.result)) return [];

  return data.result.map((tx: TokenTransferApiResponse['result'][0]) => {
    const from = tx.from;
    const to = tx.to;
    const service = getServiceFromTx({ from, to }, wallet);
    const fromLabel = labelAddress(from);
    const toLabel = labelAddress(to);
    const fromAgent = resolveAgent(from);
    const toAgent = resolveAgent(to);

    return {
      hash: tx.hash,
      from: from,
      to: to,
      value: tx.value,
      amount: (parseInt(tx.value) / 1e6).toFixed(2),
      timestamp: parseInt(tx.timeStamp),
      blockNumber: tx.blockNumber,
      direction: tx.from.toLowerCase() === wallet.toLowerCase() ? "sent" : "received",
      status: "confirmed" as const,
      tokenSymbol: tx.tokenSymbol,
      tokenDecimal: tx.tokenDecimal,
      agentId: String(AGENT.id),
      service: service,
      fromLabel: fromLabel,
      toLabel: toLabel,
      fromAgent: fromAgent,
      toAgent: toAgent,
      receiptType: "onchain" as const,
    } satisfies Receipt;
  });
}

// x402 payment gate — $0.01 USDC on Base
const PAYMENT_REQUIREMENTS = {
  scheme: "exact",
  network: "eip155:8453",
  maxAmountRequired: "10000", // $0.01 in 6-decimal USDC
  resource: "https://molttail.vercel.app/api/x402/receipts",
  description: "Access Molttail API - live USDC transaction feed for autonomous agents on Base.",
  mimeType: "application/json",
  payTo: PAYTO_ADDRESS,
  maxTimeoutSeconds: 300,
};

export async function GET(req: NextRequest) {
  // Check for x402 payment header
  const paymentHeader = req.headers.get("X-PAYMENT") || req.headers.get("x-payment");

  if (!paymentHeader) {
    // Return 402 with payment requirements
    return NextResponse.json(
      {
        error: "Payment Required",
        paymentRequirements: [PAYMENT_REQUIREMENTS],
        facilitator: "https://facilitator.x402.org",
      },
      {
        status: 402,
        headers: {
          "X-PAYMENT-REQUIREMENTS": JSON.stringify([PAYMENT_REQUIREMENTS]),
        },
      }
    );
  }

  // Mock x402 verification for hackathon demo (facilitator often unreachable)
  // In production, replace with actual facilitator verification
  if (process.env.NODE_ENV !== "production" || process.env.X402_MOCK_VERIFICATION === "true") {
    // Skip facilitator verification in demo mode
  } else {
    try {
      const verifyRes = await fetch("https://facilitator.x402.org/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: paymentHeader,
          paymentRequirements: PAYMENT_REQUIREMENTS,
        }),
      });

      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: "Payment verification failed" },
          { status: 402 }
        );
      }
    } catch {
      // If facilitator is down, accept payment header as-is for hackathon demo
    }
  }

  // Serve the data
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") || AGENT.wallet;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const receipts = await fetchReceipts(wallet, limit);

  if (receipts === null) {
    return NextResponse.json({ error: "Failed to fetch from Blockscout" }, { status: 502 });
  }

  const totalSent = receipts.filter((r: Receipt) => r.direction === "sent").reduce((s: number, r: Receipt) => s + parseFloat(r.amount), 0);
  const totalReceived = receipts.filter((r: Receipt) => r.direction === "received").reduce((s: number, r: Receipt) => s + parseFloat(r.amount), 0);
  const uniqueCounterparties = new Set(receipts.map((r: Receipt) => r.direction === "sent" ? r.to : r.from)).size;

  return NextResponse.json({
    receipts,
    wallet,
    source: "live",
    count: receipts.length,
    stats: {
      totalSent: totalSent.toFixed(2),
      totalReceived: totalReceived.toFixed(2),
      netFlow: (totalReceived - totalSent).toFixed(2),
      uniqueCounterparties,
    },
    agent: {
      id: AGENT.id,
      name: AGENT.name,
      ens: AGENT.ens,
      erc8004: `https://www.8004scan.io/agents/ethereum/${AGENT.id}`,
    },
    _metadata: {
      enriched: true,
      serviceLabels: Object.keys(SERVICE_LABELS).length + " services mapped",
      agentLabels: Object.keys(ADDRESS_LABELS).length + " addresses labeled",
    },
  });
}
