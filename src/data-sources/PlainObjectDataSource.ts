import type { DataSource } from '../types'
import { getByPath, setByPath, hasPath, removeByPath, deepClone } from '@/utils'

/**
 * Plain object data source implementation
 * Manages form data using a plain JavaScript object with deep path support
 */
export class PlainObjectDataSource implements DataSource {
  private readonly data: Record<string, unknown>

  constructor(initialData: Record<string, unknown> = {}) {
    this.data = initialData
  }

  get(path: string): unknown {
    return getByPath(this.data, path)
  }

  set(path: string, value: unknown): void {
    setByPath(this.data, path, value)
  }

  all(): Record<string, unknown> {
    return this.data
  }

  arrayAppend(arrayPath: string, value: unknown): void {
    const array = (this.get(arrayPath) || []) as Array<unknown>
    this.arrayInsert(arrayPath, array.length, value)
  }

  arrayPrepend(arrayPath: string, value: unknown): void {
    this.arrayInsert(arrayPath, 0, value)
  }

  arrayInsert(arrayPath: string, index: number, value: unknown): void {
    const array = this.get(arrayPath)

    if (Array.isArray(array)) {
      // Handle negative index
      const normalizedIndex = Math.max(0, index)

      // Handle index beyond array length (append)
      if (normalizedIndex >= array.length) {
        array.push(value)
      } else {
        array.splice(normalizedIndex, 0, value)
      }
    } else {
      this.set(arrayPath, [value])
    }
  }

  arrayRemove(arrayPath: string, index: number): void {
    const array = this.get(arrayPath)

    if (Array.isArray(array) && index >= 0 && index < array.length) {
      array.splice(index, 1)
    }
  }

  arrayMove(arrayPath: string, fromIndex: number, toIndex: number): void {
    const array = this.get(arrayPath)

    if (!Array.isArray(array)) {
      return
    }

    // Validate indices
    if (
      fromIndex < 0 ||
      fromIndex >= array.length ||
      toIndex < 0 ||
      toIndex >= array.length ||
      fromIndex === toIndex
    ) {
      return
    }

    // Move item from fromIndex to toIndex (drag & drop behavior)
    const item = array.splice(fromIndex, 1)[0]
    array.splice(toIndex, 0, item)
  }

  has(path: string): boolean {
    return hasPath(this.data, path)
  }

  remove(path: string): void {
    removeByPath(this.data, path)
  }

  clone(): DataSource {
    return new PlainObjectDataSource(deepClone(this.data))
  }
}
