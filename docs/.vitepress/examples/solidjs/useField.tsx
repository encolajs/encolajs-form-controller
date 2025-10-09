import { createSignal, onCleanup } from 'solid-js'
import { effect } from 'alien-signals'

/**
 * Creates field state using SolidJS signals
 * @param {FormController} formController - The form controller instance
 * @param {string} fieldPath - The path to the field
 * @returns {Object} Field state and handlers
 */
export function useField(formController, fieldPath) {
  // Create reactive signals
  const [value, setValue] = createSignal(formController.getValue(fieldPath))
  const [errors, setErrors] = createSignal(formController.getErrors()[fieldPath] || [])
  const [hasErrors, setHasErrors] = createSignal((formController.getErrors()[fieldPath] || []).length > 0)

  const field = formController.field(fieldPath)
  const effects = []

  // Watch for changes to this specific field only
  effects.push(effect(() => {
    field.valueUpdated() // Subscribe to field-specific value changes
    setValue(() => formController.getValue(fieldPath))
  }))

  // Watch for errors on this specific field
  effects.push(effect(() => {
    formController.errorsChanged() // Subscribe to errors changes
    const fieldErrors = formController.getErrors()[fieldPath] || []
    setErrors(fieldErrors)
    setHasErrors(fieldErrors.length > 0)
  }))

  // Cleanup effects
  onCleanup(() => {
    effects.forEach(dispose => dispose?.())
  })

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

  return {
    value,
    errors,
    hasErrors,
    handleInput,
    handleChange
  }
}
