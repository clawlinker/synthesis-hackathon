'use client'

import { type ModelInfo } from '@/app/types'
import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
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
  const inputPct = modelInfo
    ? Math.round((modelInfo.inputCost / (modelInfo.inputCost + modelInfo.outputCost)) * 100)
    : 0
  const outputPct = 100 - inputPct

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50 pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-usdc text-[10px] font-bold text-black">
              💰
            </span>
            <CardTitle className="text-sm">LLM Cost Breakdown</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {/* Service */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Service</span>
            <p className="text-sm leading-relaxed">{service}</p>
          </div>

          {/* Total Cost */}
          <Card className="bg-muted/50">
            <CardContent className="flex items-end justify-between p-4">
              <div className="space-y-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Cost</span>
                <p className="text-2xl font-bold tabular-nums">
                  ${amount}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">USD</span>
                </p>
              </div>
              <Badge variant="outline" className="text-usdc border-usdc/30">
                Bankr LLM
              </Badge>
            </CardContent>
          </Card>

          {/* Model Details */}
          {modelInfo && (
            <>
              <Separator />
              <div className="space-y-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Model Details
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Model', value: modelInfo.model },
                    { label: 'Tokens', value: modelInfo.tokens.toLocaleString() },
                    { label: 'Input Cost', value: `$${modelInfo.inputCost.toFixed(4)}` },
                    { label: 'Output Cost', value: `$${modelInfo.outputCost.toFixed(4)}` },
                  ].map((item) => (
                    <Card key={item.label} className="bg-muted/50">
                      <CardContent className="p-3">
                        <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </span>
                        <p className="mt-0.5 text-xs font-medium">{item.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Cost Breakdown
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {inputPct}% input / {outputPct}% output
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-usdc transition-all duration-500"
                    style={{ width: `${inputPct}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
