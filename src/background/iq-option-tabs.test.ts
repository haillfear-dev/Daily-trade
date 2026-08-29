import { describe, expect, it } from 'vitest'
import { isIqOptionUrl, selectIqOptionTab } from './iq-option-tabs'

const tab = (id: number, url: string, active = false): chrome.tabs.Tab =>
  ({
    id,
    url,
    active,
    highlighted: false,
    incognito: false,
    pinned: false,
  }) as chrome.tabs.Tab

describe('IQ Option tab selection', () => {
  it('recognizes the root traderoom and subdomains but not lookalikes', () => {
    expect(isIqOptionUrl('https://iqoption.com/traderoom')).toBe(true)
    expect(isIqOptionUrl('https://eu.iqoption.com/traderoom')).toBe(true)
    expect(isIqOptionUrl('https://iqoption.com.example.org/traderoom')).toBe(
      false,
    )
  })

  it('keeps the preferred active IQ Option tab', () => {
    const preferred = tab(7, 'https://iqoption.com/traderoom', true)
    expect(
      selectIqOptionTab(preferred, [tab(8, 'https://eu.iqoption.com')])?.id,
    ).toBe(7)
  })

  it('falls back to an open IQ Option tab when the preferred tab is an extension page', () => {
    const selected = selectIqOptionTab(
      tab(1, 'chrome-extension://extension-id/index.html', true),
      [tab(9, 'https://iqoption.com/traderoom', true)],
    )
    expect(selected?.id).toBe(9)
  })
})
