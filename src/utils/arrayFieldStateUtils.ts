import type { IFieldState } from '../types'

/**
 * Represents field state data that can be stored and restored
 */
interface FieldStateData {
  isDirty: boolean
  isTouched: boolean
  isValidating: boolean
  wasValidated: boolean
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
export async function insertFieldState(
  fieldStates: Map<string, IFieldState>,
  fieldFactory: (path: string) => IFieldState,
  fieldValidator: (path: string) => Promise<boolean>,
  arrayPath: string,
  insertIndex: number
): Promise<void> {
  const arrayFieldStates = getFieldStatesByPath(fieldStates, arrayPath)
  if (arrayFieldStates.length === 0) return

  // Create a map to store field states that need to be shifted
  const stateMap = new Map<string, FieldStateData>()
  const fieldsToRevalidate: string[] = []

  // Collect states from fields that will be shifted (index >= insertIndex)
  arrayFieldStates.forEach(({ index, subPath, fieldState }) => {
    if (index >= insertIndex) {
      const newPath = `${arrayPath}.${index + 1}.${subPath}`
      const wasValidated = fieldState.wasValidated()

      stateMap.set(newPath, {
        isDirty: fieldState.isDirty(),
        isTouched: fieldState.isTouched(),
        isValidating: fieldState.isValidating(),
        wasValidated
      })

      // If field was validated, we need to revalidate it at the new path
      if (wasValidated) {
        fieldsToRevalidate.push(newPath)
      }

      // Reset the original field state
      fieldState.isDirty(false)
      fieldState.isTouched(false)
      fieldState.isValidating(false)
      fieldState.wasValidated(false)
    }
  })

  // Apply the shifted states to new field objects at new paths
  stateMap.forEach((state, path) => {
    const newFieldState = fieldFactory(path)
    newFieldState.isDirty(state.isDirty)
    newFieldState.isTouched(state.isTouched)
    newFieldState.isValidating(state.isValidating)
    newFieldState.wasValidated(state.wasValidated)
  })

  await revalidateFields(fieldsToRevalidate, fieldValidator)
}

/**
 * Shift field states when removing from an array
 * Note: fieldFactory is needed to create new field state objects at shifted paths
 */
export async function removeFieldState(
  fieldStates: Map<string, IFieldState>,
  fieldFactory: (path: string) => IFieldState,
  fieldValidator: (path: string) => Promise<boolean>,
  arrayPath: string,
  removeIndex: number,
  arrayLength: number,
  errorCleanup?: (arrayPath: string, removeIndex: number) => void
): Promise<void> {
  const arrayFieldStates = getFieldStatesByPath(fieldStates, arrayPath)
  if (arrayFieldStates.length === 0) return

  // Save original states for indices that need to be preserved
  const preservedStates = new Map<string, FieldStateData>()
  const shiftedStates = new Map<string, FieldStateData>()
  const fieldsToRevalidate: string[] = []

  arrayFieldStates.forEach(({ index, subPath, fieldState }) => {
    const currentPath = `${arrayPath}.${index}.${subPath}`
    const state = {
      isDirty: fieldState.isDirty(),
      isTouched: fieldState.isTouched(),
      isValidating: fieldState.isValidating(),
      wasValidated: fieldState.wasValidated()
    }

    if (index < removeIndex) {
      // Preserve states for indices before the removed index
      preservedStates.set(currentPath, state)
      // Re-validate preserved fields to ensure contextual validation is current
      if (state.wasValidated) {
        fieldsToRevalidate.push(currentPath)
      }
    } else if (index > removeIndex) {
      // Collect states that will shift down
      const newPath = `${arrayPath}.${index - 1}.${subPath}`
      shiftedStates.set(newPath, state)
      // Re-validate shifted fields at their new positions
      if (state.wasValidated) {
        fieldsToRevalidate.push(newPath)
      }
    }
    // index === removeIndex: these field states are deleted (not preserved)
  })

  // Reset all field states
  arrayFieldStates.forEach(({ fieldState }) => {
    fieldState.isDirty(false)
    fieldState.isTouched(false)
    fieldState.isValidating(false)
    fieldState.wasValidated(false)
  })

  // Restore preserved states (indices < removeIndex)
  preservedStates.forEach((state, path) => {
    const fieldState = fieldStates.get(path)
    if (fieldState) {
      fieldState.isDirty(state.isDirty)
      fieldState.isTouched(state.isTouched)
      fieldState.isValidating(state.isValidating)
      fieldState.wasValidated(state.wasValidated)
    }
  })

  // Apply shifted states (indices > removeIndex moved down)
  shiftedStates.forEach((state, path) => {
    const newFieldState = fieldFactory(path)
    newFieldState.isDirty(state.isDirty)
    newFieldState.isTouched(state.isTouched)
    newFieldState.isValidating(state.isValidating)
    newFieldState.wasValidated(state.wasValidated)
  })

  // Clean up orphaned field states beyond the new array length
  cleanupOrphanedFieldStates(fieldStates, arrayPath, arrayLength)

  // Clean up errors if callback provided
  if (errorCleanup) {
    errorCleanup(arrayPath, removeIndex)
  }

  await revalidateFields(fieldsToRevalidate, fieldValidator)
}

/**
 * Swap field states when moving items in an array
 * Note: fieldFactory is needed to create new field state objects at moved positions
 */
export async function swapFieldStates(
  fieldStates: Map<string, IFieldState>,
  fieldFactory: (path: string) => IFieldState,
  fieldValidator: (path: string) => Promise<boolean>,
  arrayPath: string,
  fromIndex: number,
  toIndex: number,
  arrayLength: number
): Promise<void> {
  const arrayFieldStates = getFieldStatesByPath(fieldStates, arrayPath)
  if (arrayFieldStates.length === 0) return

  // Group field states by index
  const statesByIndex = new Map<number, Map<string, FieldStateData>>()
  const fieldsToRevalidate: string[] = []

  arrayFieldStates.forEach(({ index, subPath, fieldState }) => {
    if (!statesByIndex.has(index)) {
      statesByIndex.set(index, new Map())
    }
    statesByIndex.get(index)!.set(subPath, {
      isDirty: fieldState.isDirty(),
      isTouched: fieldState.isTouched(),
      isValidating: fieldState.isValidating(),
      wasValidated: fieldState.wasValidated()
    })
  })

  // Create index mapping for the move operation (drag & drop)
  const indexMapping = new Map<number, number>()
  for (let i = 0; i < arrayLength; i++) {
    indexMapping.set(i, i)
  }

  // Apply the move transformation to the mapping
  if (fromIndex < toIndex) {
    // Moving forward: shift items back to fill the gap
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      indexMapping.set(i, i - 1)
    }
    indexMapping.set(fromIndex, toIndex)
  } else {
    // Moving backward: shift items forward to make room
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
    fieldState.wasValidated(false)
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
        newFieldState.wasValidated(state.wasValidated)

        // If field was validated, we need to revalidate it at the new position
        if (state.wasValidated) {
          fieldsToRevalidate.push(newPath)
        }
      })
    }
  })

  await revalidateFields(fieldsToRevalidate, fieldValidator)
}

async function revalidateFields(
    paths: string[],
    fieldValidator: (path: string) => Promise<boolean>): Promise<boolean[]> {

  return Promise.all(paths.map(fieldValidator))
}

/**
 * Clean up orphaned field states beyond the array length
 */
function cleanupOrphanedFieldStates(
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
          fieldState.wasValidated(false)
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