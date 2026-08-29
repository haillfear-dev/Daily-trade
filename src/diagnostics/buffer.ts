export class LimitedBuffer<T> {
  private values: T[] = []

  constructor(private readonly limit: number) {
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error('Buffer limit must be positive')
  }

  push(value: T) {
    this.values.push(value)
    if (this.values.length > this.limit)
      this.values.splice(0, this.values.length - this.limit)
  }

  toArray(): T[] {
    return [...this.values]
  }

  clear() {
    this.values = []
  }
}
