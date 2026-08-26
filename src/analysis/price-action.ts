import type { Candle } from '../models'
export function detectPriceAction(candles: readonly Candle[]): string[] {
  if (candles.length < 2) return []
  const p = candles.at(-2)!
  const c = candles.at(-1)!
  const result: string[] = []
  const pl = Math.min(p.open, p.close)
  const ph = Math.max(p.open, p.close)
  const cl = Math.min(c.open, c.close)
  const ch = Math.max(c.open, c.close)
  if (c.close > c.open && p.close < p.open && cl <= pl && ch >= ph)
    result.push('bullish-engulfing')
  if (c.close < c.open && p.close > p.open && cl <= pl && ch >= ph)
    result.push('bearish-engulfing')
  const range = c.high - c.low
  if (range > 0 && Math.abs(c.close - c.open) / range <= 0.1)
    result.push('doji')
  return result
}
