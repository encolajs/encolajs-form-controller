import type { DataSource } from '../types'
import {
  getByPath,
  setByPath,
  hasPath,
  removeByPath,
  deepClone
} from '../utils/pathUtils'
import {
  moveArrayItem,
  removeArrayItem,
  insertArrayItem,
  pushArrayItem
} from '../utils/arrayUtils'

/**
 * Plain object data source implementation
 * Manages form data using a plain JavaScript object with deep path support
 */
export class PlainObjectDataSource implements DataSource {
  private data: Record<string, unknown>

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

  arrayPush(arrayPath: string, value: unknown): void {
    const array = this.get(arrayPath)
    const resultArray = pushArrayItem(array as any[], value)

    // If a new array was created, set it at the path
    if (!Array.isArray(array)) {
      this.set(arrayPath, resultArray)
    }
  }

  arrayInsert(arrayPath: string, index: number, value: unknown): void {
    const array = this.get(arrayPath)

    if (Array.isArray(array)) {
      insertArrayItem(array, index, value)
    } else {
      // Create new array if path doesn't exist or isn't an array
      this.set(arrayPath, [value])
    }
  }

  arrayRemove(arrayPath: string, index: number): void {
    const array = this.get(arrayPath)

    if (Array.isArray(array)) {
      removeArrayItem(array, index)
    }
  }

  arrayMove(arrayPath: string, fromIndex: number, toIndex: number): void {
    const array = this.get(arrayPath)

    if (Array.isArray(array)) {
      moveArrayItem(array, fromIndex, toIndex)
    }
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