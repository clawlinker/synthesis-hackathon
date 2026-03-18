import BuildLogPage from './build-log.client'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://molttail.vercel.app'

export async function generateMetadata() {
  return {
    title: 'Build Log | Molttail',
    description: 'Autonomous build activity — commits, cron pipelines, agent decisions. Live transparency into how Molttail was built.',
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: 'Build Log | Molttail',
      description: 'Autonomous build activity — commits, cron pipelines, agent decisions.',
      url: `${baseUrl}/build-log`,
      siteName: 'Molttail',
      type: 'website',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Build Log | Molttail',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Build Log | Molttail',
      description: 'Autonomous build activity — commits, cron pipelines, agent decisions.',
      images: ['/twitter-image'],
      creator: '@clawlinker',
    },
  }
}

export default function BuildLogPageServer() {
  return <BuildLogPage />
}
