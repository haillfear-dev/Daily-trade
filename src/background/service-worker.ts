import {
  isMarketContextGetMessage,
  isMarketPageContextMessage,
  type MarketContextResponse,
} from '../messaging/market-context'
import type { MarketPageContext } from '../models'

const contextByTab = new Map<number, MarketPageContext>()
const storageKey = (tabId: number) => `market-context:${tabId}`

function removeContext(tabId: number) {
  contextByTab.delete(tabId)
  void chrome.storage.session.remove(storageKey(tabId))
}

async function getContext(tabId: number): Promise<MarketPageContext | null> {
  const cached = contextByTab.get(tabId)
  if (cached) return cached
  const stored = await chrome.storage.session.get(storageKey(tabId))
  const context = stored[storageKey(tabId)] as MarketPageContext | undefined
  if (context) contextByTab.set(tabId, context)
  return context ?? null
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

chrome.tabs.onRemoved.addListener(removeContext)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' || changeInfo.url) {
    removeContext(tabId)
  }
})

chrome.runtime.onMessage.addListener(
  (message: unknown, sender, sendResponse) => {
    if (isMarketPageContextMessage(message)) {
      if (sender.tab?.id !== undefined) {
        contextByTab.set(sender.tab.id, message.payload)
        void chrome.storage.session.set({
          [storageKey(sender.tab.id)]: message.payload,
        })
      }
      return false
    }

    if (isMarketContextGetMessage(message)) {
      void chrome.tabs
        .query({ active: true, lastFocusedWindow: true })
        .then(async ([tab]) => {
          const tabId = tab?.id ?? null
          const context = tabId === null ? null : await getContext(tabId)
          const response: MarketContextResponse = {
            connected: context !== null,
            tabId,
            context,
          }
          sendResponse(response)
        })
      return true
    }
    return false
  },
)
