# Facilitator Analysis — x402 Protocol

## Overview
The x402 facilitator manages payment scheme registration, verification, and settlement. The TypeScript implementation in `@coinbase/x402-core` uses a hook-based architecture that allows for extending the behavior of `verify()` and `settle()`.

## Core Components
- `x402Facilitator`: The main class for handling payments.
- `FacilitatorClient`: Interface for HTTP or local facilitator interactions.
- `HTTPFacilitatorClient`: Default implementation for interacting with a remote facilitator service.

## Receipt Integration Points
The best way to capture receipts is through `x402Facilitator` hooks:
- `onAfterVerify`: Captures successful verification.
- `onAfterSettle`: Captures successful settlement, including the transaction hash.

### Proposed Receipt Format
```typescript
interface AgentReceipt {
  x402Version: number;
  type: 'verification' | 'settlement';
  timestamp: string;
  payer: string;
  payTo: string;
  amount: string;
  asset: string;
  network: string;
  scheme: string;
  transactionHash?: string; // Only for settlement
  status: 'success' | 'failed';
  errorMessage?: string;
}
```

## Next Steps
- Research if we can wrap the facilitator in a proxy or middleware to automate this for existing agents.
- Check if `onAfterSettle` provides enough context for the agent to log a full receipt.
