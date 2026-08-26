import type { TrendDirection } from '../models'
import { ema } from './indicators'
export function detectPullback(
  closes: readonly number[],
  trend: TrendDirection,
  period = 9,
  tolerance = 0.005,
): boolean {
  if (closes.length < period || trend === 'sideways') return false
  const average = ema(closes, period)
  const close = closes.at(-1)!
  const previous = closes.at(-2) ?? close
  return (
    Math.abs(close - average) / average <= tolerance &&
    (trend === 'bullish' ? close >= previous : close <= previous)
  )
}
