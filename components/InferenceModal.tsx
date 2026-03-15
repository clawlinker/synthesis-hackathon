'use client'

import { type ModelInfo } from '@/app/types'
import { useEffect, useRef } from 'react'

interface InferenceModalProps {
  isOpen: boolean
  onClose: () => void
  receipt: {
    timestamp: number
    service: string
    amount: string
    modelInfo?: ModelInfo
  } | null
}

export function InferenceModal({ isOpen, onClose, receipt }: InferenceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !receipt) return null

  const { service, amount, modelInfo } = receipt

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-bg-primary)] shadow-2xl transition-all duration-300"
        style={{
          animation: 'scaleIn 0.2s ease-out forwards',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: 'var(--color-usdc)', color: 'black' }}
            >
              💰
            </span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              LLM Cost Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Service info */}
          <div className="space-y-1">
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Service
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
              {service}
            </p>
          </div>

          {/* Total Cost */}
          <div className="flex items-end justify-between rounded-xl bg-white/5 p-4">
            <div className="space-y-1">
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Total Cost
              </span>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                ${amount}
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {' '}USD
                </span>
              </p>
            </div>
            <div className="text-right">
              <span
                className="inline-flex rounded-full px-2 py-1 text-[10px] font-medium"
                style={{ background: 'var(--color-usdc)/10', color: 'var(--color-usdc)' }}
              >
                Bankr LLM
              </span>
            </div>
          </div>

          {/* Model details if available */}
          {modelInfo && (
            <div className="space-y-3">
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Model Details
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <span
                    className="block text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Model
                  </span>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {modelInfo.model}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <span
                    className="block text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Tokens
                  </span>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    {modelInfo.tokens.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <span
                    className="block text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Input Cost
                  </span>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    ${modelInfo.inputCost.toFixed(4)} USD
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <span
                    className="block text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Output Cost
                  </span>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                    ${modelInfo.outputCost.toFixed(4)} USD
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cost breakdown bar */}
          {modelInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Cost Breakdown
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {Math.round((modelInfo.inputCost / (modelInfo.inputCost + modelInfo.outputCost)) * 100)}% input / {Math.round((modelInfo.outputCost / (modelInfo.inputCost + modelInfo.outputCost)) * 100)}% output
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(modelInfo.inputCost / (modelInfo.inputCost + modelInfo.outputCost)) * 100}%`,
                    background: 'var(--color-usdc)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 bg-white/5 p-4 text-center">
          <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            Click to view cost breakdown for this inference receipt
          </p>
        </div>
      </div>
    </div>
  )
}
