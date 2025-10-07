import { useEffect, useState, useCallback } from 'react'
import { effect } from 'alien-signals'

/**
 * React hook for managing array form fields
 * @param {FormController} formController - The form controller instance
 * @param {string} fieldPath - The path to the array field
 * @param {Object} defaultItem - Default item to add when appending
 * @returns {Object} Array field state and methods
 */
export function useArrayField(formController, fieldPath, defaultItem = {}) {
  const [arrayState, setArrayState] = useState(() => {
    const value = formController.getValue(fieldPath)
    return {
      items: Array.isArray(value) ? value : [],
      errors: formController.getErrors()[fieldPath] || []
    }
  })

  useEffect(() => {
    const effects = []
    const field = formController.field(fieldPath)

    // Watch for changes to this specific array field only
    effects.push(effect(() => {
      field.valueUpdated() // Subscribe to field-specific value changes
      const value = formController.getValue(fieldPath)
      setArrayState(prev => ({
        ...prev,
        items: Array.isArray(value) ? value : []
      }))
    }))

    // Watch for errors on this specific field
    effects.push(effect(() => {
      formController.errorsChanged()
      setArrayState(prev => ({
        ...prev,
        errors: formController.getErrors()[fieldPath] || []
      }))
    }))

    // Cleanup effects on unmount
    return () => {
      effects.forEach(dispose => dispose?.())
    }
  }, [formController, fieldPath])

  const arrayAppend = useCallback(() => {
    const newItem = { ...defaultItem }
    formController.arrayAppend(fieldPath, newItem).catch(console.error)
  }, [formController, fieldPath, defaultItem])

  const arrayRemove = useCallback((index) => {
    formController.arrayRemove(fieldPath, index).catch(console.error)
  }, [formController, fieldPath])

  const arrayMoveUp = useCallback((index) => {
    if (index > 0) {
      formController.arrayMove(fieldPath, index, index - 1).catch(console.error)
    }
  }, [formController, fieldPath])

  const arrayMoveDown = useCallback((index) => {
    if (index < arrayState.items.length - 1) {
      formController.arrayMove(fieldPath, index, index + 1).catch(console.error)
    }
  }, [formController, fieldPath, arrayState.items.length])

  return {
    items: arrayState.items,
    errors: arrayState.errors,
    arrayAppend,
    arrayRemove,
    arrayMoveUp,
    arrayMoveDown
  }
}
