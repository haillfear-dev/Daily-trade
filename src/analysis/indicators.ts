import type { Candle } from '../models'
function validatePeriod(period: number) {
  if (!Number.isInteger(period) || period <= 0)
    throw new RangeError('Period must be a positive integer')
}
export function sma(values: readonly number[], period: number): number {
  validatePeriod(period)
  if (values.length < period) return Number.NaN
  return values.slice(-period).reduce((sum, value) => sum + value, 0) / period
}
export function ema(values: readonly number[], period: number): number {
  validatePeriod(period)
  if (values.length < period) return Number.NaN
  const factor = 2 / (period + 1)
  let result =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) / period
  for (const value of values.slice(period))
    result = (value - result) * factor + result
  return result
}
export function rsi(values: readonly number[], period = 14): number {
  validatePeriod(period)
  if (values.length <= period) return Number.NaN
  const sample = values.slice(-(period + 1))
  const changes = sample.slice(1).map((value, index) => value - sample[index])
  const gains =
    changes.reduce((sum, value) => sum + Math.max(value, 0), 0) / period
  const losses =
    changes.reduce((sum, value) => sum + Math.max(-value, 0), 0) / period
  if (losses === 0) return gains === 0 ? 50 : 100
  return 100 - 100 / (1 + gains / losses)
}
export function atr(candles: readonly Candle[], period = 14): number {
  validatePeriod(period)
  if (candles.length <= period) return Number.NaN
  const sample = candles.slice(-(period + 1))
  return (
    sample
      .slice(1)
      .reduce(
        (sum, item, index) =>
          sum +
          Math.max(
            item.high - item.low,
            Math.abs(item.high - sample[index].close),
            Math.abs(item.low - sample[index].close),
          ),
        0,
      ) / period
  )
}
