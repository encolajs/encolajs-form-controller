/**
 * Utility functions for working with object paths using dot notation
 * These functions handle deep object/array traversal and manipulation
 */

/**
 * Get a value from an object using a dot-notation path
 */
export function getByPath(obj: any, path: string): unknown {
  if (!obj || typeof obj !== 'object' || path === '') {
    return path === '' ? obj : undefined
  }

  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }

    // Handle array indices
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10)
      current = current[index]
    } else {
      current = current[key]
    }
  }

  return current
}

/**
 * Set a value in an object using a dot-notation path
 * Creates missing nested objects/arrays as needed
 */
export function setByPath(obj: any, path: string, value: unknown): void {
  if (!obj || typeof obj !== 'object' || path === '') {
    return
  }

  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]

    // Determine if next level should be an array or object
    const isNextKeyNumeric = /^\d+$/.test(nextKey)

    if (current[key] == null) {
      // Create new object or array based on next key
      current[key] = isNextKeyNumeric ? [] : {}
    } else if (typeof current[key] !== 'object') {
      // Overwrite primitive values with object/array
      current[key] = isNextKeyNumeric ? [] : {}
    }

    // Handle array extension
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10)
      // Extend array if necessary
      while (current.length <= index) {
        current.push(undefined)
      }
      if (current[index] == null) {
        current[index] = isNextKeyNumeric ? [] : {}
      }
      current = current[index]
    } else {
      current = current[key]
    }
  }

  const finalKey = keys[keys.length - 1]

  // Handle final assignment
  if (Array.isArray(current) && /^\d+$/.test(finalKey)) {
    const index = parseInt(finalKey, 10)
    // Extend array if necessary
    while (current.length <= index) {
      current.push(undefined)
    }
    current[index] = value
  } else if (current && typeof current === 'object') {
    current[finalKey] = value
  }
}

/**
 * Check if a path exists in an object
 */
export function hasPath(obj: any, path: string): boolean {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  if (path === '') {
    return true
  }

  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return false
    }

    // Check property existence
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10)
      if (index >= current.length) {
        return false
      }
      current = current[index]
    } else {
      if (!(key in current)) {
        return false
      }
      current = current[key]
    }
  }

  return true
}

/**
 * Remove a property from an object using a dot-notation path
 */
export function removeByPath(obj: any, path: string): void {
  if (!obj || typeof obj !== 'object' || path === '') {
    return
  }

  const keys = path.split('.')
  let current = obj

  // Navigate to parent of target property
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]

    if (current == null || typeof current !== 'object') {
      return
    }

    if (Array.isArray(current) && /^\d+$/.test(key)) {
      const index = parseInt(key, 10)
      if (index >= current.length) {
        return
      }
      current = current[index]
    } else {
      if (!(key in current)) {
        return
      }
      current = current[key]
    }
  }

  const finalKey = keys[keys.length - 1]

  // Remove the property
  if (current && typeof current === 'object') {
    if (Array.isArray(current) && /^\d+$/.test(finalKey)) {
      const index = parseInt(finalKey, 10)
      if (index < current.length) {
        delete current[index] // Creates sparse array
      }
    } else {
      delete current[finalKey]
    }
  }
}

/**
 * Create nested object structure for a given path
 * Used to ensure a path exists before setting values
 */
export function createPath(obj: any, path: string): void {
  if (!obj || typeof obj !== 'object' || path === '') {
    return
  }

  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const isLastKey = i === keys.length - 1

    if (!isLastKey) {
      const nextKey = keys[i + 1]
      const isNextKeyNumeric = /^\d+$/.test(nextKey)

      if (current[key] == null) {
        current[key] = isNextKeyNumeric ? [] : {}
      } else if (typeof current[key] !== 'object') {
        current[key] = isNextKeyNumeric ? [] : {}
      }

      // Handle array extension
      if (Array.isArray(current) && /^\d+$/.test(key)) {
        const index = parseInt(key, 10)
        while (current.length <= index) {
          current.push(undefined)
        }
        if (current[index] == null) {
          current[index] = isNextKeyNumeric ? [] : {}
        }
        current = current[index]
      } else {
        current = current[key]
      }
    } else {
      // Last key - ensure container exists
      if (Array.isArray(current) && /^\d+$/.test(key)) {
        const index = parseInt(key, 10)
        while (current.length <= index) {
          current.push(undefined)
        }
        if (current[index] == null) {
          current[index] = {}
        }
      } else {
        if (current[key] == null) {
          current[key] = {}
        }
      }
    }
  }
}

/**
 * Deep clone an object, handling circular references
 */
export function deepClone<T>(obj: T, seen = new WeakMap()): T {
  // Handle primitives and null/undefined
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // Handle circular references
  if (seen.has(obj as any)) {
    return seen.get(obj as any)
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T
  }

  // Handle Array
  if (Array.isArray(obj)) {
    const clonedArray: any[] = []
    seen.set(obj as any, clonedArray)

    for (let i = 0; i < obj.length; i++) {
      clonedArray[i] = deepClone(obj[i], seen)
    }

    return clonedArray as T
  }

  // Handle Object
  const clonedObj: any = {}
  seen.set(obj as any, clonedObj)

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone((obj as any)[key], seen)
    }
  }

  return clonedObj as T
}

/**
 * Check if a string represents a numeric array index
 */
export function isNumericKey(key: string): boolean {
  return /^\d+$/.test(key)
}

/**
 * Convert a path to an array of keys
 */
export function pathToKeys(path: string): string[] {
  return path === '' ? [] : path.split('.')
}

/**
 * Convert an array of keys to a path string
 */
export function keysToPath(keys: string[]): string {
  return keys.join('.')
}
