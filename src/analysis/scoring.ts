import type {
  AnalysisReason,
  SignalStrength,
  TradeSide,
  TrendDirection,
} from '../models'
export interface ScoreInput {
  trend: TrendDirection
  rsi: number
  patterns: readonly string[]
  pullback: boolean
}
export interface ScoreResult {
  side: TradeSide | null
  score: number
  strength: SignalStrength
  reasons: AnalysisReason[]
}
export function scoreSetup(input: ScoreInput): ScoreResult {
  const reasons: AnalysisReason[] = []
  const side =
    input.trend === 'bullish'
      ? 'long'
      : input.trend === 'bearish'
        ? 'short'
        : null
  if (side)
    reasons.push({
      code: 'trend',
      description: `Trend is ${input.trend}`,
      points: 40,
    })
  const pattern = side === 'long' ? 'bullish-engulfing' : 'bearish-engulfing'
  if (side && input.patterns.includes(pattern))
    reasons.push({
      code: 'price-action',
      description: 'Price action confirms the trend',
      points: 25,
    })
  if (
    side &&
    Number.isFinite(input.rsi) &&
    (side === 'long'
      ? input.rsi >= 45 && input.rsi <= 70
      : input.rsi >= 30 && input.rsi <= 55)
  )
    reasons.push({
      code: 'momentum',
      description: 'RSI confirms momentum',
      points: 20,
    })
  if (side && input.pullback)
    reasons.push({
      code: 'pullback',
      description: 'Price returned to the fast average',
      points: 15,
    })
  const score = reasons.reduce((sum, reason) => sum + reason.points, 0)
  const strength: SignalStrength =
    score >= 75 ? 'strong' : score >= 40 ? 'moderate' : 'weak'
  return { side, score, strength, reasons }
}
