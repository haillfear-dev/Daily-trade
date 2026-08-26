import type { Candle, MarketSeries } from '../models'
function candle(timestamp: number, open: number, close: number): Candle {
  return {
    timestamp,
    open,
    high: Math.max(open, close) + 0.4,
    low: Math.min(open, close) - 0.4,
    close,
    volume: 1_000,
  }
}
export function createTrendScenario(
  direction: 'bullish' | 'bearish',
  count = 30,
): MarketSeries {
  return {
    symbol: 'TEST',
    timeframe: '5m',
    candles: Array.from({ length: count }, (_, index) => {
      const base = direction === 'bullish' ? 100 + index : 130 - index
      return candle(
        1_700_000_000_000 + index * 300_000,
        base,
        base + (direction === 'bullish' ? 0.6 : -0.6),
      )
    }),
  }
}
