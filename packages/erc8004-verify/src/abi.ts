/**
 * ERC-8004 Identity Registry ABI (minimal subset for verification)
 * Full spec: https://eips.ethereum.org/EIPS/eip-8004
 */
export const IDENTITY_REGISTRY_ABI = [
  // ERC-721 standard
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",

  // ERC-8004 specific
  "function getMetadata(uint256 agentId, string metadataKey) view returns (bytes)",
  "function getAgentWallet(uint256 agentId) view returns (address)",

  // Events
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
  "event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)",
  "event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)",
] as const;

/**
 * ERC-8004 Reputation Registry ABI (minimal subset)
 */
export const REPUTATION_REGISTRY_ABI = [
  "function getIdentityRegistry() view returns (address)",
  "function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)",
  "function readFeedback(uint256 agentId, address clientAddress, uint64 feedbackIndex) view returns (int128 value, uint8 valueDecimals, string tag1, string tag2, bool isRevoked)",
  "function getClients(uint256 agentId) view returns (address[])",
  "function getLastIndex(uint256 agentId, address clientAddress) view returns (uint64)",

  "event NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value, uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)",
] as const;

/**
 * Known ERC-8004 Identity Registry deployments
 */
export const KNOWN_REGISTRIES: Record<string, { address: string; chainId: number; name: string }> = {
  "ethereum": {
    address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    chainId: 1,
    name: "Ethereum Mainnet",
  },
  "base": {
    address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    chainId: 8453,
    name: "Base",
  },
  "sepolia": {
    address: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    chainId: 11155111,
    name: "Sepolia Testnet",
  },
};
