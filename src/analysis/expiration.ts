const PATTERN = /^(\d+)(m|h|d)$/
export function timeframeToMilliseconds(timeframe: string): number {
  const match = PATTERN.exec(timeframe)
  if (!match) throw new Error(`Unsupported timeframe: ${timeframe}`)
  const factor =
    match[2] === 'm' ? 60_000 : match[2] === 'h' ? 3_600_000 : 86_400_000
  return Number(match[1]) * factor
}
export function calculateExpiration(
  generatedAt: number,
  timeframe: string,
  candleCount = 3,
): number {
  if (!Number.isInteger(candleCount) || candleCount <= 0)
    throw new RangeError('Candle count must be a positive integer')
  return generatedAt + timeframeToMilliseconds(timeframe) * candleCount
}
export function isExpired(expiresAt: number, now = Date.now()): boolean {
  return now >= expiresAt
}
