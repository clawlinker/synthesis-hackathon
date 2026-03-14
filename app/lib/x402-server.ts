import { x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

// CDP Facilitator for x402 payment verification
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://facilitator.x402.org",
});

// Resource server with Base mainnet (chain ID 8453 = eip155:8453)
export const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:8453", new ExactEvmScheme());

// Our x402 wallet that receives payments
export const PAYTO_ADDRESS = "0x5793BFc1331538C5A8028e71Cc22B43750163af8";
