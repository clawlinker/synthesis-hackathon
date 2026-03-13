import { ethers } from "ethers";
import { IDENTITY_REGISTRY_ABI, KNOWN_REGISTRIES } from "./abi.js";
const DEFAULT_RPC_URLS = {
    ethereum: "https://eth.llamarpc.com",
    base: "https://mainnet.base.org",
    sepolia: "https://rpc.sepolia.org",
};
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
export class ERC8004Verifier {
    provider;
    registry;
    chain;
    options;
    constructor(options = {}) {
        const chain = options.chain ?? "ethereum";
        const knownRegistry = KNOWN_REGISTRIES[chain];
        if (!knownRegistry && !options.registryAddress) {
            throw new Error(`Unknown chain "${chain}". Provide a custom registryAddress or use: ${Object.keys(KNOWN_REGISTRIES).join(", ")}`);
        }
        const rpcUrl = options.rpcUrl ?? DEFAULT_RPC_URLS[chain];
        if (!rpcUrl) {
            throw new Error(`No default RPC URL for chain "${chain}". Provide rpcUrl in options.`);
        }
        this.chain = chain;
        this.options = {
            rpcUrl,
            chain,
            registryAddress: options.registryAddress ?? knownRegistry?.address ?? "",
            timeout: options.timeout ?? 10_000,
            fetchRegistration: options.fetchRegistration ?? true,
            verifyEndpoints: options.verifyEndpoints ?? false,
        };
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.registry = new ethers.Contract(this.options.registryAddress, IDENTITY_REGISTRY_ABI, this.provider);
    }
    /**
     * Verify an ERC-8004 agent identity by agentId
     */
    async verify(agentId) {
        const checks = [];
        let owner = "";
        let agentWallet = null;
        let agentURI = "";
        let registration = null;
        // Check 1: Agent exists (ownerOf doesn't revert)
        try {
            owner = await this.registry.ownerOf(agentId);
            checks.push({
                name: "agent_exists",
                passed: true,
                details: `Agent #${agentId} exists, owned by ${owner}`,
            });
        }
        catch {
            checks.push({
                name: "agent_exists",
                passed: false,
                details: `Agent #${agentId} does not exist or ownerOf reverted`,
            });
            return this.buildResult(agentId, owner, agentWallet, agentURI, registration, checks);
        }
        // Check 2: Agent has a URI set
        try {
            agentURI = await this.registry.tokenURI(agentId);
            const hasURI = agentURI.length > 0;
            checks.push({
                name: "uri_set",
                passed: hasURI,
                details: hasURI
                    ? `agentURI: ${agentURI.substring(0, 100)}${agentURI.length > 100 ? "..." : ""}`
                    : "agentURI is empty",
            });
        }
        catch {
            checks.push({
                name: "uri_set",
                passed: false,
                details: "Failed to read tokenURI",
            });
        }
        // Check 3: Agent wallet (optional on-chain metadata)
        try {
            const walletAddress = await this.registry.getAgentWallet(agentId);
            if (walletAddress !== ethers.ZeroAddress) {
                agentWallet = walletAddress;
                checks.push({
                    name: "agent_wallet",
                    passed: true,
                    details: `Agent wallet verified: ${walletAddress}`,
                });
            }
            else {
                checks.push({
                    name: "agent_wallet",
                    passed: true,
                    details: "No dedicated agent wallet set (defaults to owner)",
                });
            }
        }
        catch {
            checks.push({
                name: "agent_wallet",
                passed: true,
                details: "getAgentWallet not available (may be older registry version)",
            });
        }
        // Check 4: Fetch and validate registration file
        if (this.options.fetchRegistration && agentURI) {
            try {
                registration = await this.fetchRegistration(agentURI);
                const typeValid = registration.type === "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
                checks.push({
                    name: "registration_type",
                    passed: typeValid,
                    details: typeValid
                        ? "Registration type is valid ERC-8004 v1"
                        : `Invalid type: ${registration.type}`,
                });
                checks.push({
                    name: "registration_name",
                    passed: !!registration.name,
                    details: registration.name
                        ? `Agent name: ${registration.name}`
                        : "Missing agent name",
                });
                checks.push({
                    name: "registration_services",
                    passed: Array.isArray(registration.services) && registration.services.length > 0,
                    details: `${registration.services?.length ?? 0} service(s) listed`,
                });
                // Check self-referencing registration
                if (registration.registrations?.length) {
                    const selfRef = registration.registrations.find((r) => r.agentId === agentId);
                    checks.push({
                        name: "self_registration",
                        passed: !!selfRef,
                        details: selfRef
                            ? `Self-referencing registration found: ${selfRef.agentRegistry}`
                            : "No self-referencing registration entry found",
                    });
                }
                // Check x402 support
                if (registration.x402Support !== undefined) {
                    checks.push({
                        name: "x402_support",
                        passed: true,
                        details: `x402 support: ${registration.x402Support}`,
                    });
                }
            }
            catch (err) {
                checks.push({
                    name: "registration_fetch",
                    passed: false,
                    details: `Failed to fetch/parse registration: ${err instanceof Error ? err.message : String(err)}`,
                });
            }
        }
        // Check 5: Verify endpoint reachability (optional)
        if (this.options.verifyEndpoints && registration?.services) {
            for (const service of registration.services) {
                if (service.endpoint.startsWith("http")) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
                        const res = await fetch(service.endpoint, {
                            method: "HEAD",
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);
                        checks.push({
                            name: `endpoint_${service.name}`,
                            passed: res.ok || res.status === 405 || res.status === 402,
                            details: `${service.name}: ${res.status} ${res.statusText}`,
                        });
                    }
                    catch {
                        checks.push({
                            name: `endpoint_${service.name}`,
                            passed: false,
                            details: `${service.name}: unreachable`,
                        });
                    }
                }
            }
        }
        return this.buildResult(agentId, owner, agentWallet, agentURI, registration, checks);
    }
    /**
     * Quick check — just verifies the agent exists and has an owner
     */
    async exists(agentId) {
        try {
            const owner = await this.registry.ownerOf(agentId);
            return { exists: true, owner };
        }
        catch {
            return { exists: false, owner: null };
        }
    }
    /**
     * Get the registration file for an agent
     */
    async getRegistration(agentId) {
        const uri = await this.registry.tokenURI(agentId);
        return this.fetchRegistration(uri);
    }
    /**
     * Verify that a specific address owns or operates a given agent
     */
    async verifyOwnership(agentId, address) {
        try {
            const owner = await this.registry.ownerOf(agentId);
            return owner.toLowerCase() === address.toLowerCase();
        }
        catch {
            return false;
        }
    }
    /**
     * Fetch and parse an agent registration file from its URI
     */
    async fetchRegistration(uri) {
        let json;
        if (uri.startsWith("data:")) {
            // Base64-encoded data URI
            const match = uri.match(/^data:application\/json;base64,(.+)$/);
            if (!match)
                throw new Error("Invalid data URI format");
            json = Buffer.from(match[1], "base64").toString("utf-8");
        }
        else if (uri.startsWith("ipfs://")) {
            // IPFS — use public gateway
            const cid = uri.replace("ipfs://", "");
            const res = await fetch(`https://ipfs.io/ipfs/${cid}`, {
                signal: AbortSignal.timeout(this.options.timeout),
            });
            if (!res.ok)
                throw new Error(`IPFS fetch failed: ${res.status}`);
            json = await res.text();
        }
        else if (uri.startsWith("http")) {
            const res = await fetch(uri, {
                signal: AbortSignal.timeout(this.options.timeout),
            });
            if (!res.ok)
                throw new Error(`HTTP fetch failed: ${res.status}`);
            json = await res.text();
        }
        else {
            throw new Error(`Unsupported URI scheme: ${uri.substring(0, 20)}...`);
        }
        return JSON.parse(json);
    }
    buildResult(agentId, owner, agentWallet, agentURI, registration, checks) {
        const passed = checks.filter((c) => c.passed).length;
        const total = checks.length;
        const valid = checks.every((c) => c.passed);
        return {
            valid,
            agentId,
            chain: this.chain,
            registry: this.options.registryAddress,
            owner,
            agentWallet,
            agentURI,
            registration,
            checks,
            summary: `${passed}/${total} checks passed${valid ? " ✅" : " ❌"}`,
            verifiedAt: new Date().toISOString(),
        };
    }
}
