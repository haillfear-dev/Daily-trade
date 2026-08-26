import type { Candle, PriceZone } from '../models'
export function findZones(
  candles: readonly Candle[],
  tolerance = 0.003,
): PriceZone[] {
  if (candles.length < 3) return []
  const pivots: Array<{ kind: PriceZone['kind']; price: number }> = []
  for (let i = 1; i < candles.length - 1; i += 1) {
    if (
      candles[i].low <= candles[i - 1].low &&
      candles[i].low <= candles[i + 1].low
    )
      pivots.push({ kind: 'support', price: candles[i].low })
    if (
      candles[i].high >= candles[i - 1].high &&
      candles[i].high >= candles[i + 1].high
    )
      pivots.push({ kind: 'resistance', price: candles[i].high })
  }
  const zones: PriceZone[] = []
  for (const pivot of pivots) {
    const found = zones.find(
      (zone) =>
        zone.kind === pivot.kind &&
        Math.abs((zone.lower + zone.upper) / 2 - pivot.price) / pivot.price <=
          tolerance,
    )
    if (found) {
      found.lower = Math.min(found.lower, pivot.price * (1 - tolerance))
      found.upper = Math.max(found.upper, pivot.price * (1 + tolerance))
      found.touches += 1
    } else
      zones.push({
        kind: pivot.kind,
        lower: pivot.price * (1 - tolerance),
        upper: pivot.price * (1 + tolerance),
        touches: 1,
      })
  }
  return zones.sort((a, b) => b.touches - a.touches)
}
