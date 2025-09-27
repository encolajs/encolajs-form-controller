/**
 * High-performance array utilities optimized for large arrays
 * Based on Enforma's efficient implementations that avoid splice operations
 */

/**
 * Efficiently moves an array item from one index to another without using splice
 * Performance: O(n) single pass vs O(n) + O(n) from double splice
 * Memory: In-place modification, no temporary arrays
 */
export function moveArrayItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  // Early validation and normalization
  if (!Array.isArray(array) ||
      fromIndex < 0 || fromIndex >= array.length ||
      toIndex < 0 || toIndex >= array.length ||
      fromIndex === toIndex) {
    return array
  }

  // Store the element to move
  const elementToMove = array[fromIndex]

  if (fromIndex < toIndex) {
    // Moving DOWN: shift elements LEFT to fill the gap
    for (let i = fromIndex; i < toIndex; i++) {
      array[i] = array[i + 1]
    }
  } else {
    // Moving UP: shift elements RIGHT to make space
    for (let i = fromIndex; i > toIndex; i--) {
      array[i] = array[i - 1]
    }
  }

  // Place the moved element in its new position
  array[toIndex] = elementToMove

  return array
}

/**
 * Efficiently removes an item at a specific index without using splice
 * Performance: O(n) single pass vs O(n) from splice
 */
export function removeArrayItem<T>(array: T[], index: number): T[] {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return array
  }

  // Shift all elements after the index one position left
  for (let i = index; i < array.length - 1; i++) {
    array[i] = array[i + 1]
  }

  // Remove the last element (now duplicated)
  array.length = array.length - 1

  return array
}

/**
 * Efficiently inserts an item at a specific index without using splice
 * Performance: O(n) single pass vs O(n) from splice
 */
export function insertArrayItem<T>(array: T[], index: number, item: T): T[] {
  if (!Array.isArray(array)) {
    return array
  }

  // Normalize index (handle negative and out-of-bounds)
  const normalizedIndex = Math.max(0, Math.min(index, array.length))

  // If inserting at the end, just push
  if (normalizedIndex >= array.length) {
    array.push(item)
    return array
  }

  // Extend array length
  array.length = array.length + 1

  // Shift elements right to make space
  for (let i = array.length - 1; i > normalizedIndex; i--) {
    array[i] = array[i - 1]
  }

  // Insert the new item
  array[normalizedIndex] = item

  return array
}

/**
 * Safely adds an item to the end of an array
 * Handles non-array values by creating a new array
 */
export function pushArrayItem<T>(array: T[] | unknown, item: T): T[] {
  if (Array.isArray(array)) {
    array.push(item)
    return array
  } else {
    // Create new array if not already an array
    return [item]
  }
}