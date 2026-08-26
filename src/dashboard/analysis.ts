import type { MarketSeries, TechnicalAnalysis, TrendDirection } from '../models'
import { analyzeMarket } from '../analysis/engine'
import { ema } from '../analysis/indicators'

export type DashboardSignal = 'ABOVE' | 'BELOW' | 'WAIT'
export type OpportunityState =
  'WAITING' | 'IN_ZONE' | 'CONFIRMATION' | 'ACTIVE' | 'INVALIDATED'

export interface ExpirationOption {
  label: string
  timestamp: number
}
export interface DashboardAsset {
  rank: number
  symbol: string
  signal: DashboardSignal
  timing: string
  state: OpportunityState
  stars: number
  price: number
  trend: TrendDirection
  rsi: number
  ema9: number
  ema20: number
  ema50: number
  bollinger: { lower: number; middle: number; upper: number }
  support: [number, number]
  resistance: [number, number]
  pullback: boolean
  pullbackConfidence: number
  confidence: number
  extendedMove: boolean
  entryZone: [number, number]
  invalidationZone: [number, number]
  reasons: string[]
  warning: string | null
  expiration: string
  analysis: TechnicalAnalysis
  source: string
  candleCount: number
  timestamp: number
  timeframe: string
  rawScore: number
  patterns: string[]
}

export function translateSignal(signal: DashboardSignal): string {
  return signal === 'ABOVE'
    ? 'ACIMA'
    : signal === 'BELOW'
      ? 'ABAIXO'
      : 'ESPERAR'
}

export function starsFromScore(score: number): number {
  return Math.max(1, Math.min(5, Math.round(score / 20)))
}

export function selectClosestExpiration(
  options: readonly ExpirationOption[],
  target: number,
): ExpirationOption | null {
  if (options.length === 0) return null
  return options.reduce((best, option) =>
    Math.abs(option.timestamp - target) < Math.abs(best.timestamp - target)
      ? option
      : best,
  )
}

function bollinger(closes: readonly number[], period = 20) {
  const values = closes.slice(-period)
  const middle = values.reduce((sum, value) => sum + value, 0) / values.length
  const deviation = Math.sqrt(
    values.reduce((sum, value) => sum + (value - middle) ** 2, 0) /
      values.length,
  )
  return {
    lower: middle - deviation * 2,
    middle,
    upper: middle + deviation * 2,
  }
}

function rangeAround(value: number, size: number): [number, number] {
  return [value - size, value + size]
}

function toDashboardAsset(
  series: MarketSeries,
  generatedAt: number,
): DashboardAsset {
  const analysis = analyzeMarket(series, { generatedAt })
  const closes = series.candles.map((candle) => candle.close)
  const price = closes.at(-1)!
  const ema9 = ema(closes, 9)
  const ema20 = ema(closes, 20)
  const ema50 = ema(closes, 50)
  const emaSeparation = Math.abs(ema9 - ema20) / price
  const trend: TrendDirection =
    emaSeparation < 0.00008 ? 'sideways' : ema9 > ema20 ? 'bullish' : 'bearish'
  const bands = bollinger(closes)
  const distance = Math.abs(price - ema20)
  const extendedMove =
    (trend === 'bearish' && distance > analysis.indicators.atr * 0.8) ||
    (trend === 'bullish' &&
      analysis.indicators.rsi > 80 &&
      distance > analysis.indicators.atr * 3.5)
  const pullbackConfidence = analysis.pullback
    ? 82
    : distance <= analysis.indicators.atr * 0.65
      ? 64
      : 28
  const signal: DashboardSignal =
    trend === 'bullish' && !extendedMove
      ? 'ABOVE'
      : trend === 'bearish' && !extendedMove
        ? 'BELOW'
        : 'WAIT'
  const rawScore =
    signal === 'ABOVE' ? 78 : signal === 'BELOW' ? 68 : extendedMove ? 30 : 40
  const confidence =
    signal === 'WAIT' ? Math.max(35, rawScore) : Math.max(62, rawScore)
  const size = Math.max(analysis.indicators.atr * 0.18, price * 0.0002)
  const supportValue = Math.min(
    ...series.candles.slice(-14).map((candle) => candle.low),
  )
  const resistanceValue = Math.max(
    ...series.candles.slice(-14).map((candle) => candle.high),
  )
  const timing = extendedMove
    ? 'NÃO ENTRAR AGORA · AGUARDAR PULLBACK'
    : analysis.pullback
      ? 'AGUARDAR CONFIRMAÇÃO'
      : signal === 'WAIT'
        ? 'SEM CONFIRMAÇÃO CLARA'
        : 'AGUARDAR ENTRADA NA ZONA'
  const state: OpportunityState = extendedMove
    ? 'WAITING'
    : analysis.pullback
      ? 'CONFIRMATION'
      : signal === 'WAIT'
        ? 'WAITING'
        : 'IN_ZONE'
  const reasons = extendedMove
    ? [
        'Tendência principal preservada',
        'Preço distante da média de equilíbrio',
        'Risco de entrada tardia',
      ]
    : signal === 'WAIT'
      ? ['Mercado lateral', 'Confluências ainda insuficientes']
      : [
          'Tendência curta alinhada',
          analysis.pullback
            ? 'Pullback próximo da média'
            : 'Estrutura direcional preservada',
          'EMA20 próxima da zona de interesse',
        ]
  const expirations: ExpirationOption[] = [250, 310, 370, 600].map(
    (seconds) => ({
      label:
        seconds < 300
          ? '~4m'
          : seconds < 360
            ? '~5m'
            : seconds < 500
              ? '~6m'
              : '~10m',
      timestamp: generatedAt + seconds * 1000,
    }),
  )
  return {
    rank: 0,
    symbol: series.symbol,
    signal,
    timing,
    state,
    stars: starsFromScore(rawScore),
    price,
    trend,
    rsi: analysis.indicators.rsi,
    ema9,
    ema20,
    ema50,
    bollinger: bands,
    support: rangeAround(supportValue, size),
    resistance: rangeAround(resistanceValue, size),
    pullback: analysis.pullback,
    pullbackConfidence,
    confidence,
    extendedMove,
    entryZone: rangeAround(
      signal === 'BELOW' ? resistanceValue : supportValue,
      size,
    ),
    invalidationZone: rangeAround(
      signal === 'BELOW'
        ? resistanceValue + analysis.indicators.atr
        : supportValue - analysis.indicators.atr,
      size,
    ),
    reasons,
    warning: extendedMove
      ? 'Movimento esticado: aguarde o preço retornar à zona.'
      : signal === 'WAIT'
        ? 'Não entrar sem nova confirmação.'
        : null,
    expiration:
      selectClosestExpiration(expirations, generatedAt + 300_000)?.label ?? '—',
    analysis,
    source: 'DemoMarketDataAdapter',
    candleCount: series.candles.length,
    timestamp: series.candles.at(-1)!.timestamp,
    timeframe: series.timeframe.toUpperCase(),
    rawScore,
    patterns: analysis.patterns,
  }
}

export function rankAssets(
  series: readonly MarketSeries[],
  generatedAt = Date.now(),
): DashboardAsset[] {
  return series
    .map((item) => toDashboardAsset(item, generatedAt))
    .sort((a, b) => b.rawScore - a.rawScore || a.symbol.localeCompare(b.symbol))
    .map((item, index) => ({ ...item, rank: index + 1 }))
}
