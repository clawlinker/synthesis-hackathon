import type { AgentRegistration, VerificationResult, VerifierOptions } from "./types.js";
/**
 * ERC-8004 Agent Identity Verifier
 *
 * Resolves onchain agent registration, validates ownership,
 * fetches metadata, and checks registration file integrity.
 *
 * @example
 * ```ts
 * const verifier = new ERC8004Verifier({ chain: "ethereum" });
 * const result = await verifier.verify(22945);
 * console.log(result.valid, result.owner, result.registration?.name);
 * ```
 */
export declare class ERC8004Verifier {
    private provider;
    private registry;
    private chain;
    private options;
    constructor(options?: VerifierOptions);
    /**
     * Verify an ERC-8004 agent identity by agentId
     */
    verify(agentId: number): Promise<VerificationResult>;
    /**
     * Quick check — just verifies the agent exists and has an owner
     */
    exists(agentId: number): Promise<{
        exists: boolean;
        owner: string | null;
    }>;
    /**
     * Get the registration file for an agent
     */
    getRegistration(agentId: number): Promise<AgentRegistration>;
    /**
     * Verify that a specific address owns or operates a given agent
     */
    verifyOwnership(agentId: number, address: string): Promise<boolean>;
    /**
     * Fetch and parse an agent registration file from its URI
     */
    private fetchRegistration;
    private buildResult;
}
