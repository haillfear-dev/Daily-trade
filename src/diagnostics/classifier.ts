import type { MarketDiagnosticEvent } from './types'

export const DIAGNOSTIC_SAMPLE_LIMIT = 180
const MARKET_FIELDS = [
  'symbol',
  'active',
  'price',
  'quote',
  'candle',
  'open',
  'high',
  'low',
  'close',
  'timestamp',
] as const
const SECRET_KEY =
  /token|secret|password|passwd|cookie|authorization|session|credential|email|phone|user(?:name|id)?/i
const EMAIL = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g

function byteSize(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

function marketKeys(value: unknown, found = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return found
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 20)) marketKeys(item, found)
    return found
  }
  for (const [key, child] of Object.entries(value).slice(0, 50)) {
    const normalized = key.toLowerCase()
    for (const field of MARKET_FIELDS) {
      if (normalized === field || normalized.includes(field)) found.add(field)
    }
    marketKeys(child, found)
  }
  return found
}

function redactText(value: string): string {
  return value
    .replace(BEARER, '[REDACTED]')
    .replace(JWT, '[REDACTED]')
    .replace(EMAIL, '[REDACTED]')
    .replace(
      /([?&](?:token|key|auth|session|signature)=)[^&#\s]+/gi,
      '$1[REDACTED]',
    )
}

function safeMarketShape(value: unknown, depth = 0): unknown {
  if (typeof value === 'string')
    return redactText(value).slice(0, DIAGNOSTIC_SAMPLE_LIMIT)
  if (depth > 3 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    return value.slice(0, 5).map((item) => safeMarketShape(item, depth + 1))
  }
  const result: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value).slice(0, 30)) {
    if (SECRET_KEY.test(key)) continue
    const lower = key.toLowerCase()
    if (MARKET_FIELDS.some((field) => lower.includes(field))) {
      result[key] = safeMarketShape(child, depth + 1)
    } else if (child && typeof child === 'object') {
      const nested = safeMarketShape(child, depth + 1)
      if (nested && Object.keys(nested).length) result[key] = nested
    }
  }
  return result
}

export function sanitizeUrl(raw: string): { url: string; host?: string } {
  try {
    const base =
      typeof location === 'undefined' ? 'https://invalid.local/' : location.href
    const parsed = new URL(raw, base)
    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) {
      return { url: `${parsed.protocol}[redacted]` }
    }
    // Keep only the origin: paths can themselves contain session identifiers.
    return { url: `${parsed.protocol}//${parsed.host}`, host: parsed.host }
  } catch {
    return { url: '[unavailable]' }
  }
}

export function classifyTextPayload(
  text: string,
): Pick<
  MarketDiagnosticEvent,
  | 'payloadType'
  | 'payloadSize'
  | 'sample'
  | 'classifications'
  | 'marketCandidate'
> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = undefined
  }
  const classifications = parsed
    ? [...marketKeys(parsed)]
    : MARKET_FIELDS.filter((field) =>
        new RegExp(`\\b${field}\\b`, 'i').test(text),
      )
  const marketCandidate = classifications.length > 0
  let sample: string | undefined
  if (marketCandidate) {
    const safe = parsed
      ? JSON.stringify(safeMarketShape(parsed))
      : redactText(text)
    sample = safe.slice(0, DIAGNOSTIC_SAMPLE_LIMIT)
  }
  return {
    payloadType: parsed ? 'json' : 'text',
    payloadSize: byteSize(text),
    sample,
    classifications,
    marketCandidate,
  }
}

export function classifyPayload(
  data: unknown,
): Pick<
  MarketDiagnosticEvent,
  | 'payloadType'
  | 'payloadSize'
  | 'sample'
  | 'classifications'
  | 'marketCandidate'
> {
  if (typeof data === 'string') return classifyTextPayload(data)
  if (data instanceof ArrayBuffer) {
    return {
      payloadType: 'array-buffer',
      payloadSize: data.byteLength,
      classifications: [],
      marketCandidate: false,
    }
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return {
      payloadType: 'blob',
      payloadSize: data.size,
      classifications: [],
      marketCandidate: false,
    }
  }
  return { payloadType: 'other', classifications: [], marketCandidate: false }
}
