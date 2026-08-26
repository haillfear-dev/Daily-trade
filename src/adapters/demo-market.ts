import type { Candle, MarketSeries } from '../models'

export interface MarketDataAdapter {
  loadSnapshots(): Promise<MarketSeries[]>
}

const START = 1_735_689_600_000
function makeSeries(symbol: string, closes: readonly number[]): MarketSeries {
  const candles: Candle[] = closes.map((close, index) => {
    const previous = closes[index - 1] ?? close
    const open = previous
    const wick = symbol === 'GBP/USD' ? 0.00032 : 0.00018
    return {
      timestamp: START + index * 300_000,
      open,
      high: Math.max(open, close) + wick,
      low: Math.min(open, close) - wick,
      close,
      volume: 900 + index * 7,
    }
  })
  return { symbol, timeframe: '5m', candles }
}

function sequence(count: number, valueAt: (index: number) => number): number[] {
  return Array.from({ length: count }, (_, index) =>
    Number(valueAt(index).toFixed(5)),
  )
}

export class DemoMarketDataAdapter implements MarketDataAdapter {
  async loadSnapshots(): Promise<MarketSeries[]> {
    const aud = sequence(60, (index) =>
      index < 54
        ? 0.706 + index * 0.00008 + Math.sin(index / 3) * 0.00008
        : [0.71042, 0.7103, 0.71018, 0.71005, 0.71008, 0.71014][index - 54],
    )
    const eur = sequence(
      60,
      (index) => 1.0842 + Math.sin(index / 2.2) * 0.00022,
    )
    const gbp = sequence(60, (index) =>
      index < 51 ? 1.274 - index * 0.00008 : 1.2699 - (index - 51) * 0.00042,
    )
    return [
      makeSeries('AUD/USD', aud),
      makeSeries('EUR/USD', eur),
      makeSeries('GBP/USD', gbp),
    ]
  }
}
