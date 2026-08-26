export interface Candle { timestamp: number; open: number; high: number; low: number; close: number; volume?: number }
export interface MarketSnapshot { symbol: string; timeframe: number; currentPrice: number; candles: Candle[]; timestamp: number }
export interface PriceZone { type: 'support' | 'resistance'; min: number; max: number; strength: number; touches: number }
export interface PullbackAnalysis { detected: boolean; trendDirection: 'up' | 'down' | 'neutral'; stage: 'impulse' | 'pullback-starting' | 'approaching-zone' | 'rejection' | 'continuation' | 'invalidated'; targetZone?: PriceZone; confidence: number }
export type TradeBias = 'ABOVE' | 'BELOW' | 'WAIT';
export interface TechnicalAnalysis { ema9: number; ema20: number; ema50: number; rsi: number; rsiState: 'oversold' | 'neutral' | 'overbought'; bollinger: BollingerBands; trend: string; zones: PriceZone[]; patterns: string[]; pullback: PullbackAnalysis }
export interface BollingerBands { middle: number; upper: number; lower: number; position: 'above' | 'near-upper' | 'middle' | 'near-lower' | 'below' }
export interface AssetAnalysis { symbol: string; score: 1|2|3|4|5; bias: TradeBias; trend: string; currentPrice: number; primarySupport?: PriceZone; primaryResistance?: PriceZone; entryZone?: {min:number;max:number}; invalidationZone?: {min:number;max:number}; pullback: PullbackAnalysis; reasons: string[]; warning?: string; generatedAt: number; technical: TechnicalAnalysis }
export interface ExpirationOption { timestamp: number; secondsRemaining: number }
export interface TradeEntry { id:string; symbol:string; direction:'ABOVE'|'BELOW'; openedAt:number; expirationAt:number; expirationMinutes:number; timeframe?:number; entryPrice?:number; value:number; payout?:number; result?:'WIN'|'LOSS'|'DRAW'; profitLoss?:number; setup?:string; notes?:string }
export interface DebugInfo { source:string; websocketIdentified:boolean; recognizedMessages:number; updatedAt:number }
