import { describe, expect, it } from 'vitest'
import { adaptCandle, adaptMarketSeries } from '../adapters/market'
import { createTrendScenario } from '../fixtures/scenarios'
import { analyzeMarket } from './engine'
import {
  calculateExpiration,
  isExpired,
  timeframeToMilliseconds,
} from './expiration'
import { atr, ema, rsi, sma } from './indicators'
import { detectPriceAction } from './price-action'
import { scoreSetup } from './scoring'
import { detectTrend } from './trend'
describe('technical indicators', () => {
  it('calculates SMA and EMA', () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toBe(4)
    expect(ema([1, 2, 3, 4, 5], 3)).toBe(4)
  })
  it('returns NaN without enough samples', () => {
    expect(sma([1], 2)).toBeNaN()
    expect(rsi([1, 2], 14)).toBeNaN()
  })
  it('calculates RSI boundaries', () => {
    expect(
      rsi(
        Array.from({ length: 16 }, (_, index) => index),
        14,
      ),
    ).toBe(100)
    expect(rsi(Array(16).fill(2), 14)).toBe(50)
  })
  it('calculates ATR', () => {
    expect(atr(createTrendScenario('bullish').candles)).toBeCloseTo(1.4)
  })
})
describe('market analysis', () => {
  it('detects both trend directions', () => {
    expect(
      detectTrend(
        createTrendScenario('bullish').candles.map((item) => item.close),
      ),
    ).toBe('bullish')
    expect(
      detectTrend(
        createTrendScenario('bearish').candles.map((item) => item.close),
      ),
    ).toBe('bearish')
  })
  it('detects an engulfing candle', () => {
    expect(
      detectPriceAction([
        { timestamp: 1, open: 3, high: 3, low: 1, close: 2, volume: 1 },
        { timestamp: 2, open: 1.5, high: 4, low: 1, close: 3.5, volume: 1 },
      ]),
    ).toContain('bullish-engulfing')
  })
  it('scores confluence', () => {
    expect(
      scoreSetup({
        trend: 'bullish',
        rsi: 55,
        patterns: ['bullish-engulfing'],
        pullback: true,
      }),
    ).toMatchObject({ side: 'long', score: 100, strength: 'strong' })
  })
  it('orchestrates a deterministic analysis', () => {
    const result = analyzeMarket(createTrendScenario('bullish'), {
      generatedAt: 1_000,
    })
    expect(result).toMatchObject({
      symbol: 'TEST',
      trend: 'bullish',
      side: 'long',
      generatedAt: 1_000,
      expiresAt: 901_000,
    })
    expect(result.indicators.atr).toBeGreaterThan(0)
  })
  it('rejects insufficient history', () => {
    expect(() => analyzeMarket(createTrendScenario('bullish', 10))).toThrow(
      'At least 22',
    )
  })
})
describe('market adapter and expiration', () => {
  it('normalizes and sorts raw candles', () => {
    const series = adaptMarketSeries(' petr4 ', '5m', [
      { time: 2, open: '2', high: 3, low: 1, close: 2, volume: 1 },
      { time: 1, open: 1, high: 2, low: 0, close: 1, volume: 1 },
    ])
    expect(series.symbol).toBe('PETR4')
    expect(series.candles[0].timestamp).toBe(1)
  })
  it('rejects malformed candles', () => {
    expect(() =>
      adaptCandle({ time: 1, open: 5, high: 4, low: 2, close: 3 }),
    ).toThrow('invalid market data')
  })
  it('converts timeframes and expiration', () => {
    expect(timeframeToMilliseconds('1h')).toBe(3_600_000)
    expect(calculateExpiration(1_000, '5m', 2)).toBe(601_000)
    expect(isExpired(10, 10)).toBe(true)
  })
  it('rejects unsupported timeframes', () => {
    expect(() => timeframeToMilliseconds('weekly')).toThrow(
      'Unsupported timeframe',
    )
  })
})
