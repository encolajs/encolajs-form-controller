import { createSignal, createMemo, onCleanup } from 'solid-js'
import { effect } from 'alien-signals'

/**
 * Creates array field state using SolidJS signals
 * @param {FormController} formController - The form controller instance
 * @param {string} fieldPath - The path to the array field
 * @param {Object} defaultItem - Default item to add when appending
 * @returns {Object} Array field state and methods
 */
export function useArrayField(formController, fieldPath, defaultItem = {}) {
  const field = formController.field(fieldPath)
  const effects = []

  // Create a trigger signal that updates when the field changes
  const [updateTrigger, setUpdateTrigger] = createSignal(0)

  // Watch for changes to this specific array field
  effects.push(effect(() => {
    field.valueUpdated() // Subscribe to field-specific value changes
    setUpdateTrigger(prev => prev + 1)
  }))

  // Create a computed memo that reads directly from FormController
  const items = createMemo(() => {
    // Access the trigger to make this reactive
    updateTrigger()
    const value = formController.getValue(fieldPath)
    return Array.isArray(value) ? value : []
  })

  const errors = createMemo(() => {
    formController.errorsChanged()
    return formController.getErrors()[fieldPath] || []
  })

  // Cleanup effects
  onCleanup(() => {
    effects.forEach(dispose => dispose?.())
  })

  // Array manipulation methods
  const arrayAppend = () => {
    const newItem = { ...defaultItem }
    formController.arrayAppend(fieldPath, newItem).catch(console.error)
    setUpdateTrigger(prev => prev + 1)
  }

  const arrayRemove = (index) => {
    formController.arrayRemove(fieldPath, index).catch(console.error)
    setUpdateTrigger(prev => prev + 1)
  }

  const arrayMoveUp = (index) => {
    if (index > 0) {
      formController.arrayMove(fieldPath, index, index - 1).catch(console.error)
      setUpdateTrigger(prev => prev + 1)
    }
  }

  const arrayMoveDown = (index) => {
    const currentItems = items()
    if (index < currentItems.length - 1) {
      formController.arrayMove(fieldPath, index, index + 1).catch(console.error)
      setUpdateTrigger(prev => prev + 1)
    }
  }

  return {
    items,
    errors,
    arrayAppend,
    arrayRemove,
    arrayMoveUp,
    arrayMoveDown
  }
}
