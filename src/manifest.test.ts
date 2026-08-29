import { describe, expect, it } from 'vitest'
import manifest from '../public/manifest.json'

describe('IQ Option extension permissions', () => {
  it('can locate tabs and recover scripts in traderoom pages opened before reload', () => {
    expect(manifest.permissions).toEqual(
      expect.arrayContaining(['tabs', 'scripting']),
    )
    expect(manifest.host_permissions).toEqual(
      expect.arrayContaining([
        'https://*.iqoption.com/*',
        'http://*.iqoption.com/*',
      ]),
    )
    expect(
      manifest.content_scripts.some(
        (script) =>
          script.matches.includes('https://*.iqoption.com/*') &&
          script.js.includes('content-script.js'),
      ),
    ).toBe(true)
  })
})
