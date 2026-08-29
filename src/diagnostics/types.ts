export type DiagnosticSource = 'websocket' | 'worker' | 'shared-worker'
export type DiagnosticDirection = 'created' | 'received'

export interface MarketDiagnosticEvent {
  id: string
  source: DiagnosticSource
  direction: DiagnosticDirection
  timestamp: number
  url?: string
  host?: string
  payloadType?: 'text' | 'json' | 'array-buffer' | 'blob' | 'other'
  payloadSize?: number
  sample?: string
  classifications: string[]
  marketCandidate: boolean
}

export interface MarketDiagnosticsSnapshot {
  enabled: boolean
  tabId: number | null
  events: MarketDiagnosticEvent[]
  available: boolean
  reloadRequired: boolean
}
