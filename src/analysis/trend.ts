import type { TrendDirection } from '../models'
import { ema } from './indicators'
export function detectTrend(
  closes: readonly number[],
  fastPeriod = 9,
  slowPeriod = 21,
): TrendDirection {
  const fast = ema(closes, fastPeriod)
  const slow = ema(closes, slowPeriod)
  if (
    !Number.isFinite(fast) ||
    !Number.isFinite(slow) ||
    slow === 0 ||
    Math.abs(fast - slow) / Math.abs(slow) < 0.001
  )
    return 'sideways'
  return fast > slow ? 'bullish' : 'bearish'
}
