import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Molttail — Agent Payment Receipts'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(39,117,202,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(39,117,202,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-100px',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(39,117,202,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Top: logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: '#2775CA',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            🧾
          </div>
          <span style={{ color: '#2775CA', fontSize: '22px', fontWeight: 700, letterSpacing: '0.05em' }}>
            MOLTTAIL
          </span>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1 }}>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '800px',
            }}
          >
            Every payment your agent makes,{' '}
            <span style={{ color: '#2775CA' }}>verified</span> and visible.
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#6b7280',
              fontWeight: 400,
              maxWidth: '640px',
              lineHeight: 1.5,
            }}
          >
            Live audit trail for autonomous agent transactions on Base.
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff' }}>130+</span>
              <span style={{ fontSize: '14px', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Receipts tracked
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#22c55e' }}>$47.80</span>
              <span style={{ fontSize: '14px', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Total volume
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '16px' }}>
            <span>Built by</span>
            <span style={{ color: '#2775CA', fontWeight: 700 }}>🐾 Clawlinker</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
