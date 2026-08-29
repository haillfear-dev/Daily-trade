import type { MarketPageContext, MarketProduct } from '../models'

const IQ_OPTION_HOST = /(^|\.)iqoption\.com$/i

// IQ Option changes its class names regularly. Keep all DOM knowledge in this
// adapter and favor semantic attributes before using conservative fallbacks.
const ASSET_SELECTORS = [
  '[data-testid="instrument-name"]',
  '[data-test="instrument-name"]',
  '[data-test="asset-name"]',
  '[class*="instrument"] [class*="name"]',
  '[class*="active-asset"]',
  '[class*="asset-title"]',
] as const

const PRODUCT_SELECTORS = [
  '[data-testid="instrument-type"]',
  '[data-test="instrument-type"]',
  '[class*="instrument-type"]',
  '[class*="option-type"]',
] as const

const SYMBOL_PATTERN = /\b([A-Z]{3})\s*[/-]\s*([A-Z]{3})(\s*\(\s*OTC\s*\))?\b/i

export function isIqOptionPage(location: Location | URL): boolean {
  return IQ_OPTION_HOST.test(location.hostname)
}

export function normalizeIqOptionSymbol(raw: string): {
  symbol: string
  displaySymbol: string
  isOtc: boolean
} | null {
  const match = raw.replace(/\s+/g, ' ').match(SYMBOL_PATTERN)
  if (!match) return null
  const base = `${match[1].toUpperCase()}/${match[2].toUpperCase()}`
  const isOtc = Boolean(match[3]) || /\bOTC\b/i.test(raw)
  return {
    symbol: `${match[1].toUpperCase()}${match[2].toUpperCase()}${isOtc ? '-OTC' : ''}`,
    displaySymbol: `${base}${isOtc ? ' (OTC)' : ''}`,
    isOtc,
  }
}

function visibleText(element: Element | null): string | null {
  if (!element) return null
  const htmlElement = element as HTMLElement
  if (
    htmlElement.hidden ||
    htmlElement.getAttribute('aria-hidden') === 'true'
  ) {
    return null
  }
  return htmlElement.innerText?.trim() || element.textContent?.trim() || null
}

function detectSymbol(document: Document) {
  for (const selector of ASSET_SELECTORS) {
    for (const element of document.querySelectorAll(selector)) {
      const normalized = normalizeIqOptionSymbol(visibleText(element) ?? '')
      if (normalized) return normalized
    }
  }

  // Defensive fallback: inspect short, visible labels only, rather than the
  // entire page text (which may contain symbols from asset pickers).
  const labels = document.querySelectorAll(
    'button, [role="button"], [role="tab"], header span',
  )
  for (const label of labels) {
    const text = visibleText(label)
    if (!text || text.length > 40) continue
    const normalized = normalizeIqOptionSymbol(text)
    if (normalized) return normalized
  }
  return null
}

function detectProduct(document: Document, url: URL): MarketProduct {
  const texts = PRODUCT_SELECTORS.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector), visibleText),
  ).filter((value): value is string => Boolean(value))
  texts.push(url.pathname, url.hash)
  const evidence = texts.join(' ')
  if (/\bblitz\b/i.test(evidence)) return 'blitz'
  if (/\bdigital\b/i.test(evidence)) return 'digital'
  return 'unknown'
}

export function readIqOptionPageContext(
  document: Document,
  url = new URL(document.location.href),
  now = Date.now(),
): MarketPageContext {
  const asset = detectSymbol(document)
  return {
    provider: 'iq-option',
    symbol: asset?.symbol ?? null,
    displaySymbol: asset?.displaySymbol ?? null,
    isOtc: asset?.isOtc ?? false,
    product: detectProduct(document, url),
    pageUrl: url.href,
    updatedAt: now,
  }
}
