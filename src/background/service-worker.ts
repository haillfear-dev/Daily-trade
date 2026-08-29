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
import {
  IQ_OPTION_MATCHES,
  isIqOptionUrl,
  selectIqOptionTab,
} from './iq-option-tabs'

const contextByTab = new Map<number, MarketPageContext>()
const diagnosticsByTab = new Map<number, LimitedBuffer<MarketDiagnosticEvent>>()
const diagnosticsEnabled = new Map<number, boolean>()
const injectedAtByTab = new Map<number, number>()
const injectionByTab = new Map<number, Promise<boolean>>()
const DIAGNOSTIC_EVENT_LIMIT = 100
const storageKey = (tabId: number) => `market-context:${tabId}`
const diagnosticsStorageKey = (tabId: number) => `market-diagnostics:${tabId}`

function removeContext(tabId: number) {
  contextByTab.delete(tabId)
  diagnosticsByTab.delete(tabId)
  diagnosticsEnabled.delete(tabId)
  injectedAtByTab.delete(tabId)
  injectionByTab.delete(tabId)
  void chrome.storage.session.remove([
    storageKey(tabId),
    diagnosticsStorageKey(tabId),
  ])
}

async function resolveIqOptionTab(): Promise<chrome.tabs.Tab | null> {
  const [preferred] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  const candidates = await chrome.tabs.query({ url: [...IQ_OPTION_MATCHES] })
  return selectIqOptionTab(preferred, candidates)
}

function ensureIqOptionScripts(tabId: number): Promise<boolean> {
  const existing = injectionByTab.get(tabId)
  if (existing) return existing
  if (injectedAtByTab.has(tabId)) return Promise.resolve(true)

  const injection = (async () => {
    try {
      const alreadyListening = await chrome.tabs
        .sendMessage(tabId, { type: 'integration:ping' })
        .then((response) => response === true)
        .catch(() => false)
      if (alreadyListening) {
        injectedAtByTab.set(tabId, Date.now())
        return true
      }
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['diagnostics-main.js'],
        world: 'MAIN',
      })
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js'],
        world: 'ISOLATED',
      })
      injectedAtByTab.set(tabId, Date.now())
      return true
    } catch {
      return false
    } finally {
      injectionByTab.delete(tabId)
    }
  })()
  injectionByTab.set(tabId, injection)
  return injection
}

async function injectIntoOpenIqOptionTabs() {
  const tabs = await chrome.tabs.query({ url: [...IQ_OPTION_MATCHES] })
  await Promise.all(
    tabs.flatMap((tab) =>
      tab.id === undefined ? [] : [ensureIqOptionScripts(tab.id)],
    ),
  )
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
    available: true,
    reloadRequired: false,
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
  void injectIntoOpenIqOptionTabs()
})
chrome.runtime.onStartup.addListener(() => void injectIntoOpenIqOptionTabs())

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
        injectedAtByTab.set(sender.tab.id, Date.now())
        contextByTab.set(sender.tab.id, message.payload)
        void chrome.storage.session.set({
          [storageKey(sender.tab.id)]: message.payload,
        })
      }
      return false
    }

    if (isMarketContextGetMessage(message)) {
      void resolveIqOptionTab().then(async (tab) => {
        const tabId = tab?.id ?? null
        if (tabId === null) {
          sendResponse({
            connected: false,
            tabId: null,
            context: null,
            bridgeStatus: 'no-iq-option-tab',
          } satisfies MarketContextResponse)
          return
        }
        let context = await getContext(tabId)
        let injected = true
        if (!context) injected = await ensureIqOptionScripts(tabId)
        context = context ?? (await getContext(tabId))
        const injectionAge = Date.now() - (injectedAtByTab.get(tabId) ?? 0)
        const response: MarketContextResponse = {
          connected: context !== null,
          tabId,
          context,
          bridgeStatus: context
            ? 'connected'
            : !injected || injectionAge > 5_000
              ? 'reload-required'
              : 'injecting',
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
        return (await resolveIqOptionTab())?.id ?? null
      }
      void resolveTabId().then(async (tabId) => {
        if (tabId === null) {
          sendResponse({
            enabled: false,
            tabId: null,
            events: [],
            available: false,
            reloadRequired: false,
          } satisfies MarketDiagnosticsSnapshot)
          return
        }
        const snapshot = await getDiagnostics(tabId)
        const injected = await ensureIqOptionScripts(tabId)
        snapshot.available = isIqOptionUrl(
          (await chrome.tabs.get(tabId).catch(() => undefined))?.url,
        )
        snapshot.reloadRequired = !injected
        if (diagnosticType === 'diagnostics:set-enabled') {
          const enabled =
            (
              message as Extract<
                DiagnosticsMessage,
                { type: 'diagnostics:set-enabled' }
              >
            ).enabled === true
          if (!snapshot.available || snapshot.reloadRequired) {
            snapshot.enabled = false
            sendResponse(snapshot)
            return
          }
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
