import type { MarketSeries, TechnicalAnalysis } from '../models'
import { calculateExpiration } from './expiration'
import { atr, ema, rsi, sma } from './indicators'
import { detectPriceAction } from './price-action'
import { detectPullback } from './pullback'
import { scoreSetup } from './scoring'
import { detectTrend } from './trend'
import { findZones } from './zones'
export interface EngineOptions {
  fastPeriod?: number
  slowPeriod?: number
  generatedAt?: number
}
export function analyzeMarket(
  series: MarketSeries,
  options: EngineOptions = {},
): TechnicalAnalysis {
  const fastPeriod = options.fastPeriod ?? 9
  const slowPeriod = options.slowPeriod ?? 21
  if (series.candles.length <= slowPeriod)
    throw new RangeError(`At least ${slowPeriod + 1} candles are required`)
  const closes = series.candles.map((item) => item.close)
  const trend = detectTrend(closes, fastPeriod, slowPeriod)
  const patterns = detectPriceAction(series.candles)
  const pullback = detectPullback(closes, trend, fastPeriod)
  const indicatorRsi = rsi(closes)
  const scored = scoreSetup({ trend, rsi: indicatorRsi, patterns, pullback })
  const generatedAt = options.generatedAt ?? Date.now()
  return {
    symbol: series.symbol,
    timeframe: series.timeframe,
    generatedAt,
    expiresAt: calculateExpiration(generatedAt, series.timeframe),
    trend,
    ...scored,
    indicators: {
      smaFast: sma(closes, fastPeriod),
      smaSlow: sma(closes, slowPeriod),
      emaFast: ema(closes, fastPeriod),
      emaSlow: ema(closes, slowPeriod),
      rsi: indicatorRsi,
      atr: atr(series.candles),
    },
    zones: findZones(series.candles),
    patterns,
    pullback,
  }
}
