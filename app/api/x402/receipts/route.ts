import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { resourceServer, PAYTO_ADDRESS } from "@/app/lib/x402-server";
import { AGENT, USDC_CONTRACT, type Receipt } from "@/app/types";

// Basescan V1 deprecated — use Blockscout's etherscan-compatible API (free, no key needed)
const BASESCAN_API = "https://base.blockscout.com/api";

async function handler(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") || AGENT.wallet;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
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

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Basescan" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data.status !== "1" || !Array.isArray(data.result)) {
      return NextResponse.json({
        receipts: [],
        wallet,
        source: "live",
        count: 0,
        agent: {
          id: AGENT.id,
          name: AGENT.name,
          ens: AGENT.ens,
        },
      });
    }

    const receipts: Receipt[] = data.result.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      amount: (parseInt(tx.value) / 1e6).toFixed(2),
      timestamp: parseInt(tx.timeStamp),
      blockNumber: tx.blockNumber,
      direction:
        tx.from.toLowerCase() === wallet.toLowerCase() ? "sent" : "received",
      status: "confirmed" as const,
      tokenSymbol: tx.tokenSymbol,
      tokenDecimal: tx.tokenDecimal,
      agentId: String(AGENT.id),
    }));

    // Compute stats
    const totalSent = receipts
      .filter((r) => r.direction === "sent")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalReceived = receipts
      .filter((r) => r.direction === "received")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const uniqueCounterparties = new Set(
      receipts.map((r) =>
        r.direction === "sent" ? r.to : r.from
      )
    ).size;

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
        dateRange: {
          from: receipts.length
            ? new Date(
                receipts[receipts.length - 1].timestamp * 1000
              ).toISOString()
            : null,
          to: receipts.length
            ? new Date(receipts[0].timestamp * 1000).toISOString()
            : null,
        },
      },
      agent: {
        id: AGENT.id,
        name: AGENT.name,
        ens: AGENT.ens,
        erc8004: `https://www.8004scan.io/agents/ethereum/${AGENT.id}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// x402 protected — costs $0.01 USDC on Base to access
export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.01",
      network: "eip155:8453",
      payTo: PAYTO_ADDRESS,
    },
    description:
      "Access Agent Receipts API — live USDC transaction feed for autonomous agents on Base. Returns enriched receipt data with ERC-8004 identity.",
  },
  resourceServer
);
