import { useEffect, useState, useCallback } from 'react'
import { effect } from 'alien-signals'

/**
 * React hook for managing individual form fields
 * @param {FormController} formController - The form controller instance
 * @param {string} fieldPath - The path to the field
 * @returns {Object} Field state and handlers
 */
export function useField(formController, fieldPath) {
  const [fieldState, setFieldState] = useState({
    value: formController.getValue(fieldPath),
    errors: formController.getErrors()[fieldPath] || [],
    hasErrors: (formController.getErrors()[fieldPath] || []).length > 0
  })

  useEffect(() => {
    const effects = []
    const field = formController.field(fieldPath)

    // Watch for changes to this specific field only
    effects.push(effect(() => {
      field.valueUpdated() // Subscribe to field-specific value changes
      setFieldState(prev => ({
        ...prev,
        value: formController.getValue(fieldPath)
      }))
    }))

    // Watch for errors on this specific field
    effects.push(effect(() => {
      formController.errorsChanged() // Subscribe to errors changes
      const errors = formController.getErrors()[fieldPath] || []
      setFieldState(prev => ({
        ...prev,
        errors,
        hasErrors: errors.length > 0
      }))
    }))

    // Cleanup effects on unmount
    return () => {
      effects.forEach(dispose => dispose?.())
    }
  }, [formController, fieldPath])

  const handleInput = useCallback((inputValue) => {
    formController.setValue(fieldPath, inputValue, {
      touched: true,
      dirty: false
    })
  }, [formController, fieldPath])

  const handleChange = useCallback((inputValue) => {
    formController.setValue(fieldPath, inputValue, {
      touched: true,
      dirty: true
    })
  }, [formController, fieldPath])

  return {
    value: fieldState.value,
    errors: fieldState.errors,
    hasErrors: fieldState.hasErrors,
    handleInput,
    handleChange
  }
}
