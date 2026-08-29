import { describe, expect, it } from 'vitest'
import {
  classifyPayload,
  classifyTextPayload,
  DIAGNOSTIC_SAMPLE_LIMIT,
  sanitizeUrl,
} from './classifier'

describe('market diagnostic classifier', () => {
  it('classifies market JSON and keeps only a bounded safe shape', () => {
    const result = classifyTextPayload(
      JSON.stringify({
        symbol: 'EURUSD',
        candle: { open: 1.1, close: 1.2 },
        authorization: 'Bearer secret',
        profile: { email: 'person@example.com' },
      }),
    )
    expect(result.marketCandidate).toBe(true)
    expect(result.classifications).toEqual(
      expect.arrayContaining(['symbol', 'candle', 'open', 'close']),
    )
    expect(result.sample).not.toContain('secret')
    expect(result.sample).not.toContain('person@example.com')
    expect(result.sample?.length).toBeLessThanOrEqual(DIAGNOSTIC_SAMPLE_LIMIT)
  })

  it('redacts credentials and personal identifiers from text samples', () => {
    const result = classifyTextPayload(
      'price=1.25 email=person@example.com Bearer abc.def.ghi',
    )
    expect(result.sample).toContain('price')
    expect(result.sample).not.toContain('person@example.com')
    expect(result.sample).not.toContain('abc.def.ghi')
  })

  it('does not inspect or sample binary payloads', () => {
    const result = classifyPayload(new ArrayBuffer(32))
    expect(result).toEqual({
      payloadType: 'array-buffer',
      payloadSize: 32,
      classifications: [],
      marketCandidate: false,
    })
  })

  it('removes query parameters and credentials from source URLs', () => {
    expect(
      sanitizeUrl('wss://user:pass@feed.example/ws?token=secret#part'),
    ).toEqual({
      url: 'wss://feed.example',
      host: 'feed.example',
    })
  })
})
