// Our x402 wallet that receives payments
export const PAYTO_ADDRESS = "0x5793BFc1331538C5A8028e71Cc22B43750163af8";

// Lazy-init to avoid build-time facilitator fetch failures on serverless
let _resourceServer: import("@x402/next").x402ResourceServer | null = null;

export async function getResourceServer() {
  if (!_resourceServer) {
    const { x402ResourceServer } = await import("@x402/next");
    const { HTTPFacilitatorClient } = await import("@x402/core/server");
    const { ExactEvmScheme } = await import("@x402/evm/exact/server");
    const facilitatorClient = new HTTPFacilitatorClient({
      url: "https://facilitator.x402.org",
    });
    _resourceServer = new x402ResourceServer(facilitatorClient)
      .register("eip155:8453", new ExactEvmScheme());
  }
  return _resourceServer;
}
