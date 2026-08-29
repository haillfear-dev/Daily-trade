import type {
  MarketDiagnosticEvent,
  MarketDiagnosticsSnapshot,
} from '../diagnostics/types'

export type DiagnosticsMessage =
  | { type: 'diagnostics:event'; payload: MarketDiagnosticEvent }
  | { type: 'diagnostics:set-enabled'; enabled: boolean }
  | { type: 'diagnostics:get' }
  | { type: 'diagnostics:content-control'; enabled: boolean }

export type DiagnosticsResponse = MarketDiagnosticsSnapshot

export function isDiagnosticsEventMessage(
  value: unknown,
): value is Extract<DiagnosticsMessage, { type: 'diagnostics:event' }> {
  if (!value || typeof value !== 'object') return false
  const message = value as Partial<
    Extract<DiagnosticsMessage, { type: 'diagnostics:event' }>
  >
  return message.type === 'diagnostics:event' && !!message.payload
}

export function diagnosticsMessageType(
  value: unknown,
): DiagnosticsMessage['type'] | null {
  if (!value || typeof value !== 'object') return null
  const type = (value as { type?: unknown }).type
  return typeof type === 'string' && type.startsWith('diagnostics:')
    ? (type as DiagnosticsMessage['type'])
    : null
}
