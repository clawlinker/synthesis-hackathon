# @clawlinker/erc8004-verify

> Verify ERC-8004 agent identities onchain. Resolve registration, validate ownership, fetch metadata.

## Install

```bash
npm install @clawlinker/erc8004-verify
```

## Quick Start

```typescript
import { ERC8004Verifier } from "@clawlinker/erc8004-verify";

// Verify any ERC-8004 agent
const verifier = new ERC8004Verifier({ chain: "ethereum" });
const result = await verifier.verify(22945); // Clawlinker

console.log(result.valid);        // true
console.log(result.owner);        // 0x5793BFc...
console.log(result.registration); // { name: "Clawlinker", services: [...] }
console.log(result.summary);      // "7/7 checks passed ✅"
```

## What It Checks

| Check | What it verifies |
|-------|-----------------|
| `agent_exists` | Agent NFT exists on registry (ownerOf doesn't revert) |
| `uri_set` | Agent has a tokenURI (agentURI) pointing to registration file |
| `agent_wallet` | On-chain agent wallet metadata (if set) |
| `registration_type` | Registration file has correct ERC-8004 type field |
| `registration_name` | Agent has a name |
| `registration_services` | Agent lists at least one service endpoint |
| `self_registration` | Registration file references itself (anti-spoofing) |
| `x402_support` | Whether agent advertises x402 payment support |
| `endpoint_*` | Service endpoint reachability (optional) |

## API

### `new ERC8004Verifier(options?)`

```typescript
const verifier = new ERC8004Verifier({
  chain: "ethereum",           // "ethereum" | "base" | "sepolia"
  rpcUrl: "https://...",       // Custom RPC (optional)
  registryAddress: "0x...",    // Custom registry (optional)
  fetchRegistration: true,     // Fetch + parse registration file
  verifyEndpoints: false,      // HEAD-check service endpoints
  timeout: 10_000,             // HTTP timeout (ms)
});
```

### `verifier.verify(agentId): Promise<VerificationResult>`

Full verification — checks existence, ownership, URI, registration file, and optionally endpoints.

### `verifier.exists(agentId): Promise<{ exists, owner }>`

Quick existence check. Just calls `ownerOf`.

### `verifier.getRegistration(agentId): Promise<AgentRegistration>`

Fetch and parse the registration file from the agent's tokenURI.

### `verifier.verifyOwnership(agentId, address): Promise<boolean>`

Check if a specific address owns the agent NFT.

## Supported Chains

| Chain | Registry Address | Chain ID |
|-------|-----------------|----------|
| Ethereum | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | 1 |
| Base | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | 8453 |
| Sepolia | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | 11155111 |

## Built For

This library was built by [Clawlinker](https://pawr.link/clawlinker) — an autonomous AI agent with ERC-8004 identity [#22945](https://www.8004scan.io/agents/ethereum/22945) — during [The Synthesis](https://synthesis.md) hackathon (March 2026).

## License

MIT
