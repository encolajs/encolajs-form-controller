import { useEffect, useState, useCallback } from 'react'
import { effect } from 'alien-signals'

/**
 * React hook for integrating with FormController
 * @param {FormController} formController - The form controller instance
 * @returns {Object} Form state and methods
 */
export function useFormController(formController) {
  const [formState, setFormState] = useState({
    isDirty: formController.isDirty(),
    isTouched: formController.isTouched(),
    isValid: formController.isValid(),
    errors: formController.getErrors(),
    values: formController.getValues()
  })

  useEffect(() => {
    const effects = []

    // Form-level state reactivity
    effects.push(effect(() => {
      setFormState(prev => ({
        ...prev,
        isDirty: formController.isDirty(),
        isTouched: formController.isTouched(),
        isValid: formController.isValid()
      }))
    }))

    // Error reactivity
    effects.push(effect(() => {
      formController.errorsChanged()
      setFormState(prev => ({
        ...prev,
        errors: { ...formController.getErrors() }
      }))
    }))

    // Cleanup effects on unmount
    return () => {
      effects.forEach(dispose => dispose?.())
    }
  }, [formController])

  const submit = useCallback(async () => {
    return await formController.submit()
  }, [formController])

  const reset = useCallback(() => {
    formController.reset()
  }, [formController])

  const setValue = useCallback((path, value, options) => {
    return formController.setValue(path, value, options)
  }, [formController])

  const getValue = useCallback((path) => {
    return formController.getValue(path)
  }, [formController])

  const getErrors = useCallback((path) => {
    if (path) {
      return formState.errors[path] || []
    }
    return formState.errors
  }, [formState.errors])

  const hasErrors = useCallback((path) => {
    const errors = formState.errors[path] || []
    return errors.length > 0
  }, [formState.errors])

  return {
    state: formState,
    methods: {
      submit,
      reset,
      setValue,
      getValue,
      getErrors,
      hasErrors
    },
    controller: formController
  }
}
