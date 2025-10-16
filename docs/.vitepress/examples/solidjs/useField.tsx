import { createSignal, onCleanup } from 'solid-js'
import { effect } from 'alien-signals'
import {FormController} from "../../../../src";

export function useField(formController: FormController, fieldPath: string) {
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
