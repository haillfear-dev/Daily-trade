import type { MarketDiagnosticsSnapshot } from '../diagnostics/types'
import type { DiagnosticsMessage } from '../messaging/diagnostics'

const EMPTY: MarketDiagnosticsSnapshot = {
  enabled: false,
  tabId: null,
  events: [],
}

async function request(
  message: DiagnosticsMessage,
): Promise<MarketDiagnosticsSnapshot> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage)
    return EMPTY
  try {
    return await chrome.runtime.sendMessage(message)
  } catch {
    return EMPTY
  }
}

export const getDiagnostics = () => request({ type: 'diagnostics:get' })
export const setDiagnosticsEnabled = (enabled: boolean) =>
  request({ type: 'diagnostics:set-enabled', enabled })
