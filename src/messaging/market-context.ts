import type { MarketPageContext } from '../models'

export interface MarketPageContextMessage {
  type: 'market:page-context'
  payload: MarketPageContext
}

export interface MarketContextGetMessage {
  type: 'market:get-page-context'
}

export interface MarketContextResponse {
  connected: boolean
  tabId: number | null
  context: MarketPageContext | null
}

export type MarketContextMessage =
  MarketPageContextMessage | MarketContextGetMessage

export function isMarketPageContextMessage(
  message: unknown,
): message is MarketPageContextMessage {
  if (!message || typeof message !== 'object') return false
  const candidate = message as Partial<MarketPageContextMessage>
  return (
    candidate.type === 'market:page-context' &&
    candidate.payload?.provider === 'iq-option' &&
    typeof candidate.payload.updatedAt === 'number'
  )
}

export function isMarketContextGetMessage(
  message: unknown,
): message is MarketContextGetMessage {
  return (
    !!message &&
    typeof message === 'object' &&
    (message as Partial<MarketContextGetMessage>).type ===
      'market:get-page-context'
  )
}
