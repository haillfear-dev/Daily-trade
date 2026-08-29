import { describe, expect, it } from 'vitest'
import {
  isIqOptionPage,
  normalizeIqOptionSymbol,
  readIqOptionPageContext,
} from './iq-option-page'

describe('IQ Option page adapter', () => {
  it('accepts IQ Option hosts but rejects lookalikes', () => {
    expect(isIqOptionPage(new URL('https://iqoption.com/traderoom'))).toBe(true)
    expect(isIqOptionPage(new URL('https://eu.iqoption.com/traderoom'))).toBe(
      true,
    )
    expect(isIqOptionPage(new URL('https://iqoption.com.example.org'))).toBe(
      false,
    )
  })

  it('normalizes regular and OTC symbols', () => {
    expect(normalizeIqOptionSymbol('EUR/USD (OTC)')).toEqual({
      symbol: 'EURUSD-OTC',
      displaySymbol: 'EUR/USD (OTC)',
      isOtc: true,
    })
    expect(normalizeIqOptionSymbol('GBP / USD')).toEqual({
      symbol: 'GBPUSD',
      displaySymbol: 'GBP/USD',
      isOtc: false,
    })
  })

  it('reads semantic asset and product elements defensively', () => {
    const element = (textContent: string) =>
      ({
        hidden: false,
        innerText: textContent,
        textContent,
        getAttribute: () => null,
      }) as unknown as Element
    const document = {
      location: { href: 'https://iqoption.com/traderoom' },
      querySelectorAll: (selector: string) => {
        if (selector === '[data-testid="instrument-name"]') {
          return [element('AUD/USD (OTC)')]
        }
        if (selector === '[data-testid="instrument-type"]') {
          return [element('Digital')]
        }
        return []
      },
    } as unknown as Document
    const context = readIqOptionPageContext(
      document,
      new URL('https://iqoption.com/traderoom'),
      123,
    )
    expect(context).toMatchObject({
      symbol: 'AUDUSD-OTC',
      displaySymbol: 'AUD/USD (OTC)',
      isOtc: true,
      product: 'digital',
      updatedAt: 123,
    })
  })
})
