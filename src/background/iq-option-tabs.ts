export const IQ_OPTION_MATCHES = [
  'https://*.iqoption.com/*',
  'http://*.iqoption.com/*',
] as const

export function isIqOptionUrl(url: string | undefined): boolean {
  if (!url) return false
  try {
    return /(^|\.)iqoption\.com$/i.test(new URL(url).hostname)
  } catch {
    return false
  }
}

export function selectIqOptionTab(
  preferred: chrome.tabs.Tab | undefined,
  candidates: chrome.tabs.Tab[],
): chrome.tabs.Tab | null {
  if (preferred?.id !== undefined && isIqOptionUrl(preferred.url)) {
    return preferred
  }
  return (
    [...candidates]
      .filter((tab) => tab.id !== undefined && isIqOptionUrl(tab.url))
      .sort(
        (left, right) =>
          Number(right.active) - Number(left.active) ||
          (right.lastAccessed ?? 0) - (left.lastAccessed ?? 0),
      )[0] ?? null
  )
}
