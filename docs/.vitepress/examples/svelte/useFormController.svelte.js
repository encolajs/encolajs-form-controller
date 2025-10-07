import { effect } from 'alien-signals'

/**
 * Creates form controller state using Svelte 5 runes
 * @param {FormController} formController - The form controller instance
 * @returns {Object} Form state and methods
 */
export function useFormController(formController) {
  // Create reactive state using $state rune
  let state = $state({
    isDirty: formController.isDirty(),
    isTouched: formController.isTouched(),
    isValid: formController.isValid(),
    errors: formController.getErrors(),
    values: formController.getValues()
  })

  // Set up effects for reactivity
  const effects = []

  // Form-level state reactivity
  effects.push(effect(() => {
    state.isDirty = formController.isDirty()
    state.isTouched = formController.isTouched()
    state.isValid = formController.isValid()
  }))

  // Error reactivity
  effects.push(effect(() => {
    formController.errorsChanged()
    state.errors = { ...formController.getErrors() }
  }))

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
        return state.errors[path] || []
      }
      return state.errors
    },
    hasErrors: (path) => {
      const errors = state.errors[path] || []
      return errors.length > 0
    }
  }

  // Cleanup function
  const cleanup = () => {
    effects.forEach(dispose => dispose?.())
  }

  return {
    state,
    methods,
    controller: formController,
    cleanup
  }
}
