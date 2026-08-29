export type TrendDirection = 'bullish' | 'bearish' | 'sideways'
export type TradeSide = 'long' | 'short'
export type SignalStrength = 'weak' | 'moderate' | 'strong'
export type MarketProduct = 'blitz' | 'digital' | 'unknown'
export interface MarketPageContext {
  provider: 'iq-option'
  symbol: string | null
  displaySymbol: string | null
  isOtc: boolean
  product: MarketProduct
  pageUrl: string
  updatedAt: number
}
export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
export interface MarketSeries {
  symbol: string
  timeframe: string
  candles: Candle[]
}
export interface PriceZone {
  kind: 'support' | 'resistance'
  lower: number
  upper: number
  touches: number
}
export interface IndicatorSnapshot {
  smaFast: number
  smaSlow: number
  emaFast: number
  emaSlow: number
  rsi: number
  atr: number
}
export interface AnalysisReason {
  code: string
  description: string
  points: number
}
export interface TechnicalAnalysis {
  symbol: string
  timeframe: string
  generatedAt: number
  expiresAt: number
  trend: TrendDirection
  side: TradeSide | null
  strength: SignalStrength
  score: number
  indicators: IndicatorSnapshot
  zones: PriceZone[]
  patterns: string[]
  pullback: boolean
  reasons: AnalysisReason[]
}
