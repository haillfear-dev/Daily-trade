import { describe, expect, it } from 'vitest'
import { LimitedBuffer } from './buffer'

describe('LimitedBuffer', () => {
  it('retains only the newest values and returns a copy', () => {
    const buffer = new LimitedBuffer<number>(3)
    for (const value of [1, 2, 3, 4, 5]) buffer.push(value)
    const values = buffer.toArray()
    expect(values).toEqual([3, 4, 5])
    values.push(6)
    expect(buffer.toArray()).toEqual([3, 4, 5])
  })

  it('rejects invalid limits', () => {
    expect(() => new LimitedBuffer(0)).toThrow('Buffer limit must be positive')
  })
})
