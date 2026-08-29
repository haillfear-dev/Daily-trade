import type { MarketDiagnosticEvent } from './types'

export const DIAGNOSTICS_BRIDGE_SOURCE = 'daily-trade:market-diagnostics'

export type DiagnosticsBridgeMessage =
  | {
      source: typeof DIAGNOSTICS_BRIDGE_SOURCE
      type: 'control'
      enabled: boolean
    }
  | {
      source: typeof DIAGNOSTICS_BRIDGE_SOURCE
      type: 'event'
      event: MarketDiagnosticEvent
    }

export function isDiagnosticsBridgeEvent(
  value: unknown,
): value is Extract<DiagnosticsBridgeMessage, { type: 'event' }> {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<DiagnosticsBridgeMessage>
  if (
    message.source !== DIAGNOSTICS_BRIDGE_SOURCE ||
    message.type !== 'event' ||
    !message.event
  )
    return false
  const event = message.event as Partial<MarketDiagnosticEvent>
  const unsafeSample =
    typeof event.sample === 'string' &&
    (/@[\w.-]+\.[A-Za-z]{2,}/.test(event.sample) ||
      /\bBearer\s+/i.test(event.sample) ||
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./.test(event.sample))
  const unsafeUrl =
    typeof event.url === 'string' &&
    (event.url.includes('?') ||
      event.url.includes('#') ||
      /:\/\/[^/]*@/.test(event.url))
  return (
    ['websocket', 'worker', 'shared-worker'].includes(event.source ?? '') &&
    ['created', 'received'].includes(event.direction ?? '') &&
    typeof event.timestamp === 'number' &&
    typeof event.id === 'string' &&
    event.id.length <= 80 &&
    (event.sample === undefined ||
      (typeof event.sample === 'string' && event.sample.length <= 180)) &&
    !unsafeSample &&
    !unsafeUrl &&
    Array.isArray(event.classifications) &&
    event.classifications.every(
      (item) => typeof item === 'string' && item.length <= 20,
    ) &&
    typeof event.marketCandidate === 'boolean'
  )
}
