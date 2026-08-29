import type { MarketContextResponse } from '../messaging/market-context'

const EMPTY_CONTEXT: MarketContextResponse = {
  connected: false,
  tabId: null,
  context: null,
  bridgeStatus: 'no-iq-option-tab',
}

export async function getActiveMarketContext(): Promise<MarketContextResponse> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
    return EMPTY_CONTEXT
  }
  try {
    return await chrome.runtime.sendMessage({
      type: 'market:get-page-context',
    })
  } catch {
    return EMPTY_CONTEXT
  }
}
