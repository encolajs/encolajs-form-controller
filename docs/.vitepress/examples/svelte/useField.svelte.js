import { effect } from 'alien-signals'

/**
 * Creates field state using Svelte 5 runes
 * @param {FormController} formController - The form controller instance
 * @param {string} fieldPath - The path to the field
 * @returns {Object} Field state and handlers
 */
export function useField(formController, fieldPath) {
  // Create reactive state using $state rune
  let state = $state({
    value: formController.getValue(fieldPath),
    errors: formController.getErrors()[fieldPath] || [],
    hasErrors: (formController.getErrors()[fieldPath] || []).length > 0
  })

  const field = formController.field(fieldPath)
  const effects = []

  // Watch for changes to this specific field only
  effects.push(effect(() => {
    field.valueUpdated() // Subscribe to field-specific value changes
    state.value = formController.getValue(fieldPath)
  }))

  // Watch for errors on this specific field
  effects.push(effect(() => {
    formController.errorsChanged() // Subscribe to errors changes
    const errors = formController.getErrors()[fieldPath] || []
    state.errors = errors
    state.hasErrors = errors.length > 0
  }))

  // Handlers
  const handleInput = (inputValue) => {
    formController.setValue(fieldPath, inputValue, {
      touched: true,
      dirty: false
    })
  }

  const handleChange = (inputValue) => {
    formController.setValue(fieldPath, inputValue, {
      touched: true,
      dirty: true
    })
  }

  // Cleanup function
  const cleanup = () => {
    effects.forEach(dispose => dispose?.())
  }

  return {
    get value() { return state.value },
    get errors() { return state.errors },
    get hasErrors() { return state.hasErrors },
    handleInput,
    handleChange,
    cleanup
  }
}
