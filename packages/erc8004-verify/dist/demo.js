/**
 * Demo: Verify Clawlinker's ERC-8004 identity (#22945) on Ethereum
 *
 * Run: npm run build && npm run demo
 */
import { ERC8004Verifier } from "./index.js";
async function main() {
    console.log("🐾 ERC-8004 Agent Verification Demo\n");
    console.log("Verifying Clawlinker (Agent #22945) on Ethereum...\n");
    const verifier = new ERC8004Verifier({
        chain: "ethereum",
        fetchRegistration: true,
        verifyEndpoints: true,
    });
    const result = await verifier.verify(22945);
    console.log("=== Verification Result ===\n");
    console.log(`Agent ID:     #${result.agentId}`);
    console.log(`Chain:        ${result.chain}`);
    console.log(`Registry:     ${result.registry}`);
    console.log(`Owner:        ${result.owner}`);
    console.log(`Agent Wallet: ${result.agentWallet ?? "(defaults to owner)"}`);
    console.log(`Agent URI:    ${result.agentURI?.substring(0, 80)}...`);
    console.log(`Valid:        ${result.valid ? "✅ YES" : "❌ NO"}`);
    console.log(`Summary:      ${result.summary}`);
    console.log(`Verified at:  ${result.verifiedAt}`);
    if (result.registration) {
        console.log("\n=== Registration File ===\n");
        console.log(`Name:         ${result.registration.name}`);
        console.log(`Description:  ${result.registration.description?.substring(0, 100)}...`);
        console.log(`x402 Support: ${result.registration.x402Support}`);
        console.log(`Active:       ${result.registration.active}`);
        console.log(`Services:     ${result.registration.services?.length ?? 0}`);
        result.registration.services?.forEach((s) => {
            console.log(`  - ${s.name}: ${s.endpoint}`);
        });
        console.log(`Trust Models: ${result.registration.supportedTrust?.join(", ") ?? "none"}`);
    }
    console.log("\n=== Individual Checks ===\n");
    result.checks.forEach((check) => {
        console.log(`${check.passed ? "✅" : "❌"} ${check.name}: ${check.details}`);
    });
    // Quick existence check
    console.log("\n=== Quick Checks ===\n");
    const exists = await verifier.exists(22945);
    console.log(`Agent #22945 exists: ${exists.exists} (owner: ${exists.owner})`);
    const nonExistent = await verifier.exists(999999999);
    console.log(`Agent #999999999 exists: ${nonExistent.exists}`);
}
main().catch(console.error);
