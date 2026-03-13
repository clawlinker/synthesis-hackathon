/**
 * ERC-8004 Agent Registration File structure
 * As defined in https://eips.ethereum.org/EIPS/eip-8004#agent-uri-and-agent-registration-file
 */
export interface AgentRegistration {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
  name: string;
  description: string;
  image?: string;
  services: AgentService[];
  x402Support?: boolean;
  active?: boolean;
  registrations?: AgentRegistryEntry[];
  supportedTrust?: string[];
}

export interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
  skills?: string[];
  domains?: string[];
}

export interface AgentRegistryEntry {
  agentId: number;
  agentRegistry: string; // e.g., "eip155:1:0x742..."
}

/**
 * Result of verifying an ERC-8004 agent identity
 */
export interface VerificationResult {
  /** Whether the agent identity is valid */
  valid: boolean;
  /** Agent ID (ERC-721 tokenId) */
  agentId: number;
  /** Chain the agent is registered on */
  chain: string;
  /** Registry contract address */
  registry: string;
  /** Current owner of the agent NFT */
  owner: string;
  /** Agent's designated wallet (if set) */
  agentWallet: string | null;
  /** The agentURI (tokenURI) */
  agentURI: string;
  /** Parsed registration file (if resolvable) */
  registration: AgentRegistration | null;
  /** Individual check results */
  checks: VerificationCheck[];
  /** Human-readable summary */
  summary: string;
  /** Timestamp of verification */
  verifiedAt: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string;
}

/**
 * Reputation summary for an agent
 */
export interface ReputationSummary {
  agentId: number;
  totalFeedback: number;
  clients: string[];
  averageScore: number | null;
  tags: Record<string, { count: number; avgValue: number }>;
}

/**
 * Options for the verifier
 */
export interface VerifierOptions {
  /** Ethereum JSON-RPC URL */
  rpcUrl?: string;
  /** Chain name (ethereum, base, sepolia) */
  chain?: string;
  /** Custom registry address (overrides chain default) */
  registryAddress?: string;
  /** Timeout for HTTP requests in ms */
  timeout?: number;
  /** Whether to fetch and validate the registration file */
  fetchRegistration?: boolean;
  /** Whether to verify endpoint reachability */
  verifyEndpoints?: boolean;
}
