import { createSignal, createEffect, onCleanup } from 'solid-js'
import { effect } from 'alien-signals'

/**
 * Creates form controller state using SolidJS signals
 * @param {IFormController} formController - The form controller instance
 * @returns {Object} Form state and methods
 */
export function useFormController(formController) {
  // Create reactive signals
  const [isDirty, setIsDirty] = createSignal(formController.isDirty())
  const [isTouched, setIsTouched] = createSignal(formController.isTouched())
  const [isValid, setIsValid] = createSignal(formController.isValid())
  const [errors, setErrors] = createSignal(formController.getErrors())

  // Set up effects for reactivity
  const effects = []

  // Form-level state reactivity
  effects.push(effect(() => {
    setIsDirty(formController.isDirty())
    setIsTouched(formController.isTouched())
    setIsValid(formController.isValid())
  }))

  // Error reactivity
  effects.push(effect(() => {
    formController.errorsChanged()
    setErrors({ ...formController.getErrors() })
  }))

  // Cleanup effects
  onCleanup(() => {
    effects.forEach(dispose => dispose?.())
  })

  // Methods
  const methods = {
    submit: async () => {
      return await formController.submit()
    },
    reset: () => {
      formController.reset()
    },
    setValue: (path, value, options) => {
      return formController.setValue(path, value, options)
    },
    getValue: (path) => {
      return formController.getValue(path)
    },
    getErrors: (path) => {
      if (path) {
        return errors()[path] || []
      }
      return errors()
    },
    hasErrors: (path) => {
      const fieldErrors = errors()[path] || []
      return fieldErrors.length > 0
    }
  }

  return {
    state: {
      get isDirty() { return isDirty() },
      get isTouched() { return isTouched() },
      get isValid() { return isValid() },
      get errors() { return errors() }
    },
    methods,
    controller: formController
  }
}
