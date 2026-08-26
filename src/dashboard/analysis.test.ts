import { describe, expect, it } from 'vitest'
import {
  DemoMarketDataAdapter,
  type MarketDataAdapter,
} from '../adapters/demo-market'
import type { MarketSeries } from '../models'
import {
  rankAssets,
  selectClosestExpiration,
  starsFromScore,
  translateSignal,
} from './analysis'
import { loadDashboard } from './load'

async function rankedDemo() {
  return rankAssets(
    await new DemoMarketDataAdapter().loadSnapshots(),
    1_735_707_300_000,
  )
}

describe('dashboard analysis', () => {
  it('ranks the visual assets in opportunity order', async () => {
    const assets = await rankedDemo()
    expect(assets.map((asset) => asset.symbol)).toEqual([
      'AUD/USD',
      'EUR/USD',
      'GBP/USD',
    ])
    expect(assets.map((asset) => asset.rank)).toEqual([1, 2, 3])
  })
  it.each([
    ['ABOVE', 'ACIMA'],
    ['BELOW', 'ABAIXO'],
    ['WAIT', 'ESPERAR'],
  ] as const)('translates %s to %s', (signal, label) => {
    expect(translateSignal(signal)).toBe(label)
  })
  it('converts raw scores into bounded stars', () => {
    expect(starsFromScore(78)).toBe(4)
    expect(starsFromScore(100)).toBe(5)
    expect(starsFromScore(0)).toBe(1)
  })
  it('marks the stretched bearish movement as wait', async () => {
    const gbp = (await rankedDemo()).find(
      (asset) => asset.symbol === 'GBP/USD',
    )!
    expect(gbp.extendedMove).toBe(true)
    expect(gbp.signal).toBe('WAIT')
    expect(gbp.timing).toContain('NÃO ENTRAR AGORA')
  })
  it('exposes pullback state and confidence', async () => {
    const aud = (await rankedDemo())[0]
    expect(aud.symbol).toBe('AUD/USD')
    expect(aud.pullbackConfidence).toBeGreaterThanOrEqual(28)
    expect(['IN_ZONE', 'CONFIRMATION']).toContain(aud.state)
  })
  it('selects the expiration closest to target', () => {
    const selected = selectClosestExpiration(
      [
        { label: '~4m', timestamp: 250_000 },
        { label: '~5m', timestamp: 310_000 },
        { label: '~6m', timestamp: 370_000 },
      ],
      300_000,
    )
    expect(selected?.label).toBe('~5m')
  })
  it('shows a suggested expiration in every ranked asset', async () => {
    expect(
      (await rankedDemo()).every((asset) => asset.expiration === '~5m'),
    ).toBe(true)
  })
})

describe('dashboard loading states', () => {
  it('handles an empty adapter', async () => {
    const adapter: MarketDataAdapter = { loadSnapshots: async () => [] }
    await expect(loadDashboard(adapter)).resolves.toEqual({
      status: 'empty',
      assets: [],
    })
  })
  it('handles an adapter error', async () => {
    const error = new Error('offline')
    const adapter: MarketDataAdapter = {
      loadSnapshots: async (): Promise<MarketSeries[]> => {
        throw error
      },
    }
    const result = await loadDashboard(adapter)
    expect(result.status).toBe('error')
    expect(result.assets).toEqual([])
  })
})
