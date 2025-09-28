import type { IFieldState } from '../types'

/**
 * Represents field state data that can be stored and restored
 */
interface FieldStateData {
  isDirty: boolean
  isTouched: boolean
  isValidating: boolean
}

/**
 * Represents a field state with its array index and sub-path
 */
interface ArrayFieldState {
  index: number
  subPath: string
  fieldState: IFieldState
}

/**
 * Get all field states that belong to an array path
 */
export function getFieldStatesByPath(
  fieldStates: Map<string, IFieldState>,
  arrayPath: string
): ArrayFieldState[] {
  const arrayFieldStates: ArrayFieldState[] = []
  const arrayPathPrefix = `${arrayPath}.`

  fieldStates.forEach((fieldState, path) => {
    if (path.startsWith(arrayPathPrefix)) {
      const relativePath = path.substring(arrayPathPrefix.length)
      const firstDotIndex = relativePath.indexOf('.')

      if (firstDotIndex > 0) {
        const indexStr = relativePath.substring(0, firstDotIndex)
        const subPath = relativePath.substring(firstDotIndex + 1)
        const index = parseInt(indexStr, 10)

        if (!isNaN(index)) {
          arrayFieldStates.push({ index, subPath, fieldState })
        }
      }
    }
  })

  return arrayFieldStates
}

/**
 * Shift field states when inserting into an array
 * Note: fieldFactory is needed because field states are path-specific objects
 * that need to be recreated at new paths when array indices change
 */
export function insertFieldState(
  fieldStates: Map<string, IFieldState>,
  fieldFactory: (path: string) => IFieldState,
  arrayPath: string,
  insertIndex: number
): void {
  const arrayFieldStates = getFieldStatesByPath(fieldStates, arrayPath)
  if (arrayFieldStates.length === 0) return

  // Create a map to store field states that need to be shifted
  const stateMap = new Map<string, FieldStateData>()

  // Collect states from fields that will be shifted (index >= insertIndex)
  arrayFieldStates.forEach(({ index, subPath, fieldState }) => {
    if (index >= insertIndex) {
      const newPath = `${arrayPath}.${index + 1}.${subPath}`
      stateMap.set(newPath, {
        isDirty: fieldState.isDirty(),
        isTouched: fieldState.isTouched(),
        isValidating: fieldState.isValidating()
      })

      // Reset the original field state
      fieldState.isDirty(false)
      fieldState.isTouched(false)
      fieldState.isValidating(false)
    }
  })

  // Apply the shifted states to new field objects at new paths
  stateMap.forEach((state, path) => {
    const newFieldState = fieldFactory(path)
    newFieldState.isDirty(state.isDirty)
    newFieldState.isTouched(state.isTouched)
    newFieldState.isValidating(state.isValidating)
  })
}

/**
 * Shift field states when removing from an array
 * Note: fieldFactory is needed to create new field state objects at shifted paths
 */
export function removeFieldState(
  fieldStates: Map<string, IFieldState>,
  fieldFactory: (path: string) => IFieldState,
  arrayPath: string,
  removeIndex: number,
  arrayLength: number
): void {
  const arrayFieldStates = getFieldStatesByPath(fieldStates, arrayPath)
  if (arrayFieldStates.length === 0) return

  // Save original states for indices that need to be preserved
  const preservedStates = new Map<string, FieldStateData>()
  const shiftedStates = new Map<string, FieldStateData>()

  arrayFieldStates.forEach(({ index, subPath, fieldState }) => {
    const currentPath = `${arrayPath}.${index}.${subPath}`
    const state = {
      isDirty: fieldState.isDirty(),
      isTouched: fieldState.isTouched(),
      isValidating: fieldState.isValidating()
    }

    if (index < removeIndex) {
      // Preserve states for indices before the removed index
      preservedStates.set(currentPath, state)
    } else if (index > removeIndex) {
      // Collect states that will shift down
      const newPath = `${arrayPath}.${index - 1}.${subPath}`
      shiftedStates.set(newPath, state)
    }
    // index === removeIndex: these field states are deleted (not preserved)
  })

  // Reset all field states
  arrayFieldStates.forEach(({ fieldState }) => {
    fieldState.isDirty(false)
    fieldState.isTouched(false)
    fieldState.isValidating(false)
  })

  // Restore preserved states (indices < removeIndex)
  preservedStates.forEach((state, path) => {
    const fieldState = fieldStates.get(path)
    if (fieldState) {
      fieldState.isDirty(state.isDirty)
      fieldState.isTouched(state.isTouched)
      fieldState.isValidating(state.isValidating)
    }
  })

  // Apply shifted states (indices > removeIndex moved down)
  shiftedStates.forEach((state, path) => {
    const newFieldState = fieldFactory(path)
    newFieldState.isDirty(state.isDirty)
    newFieldState.isTouched(state.isTouched)
    newFieldState.isValidating(state.isValidating)
  })

  // Clean up orphaned field states beyond the new array length
  cleanupOrphanedFieldStates(fieldStates, arrayPath, arrayLength)
}

/**
 * Swap field states when moving items in an array
 * Note: fieldFactory is needed to create new field state objects at moved positions
 */
export function swapFieldStates(
  fieldStates: Map<string, IFieldState>,
  fieldFactory: (path: string) => IFieldState,
  arrayPath: string,
  fromIndex: number,
  toIndex: number,
  arrayLength: number
): void {
  const arrayFieldStates = getFieldStatesByPath(fieldStates, arrayPath)
  if (arrayFieldStates.length === 0) return

  // Group field states by index
  const statesByIndex = new Map<number, Map<string, FieldStateData>>()

  arrayFieldStates.forEach(({ index, subPath, fieldState }) => {
    if (!statesByIndex.has(index)) {
      statesByIndex.set(index, new Map())
    }
    statesByIndex.get(index)!.set(subPath, {
      isDirty: fieldState.isDirty(),
      isTouched: fieldState.isTouched(),
      isValidating: fieldState.isValidating()
    })
  })

  // Create index mapping for the move operation
  const indexMapping = new Map<number, number>()
  for (let i = 0; i < arrayLength; i++) {
    indexMapping.set(i, i)
  }

  // Apply the move transformation to the mapping
  if (fromIndex < toIndex) {
    // Moving forward: shift items back
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      indexMapping.set(i, i - 1)
    }
    indexMapping.set(fromIndex, toIndex)
  } else {
    // Moving backward: shift items forward
    for (let i = toIndex; i < fromIndex; i++) {
      indexMapping.set(i, i + 1)
    }
    indexMapping.set(fromIndex, toIndex)
  }

  // Reset all affected field states
  arrayFieldStates.forEach(({ fieldState }) => {
    fieldState.isDirty(false)
    fieldState.isTouched(false)
    fieldState.isValidating(false)
  })

  // Apply states to their new positions
  statesByIndex.forEach((subPathStates, originalIndex) => {
    const newIndex = indexMapping.get(originalIndex)
    if (newIndex !== undefined) {
      subPathStates.forEach((state, subPath) => {
        const newPath = `${arrayPath}.${newIndex}.${subPath}`
        const newFieldState = fieldFactory(newPath)
        newFieldState.isDirty(state.isDirty)
        newFieldState.isTouched(state.isTouched)
        newFieldState.isValidating(state.isValidating)
      })
    }
  })
}

/**
 * Clean up orphaned field states beyond the array length
 */
export function cleanupOrphanedFieldStates(
  fieldStates: Map<string, IFieldState>,
  arrayPath: string,
  arrayLength: number
): void {
  const arrayPathPrefix = `${arrayPath}.`
  const toDelete: string[] = []

  fieldStates.forEach((fieldState, path) => {
    if (path.startsWith(arrayPathPrefix)) {
      const relativePath = path.substring(arrayPathPrefix.length)
      const firstDotIndex = relativePath.indexOf('.')

      if (firstDotIndex > 0) {
        const indexStr = relativePath.substring(0, firstDotIndex)
        const index = parseInt(indexStr, 10)

        if (!isNaN(index) && index >= arrayLength) {
          fieldState.isDirty(false)
          fieldState.isTouched(false)
          fieldState.isValidating(false)
          toDelete.push(path)
        }
      }
    }
  })

  // Remove orphaned field states from the map
  toDelete.forEach(path => {
    fieldStates.delete(path)
  })
}