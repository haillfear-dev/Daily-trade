import {
  isIqOptionPage,
  readIqOptionPageContext,
} from '../adapters/iq-option-page'
import type { MarketPageContextMessage } from '../messaging/market-context'
import {
  DIAGNOSTICS_BRIDGE_SOURCE,
  isDiagnosticsBridgeEvent,
  type DiagnosticsBridgeMessage,
} from '../diagnostics/bridge'
import type {
  DiagnosticsMessage,
  DiagnosticsResponse,
} from '../messaging/diagnostics'

const UPDATE_DEBOUNCE_MS = 350
const contentState = globalThis as typeof globalThis & {
  __dailyTradeContentRuntime?: typeof chrome.runtime
}

if (
  isIqOptionPage(window.location) &&
  contentState.__dailyTradeContentRuntime !== chrome.runtime
) {
  contentState.__dailyTradeContentRuntime = chrome.runtime
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastFingerprint = ''

  const publishContext = () => {
    timer = undefined
    const context = readIqOptionPageContext(document)
    const fingerprint = JSON.stringify({
      symbol: context.symbol,
      product: context.product,
      pageUrl: context.pageUrl,
    })
    if (fingerprint === lastFingerprint) return
    lastFingerprint = fingerprint
    const message: MarketPageContextMessage = {
      type: 'market:page-context',
      payload: context,
    }
    void chrome.runtime.sendMessage(message).catch(() => {
      // The extension may be reloaded while this isolated script is alive.
    })
  }

  const scheduleUpdate = () => {
    clearTimeout(timer)
    timer = setTimeout(publishContext, UPDATE_DEBOUNCE_MS)
  }

  const observer = new MutationObserver(scheduleUpdate)
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'data-testid', 'data-test', 'aria-selected'],
  })
  publishContext()

  const controlDiagnostics = (enabled: boolean) => {
    const control: DiagnosticsBridgeMessage = {
      source: DIAGNOSTICS_BRIDGE_SOURCE,
      type: 'control',
      enabled,
    }
    window.postMessage(control, window.location.origin)
  }

  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.source !== window || !isDiagnosticsBridgeEvent(event.data)) return
    const message: DiagnosticsMessage = {
      type: 'diagnostics:event',
      payload: event.data.event,
    }
    void chrome.runtime.sendMessage(message).catch(() => undefined)
  })

  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      if (
        message &&
        typeof message === 'object' &&
        (message as { type?: unknown }).type === 'integration:ping'
      ) {
        sendResponse(true)
        return false
      }
      if (
        message &&
        typeof message === 'object' &&
        (message as Partial<DiagnosticsMessage>).type ===
          'diagnostics:content-control'
      ) {
        controlDiagnostics((message as { enabled?: unknown }).enabled === true)
      }
      return false
    },
  )

  void chrome.runtime
    .sendMessage<DiagnosticsMessage, DiagnosticsResponse>({
      type: 'diagnostics:get',
    })
    .then((snapshot) => controlDiagnostics(snapshot.enabled))
    .catch(() => undefined)
}
