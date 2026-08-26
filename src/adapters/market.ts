import type { Candle, MarketSeries } from '../models'
export interface RawCandle {
  time?: number | string
  timestamp?: number | string
  open: number | string
  high: number | string
  low: number | string
  close: number | string
  volume?: number | string
}
export function adaptCandle(raw: RawCandle): Candle {
  const item: Candle = {
    timestamp: Number(raw.timestamp ?? raw.time),
    open: Number(raw.open),
    high: Number(raw.high),
    low: Number(raw.low),
    close: Number(raw.close),
    volume: Number(raw.volume ?? 0),
  }
  if (!Object.values(item).every(Number.isFinite))
    throw new TypeError('Candle contains non-numeric values')
  if (
    item.timestamp < 0 ||
    item.volume < 0 ||
    item.high < item.low ||
    item.high < Math.max(item.open, item.close) ||
    item.low > Math.min(item.open, item.close)
  )
    throw new RangeError('Candle contains invalid market data')
  return item
}
export function adaptMarketSeries(
  symbol: string,
  timeframe: string,
  raw: readonly RawCandle[],
): MarketSeries {
  if (!symbol.trim() || !timeframe.trim())
    throw new TypeError('Symbol and timeframe are required')
  const candles = raw.map(adaptCandle).sort((a, b) => a.timestamp - b.timestamp)
  if (
    candles.some(
      (item, index) =>
        index > 0 && item.timestamp === candles[index - 1].timestamp,
    )
  )
    throw new RangeError('Candle timestamps must be unique')
  return {
    symbol: symbol.trim().toUpperCase(),
    timeframe: timeframe.trim(),
    candles,
  }
}
