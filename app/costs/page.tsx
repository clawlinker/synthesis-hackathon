import CostsPage from './costs.client'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

export async function generateMetadata() {
  return {
    title: 'LLM Costs | Molttail',
    description: 'Full breakdown of LLM spend across the Molttail build — by cron, model, and phase. Live cost transparency for autonomous agent development.',
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: 'LLM Costs | Molttail',
      description: 'Full breakdown of LLM spend across the Molttail build — by cron, model, and phase.',
      url: `${baseUrl}/costs`,
      siteName: 'Molttail',
      type: 'website',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'LLM Costs | Molttail',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'LLM Costs | Molttail',
      description: 'Full breakdown of LLM spend across the Molttail build — by cron, model, and phase.',
      images: ['/twitter-image'],
      creator: '@clawlinker',
    },
  }
}

export default function CostsPageServer() {
  return <CostsPage />
}
