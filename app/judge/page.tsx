import JudgePage from './judge.client'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

export async function generateMetadata() {
  return {
    title: 'Judge Mode | Molttail',
    description: 'Self-referential dashboard for judges — autonomous development insights, cost transparency, and agent execution logs.',
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: 'Judge Mode | Molttail',
      description: 'Self-referential dashboard for judges — autonomous development insights, cost transparency, and agent execution logs.',
      url: `${baseUrl}/judge`,
      siteName: 'Molttail',
      type: 'website',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Judge Mode | Molttail',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Judge Mode | Molttail',
      description: 'Self-referential dashboard for judges — autonomous development insights, cost transparency, and agent execution logs.',
      images: ['/twitter-image'],
      creator: '@clawlinker',
    },
  }
}

export default function JudgePageServer() {
  return <JudgePage />
}
