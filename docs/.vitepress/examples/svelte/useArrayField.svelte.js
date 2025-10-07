import { effect } from 'alien-signals'

/**
 * Creates array field state using Svelte 5 runes
 * @param {FormController} formController - The form controller instance
 * @param {string} fieldPath - The path to the array field
 * @param {Object} defaultItem - Default item to add when appending
 * @returns {Object} Array field state and methods
 */
export function useArrayField(formController, fieldPath, defaultItem = {}) {
  const value = formController.getValue(fieldPath)

  // Create reactive state using $state rune
  let state = $state({
    items: Array.isArray(value) ? value : [],
    errors: formController.getErrors()[fieldPath] || []
  })

  const field = formController.field(fieldPath)
  const effects = []

  // Watch for changes to this specific array field only
  effects.push(effect(() => {
    field.valueUpdated() // Subscribe to field-specific value changes
    const value = formController.getValue(fieldPath)
    state.items = Array.isArray(value) ? value : []
  }))

  // Watch for errors on this specific field
  effects.push(effect(() => {
    formController.errorsChanged()
    state.errors = formController.getErrors()[fieldPath] || []
  }))

  // Array manipulation methods
  const arrayAppend = () => {
    const newItem = { ...defaultItem }
    formController.arrayAppend(fieldPath, newItem).catch(console.error)
  }

  const arrayRemove = (index) => {
    formController.arrayRemove(fieldPath, index).catch(console.error)
  }

  const arrayMoveUp = (index) => {
    if (index > 0) {
      formController.arrayMove(fieldPath, index, index - 1).catch(console.error)
    }
  }

  const arrayMoveDown = (index) => {
    if (index < state.items.length - 1) {
      formController.arrayMove(fieldPath, index, index + 1).catch(console.error)
    }
  }

  // Cleanup function
  const cleanup = () => {
    effects.forEach(dispose => dispose?.())
  }

  return {
    get items() { return state.items },
    get errors() { return state.errors },
    arrayAppend,
    arrayRemove,
    arrayMoveUp,
    arrayMoveDown,
    cleanup
  }
}
