import {
  isMarketContextGetMessage,
  isMarketPageContextMessage,
  type MarketContextResponse,
} from '../messaging/market-context'
import type { MarketPageContext } from '../models'
import { LimitedBuffer } from '../diagnostics/buffer'
import type {
  MarketDiagnosticEvent,
  MarketDiagnosticsSnapshot,
} from '../diagnostics/types'
import {
  diagnosticsMessageType,
  isDiagnosticsEventMessage,
  type DiagnosticsMessage,
} from '../messaging/diagnostics'

const contextByTab = new Map<number, MarketPageContext>()
const diagnosticsByTab = new Map<number, LimitedBuffer<MarketDiagnosticEvent>>()
const diagnosticsEnabled = new Map<number, boolean>()
const DIAGNOSTIC_EVENT_LIMIT = 100
const storageKey = (tabId: number) => `market-context:${tabId}`
const diagnosticsStorageKey = (tabId: number) => `market-diagnostics:${tabId}`

function removeContext(tabId: number) {
  contextByTab.delete(tabId)
  diagnosticsByTab.delete(tabId)
  diagnosticsEnabled.delete(tabId)
  void chrome.storage.session.remove([
    storageKey(tabId),
    diagnosticsStorageKey(tabId),
  ])
}

async function getContext(tabId: number): Promise<MarketPageContext | null> {
  const cached = contextByTab.get(tabId)
  if (cached) return cached
  const stored = await chrome.storage.session.get(storageKey(tabId))
  const context = stored[storageKey(tabId)] as MarketPageContext | undefined
  if (context) contextByTab.set(tabId, context)
  return context ?? null
}

async function getDiagnostics(
  tabId: number,
): Promise<MarketDiagnosticsSnapshot> {
  let buffer = diagnosticsByTab.get(tabId)
  if (!buffer) {
    const stored = await chrome.storage.session.get(
      diagnosticsStorageKey(tabId),
    )
    const snapshot = stored[diagnosticsStorageKey(tabId)] as
      MarketDiagnosticsSnapshot | undefined
    buffer = new LimitedBuffer(DIAGNOSTIC_EVENT_LIMIT)
    for (const event of snapshot?.events ?? []) buffer.push(event)
    diagnosticsByTab.set(tabId, buffer)
    diagnosticsEnabled.set(tabId, snapshot?.enabled ?? false)
  }
  return {
    enabled: diagnosticsEnabled.get(tabId) ?? false,
    tabId,
    events: buffer.toArray(),
  }
}

async function storeDiagnostics(snapshot: MarketDiagnosticsSnapshot) {
  if (snapshot.tabId === null) return
  await chrome.storage.session.set({
    [diagnosticsStorageKey(snapshot.tabId)]: snapshot,
  })
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

    const diagnosticType = diagnosticsMessageType(message)
    if (
      diagnosticType === 'diagnostics:event' &&
      isDiagnosticsEventMessage(message)
    ) {
      const tabId = sender.tab?.id
      if (tabId === undefined) return false
      void getDiagnostics(tabId).then((snapshot) => {
        if (!snapshot.enabled) return
        const buffer = diagnosticsByTab.get(tabId)
        buffer?.push(message.payload)
        void storeDiagnostics({ ...snapshot, events: buffer?.toArray() ?? [] })
      })
      return false
    }

    if (
      diagnosticType === 'diagnostics:get' ||
      diagnosticType === 'diagnostics:set-enabled'
    ) {
      const resolveTabId = async () => {
        if (
          diagnosticType === 'diagnostics:get' &&
          sender.tab?.id !== undefined
        ) {
          return sender.tab.id
        }
        const [tab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        })
        return tab?.id ?? null
      }
      void resolveTabId().then(async (tabId) => {
        if (tabId === null) {
          sendResponse({
            enabled: false,
            tabId: null,
            events: [],
          } satisfies MarketDiagnosticsSnapshot)
          return
        }
        const snapshot = await getDiagnostics(tabId)
        if (diagnosticType === 'diagnostics:set-enabled') {
          const enabled =
            (
              message as Extract<
                DiagnosticsMessage,
                { type: 'diagnostics:set-enabled' }
              >
            ).enabled === true
          diagnosticsEnabled.set(tabId, enabled)
          snapshot.enabled = enabled
          await storeDiagnostics(snapshot)
          await chrome.tabs
            .sendMessage(tabId, {
              type: 'diagnostics:content-control',
              enabled,
            } satisfies DiagnosticsMessage)
            .catch(() => undefined)
        }
        sendResponse(snapshot)
      })
      return true
    }
    return false
  },
)
