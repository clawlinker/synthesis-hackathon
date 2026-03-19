import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/judge/summary.json',
        destination: '/api/judge/summary/json',
      },
    ]
  },
}

export default nextConfig
