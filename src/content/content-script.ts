import {
  isIqOptionPage,
  readIqOptionPageContext,
} from '../adapters/iq-option-page'
import type { MarketPageContextMessage } from '../messaging/market-context'

const UPDATE_DEBOUNCE_MS = 350

if (isIqOptionPage(window.location)) {
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
}
