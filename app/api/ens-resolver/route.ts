import { NextResponse } from 'next/server';

/**
 * ENS Offchain Resolver Gateway for Agent Communication
 * 
 * This resolver provides agent-to-agent and agent-to-human communication metadata
 * for clawlinker.eth and related ENS names.
 * 
 * Implements ENSIP-10 style offchain resolution via HTTP gateway pattern.
 */

interface ResolverRequest {
  name: string;
  recordType: 'text' | 'addr' | 'contenthash' | 'agent_comm' | 'communication';
  key?: string; // for text records
}

interface ResolverResponse {
  data: string;
  contentType: string;
  ttl?: number;
}

// Communication metadata for Clawlinker agent
const COMMUNICATION_METADATA = {
  'clawlinker.eth': {
    // Agent-to-human communication
    telegram: '@clawlinker',
    discord: 'clawlinker#0001', // placeholder
    // Agent-to-agent communication
    xmtp: '0x5793BFc1331538C5A8028e71Cc22B43750163af8', // wallet-based XMTP
    a2a: 'https://pawr.link/api/a2a/clawlinker', // Agent2Agent protocol
    // Social/identity
    farcaster: '@clawlinker',
    moltbook: 'Clawlinker',
    x: '@clawlinker',
    // Agent manifest/identity
    agent_json: 'https://molttail.vercel.app/.well-known/agent.json',
    ens_ip25: 'https://www.8004scan.io/agents/ethereum/22945', // ENSIP-25 verification
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'clawlinker.eth';
  const recordType = (searchParams.get('type') as 'text' | 'addr' | 'contenthash' | 'agent_comm' | 'communication') || 'text';
  const key = searchParams.get('key');

  const metadata = COMMUNICATION_METADATA[name as keyof typeof COMMUNICATION_METADATA];

  if (!metadata) {
    return NextResponse.json(
      { error: 'Name not found', data: '0x' },
      { status: 404 }
    );
  }

  let result: ResolverResponse;

  switch (recordType) {
    case 'text':
      if (!key) {
        // Return all text records
        const allTextRecords = Object.entries(metadata)
          .map(([k, v]) => `${k}=${v}`)
          .join('\n');
        result = { data: allTextRecords, contentType: 'text/plain' };
      } else if (key in metadata) {
        result = { data: metadata[key as keyof typeof metadata], contentType: 'text/plain' };
      } else {
        result = { data: '', contentType: 'text/plain' }; // Record not found
      }
      break;

    case 'agent_comm':
    case 'communication':
      // Agent-to-agent communication metadata
      result = {
        data: JSON.stringify(metadata, null, 2),
        contentType: 'application/json',
        ttl: 3600 // 1 hour cache
      };
      break;

    case 'addr':
      // Ethereum address for clawlinker.eth
      result = {
        data: '0x5793BFc1331538C5A8028e71Cc22B43750163af8',
        contentType: 'application/ethereum-address'
      };
      break;

    case 'contenthash':
      // IPFS/ENSIP-15 content hash for agent manifest
      result = {
        data: '0xe30101701220' + 'a'.repeat(64), // placeholder - real IPFS hash would go here
        contentType: 'application/contenthash'
      };
      break;

    default:
      result = { data: '0x', contentType: 'application/octet-stream' };
  }

  const response = NextResponse.json(
    { data: result.data, contentType: result.contentType, ttl: result.ttl },
    { status: 200 }
  );

  // CORS headers for offchain resolver
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
