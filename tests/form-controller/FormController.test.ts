import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FormController } from '../../src/form-controller/FormController'
import { PlainObjectDataSource } from '../../src/data-sources/PlainObjectDataSource'
import { MockFormValidator } from '../mocks/MockFormValidator'
import { effect } from 'alien-signals'

describe('FormController', () => {
  let formController: FormController
  let dataSource: PlainObjectDataSource
  let validator: MockFormValidator
  let initialData: any

  const createInitialData = () => JSON.parse(JSON.stringify({
    name: 'John',
    email: 'john@example.com',
    items: [
      { price: 100, quantity: 1 },
      { price: 200, quantity: 2 }
    ],
    address: {
      street: '123 Main St',
      city: 'LA'
    }
  }))

  beforeEach(() => {
    initialData = createInitialData()
    dataSource = new PlainObjectDataSource(createInitialData()) // Use a separate copy for the data source
    validator = new MockFormValidator()
    formController = new FormController(dataSource, validator)
  })

  describe('initialization', () => {
    it('should initialize with data source and validator', () => {
      expect(formController).toBeDefined()
      expect(formController.getValues()).toEqual(initialData)
    })

    it('should initialize with default validator when none provided', () => {
      const controller = new FormController(dataSource)
      expect(controller).toBeDefined()
    })

    it('should have initial reactive state', () => {
      expect(formController.isSubmitting()).toBe(false)
      expect(formController.isValidating()).toBe(false)
      expect(formController.isDirty()).toBe(false)
      expect(formController.isTouched()).toBe(false)
      expect(formController.isValid()).toBe(true)
    })
  })

  describe('field method', () => {
    it('should return FieldState for valid path', () => {
      const nameField = formController.field('name')

      expect(nameField.value()).toBe('John')
      expect(nameField.isDirty()).toBe(false)
      expect(nameField.isTouched()).toBe(false)
      expect(nameField.isValidating()).toBe(false)
      expect(nameField.isValid()).toBe(true)
      expect(nameField.errors()).toEqual([])
    })

    it('should return same FieldState instance for same path', () => {
      const field1 = formController.field('name')
      const field2 = formController.field('name')

      expect(field1).toBe(field2)
    })

    it('should handle nested paths', () => {
      const streetField = formController.field('address.street')
      expect(streetField.value()).toBe('123 Main St')
    })

    it('should handle array paths', () => {
      const priceField = formController.field('items.0.price')
      expect(priceField.value()).toBe(100)
    })

    it('should handle non-existent paths', () => {
      const nonExistentField = formController.field('nonExistent')
      expect(nonExistentField.value()).toBeUndefined()
    })
  })

  describe('field operations', () => {
    it('should set field values through FormController', async () => {
      const nameField = formController.field('name')

      await formController.setValue('name', 'Jane')

      expect(nameField.value()).toBe('Jane')
      expect(dataSource.get('name')).toBe('Jane')
      expect(nameField.isDirty()).toBe(true)
      expect(nameField.isTouched()).toBe(true)
      expect(formController.isDirty()).toBe(true)
    })

    it('should validate fields when setValue is called', async () => {
      validator.mockFieldValidation('name', ['Name is required'])
      const nameField = formController.field('name')

      await formController.setValue('name', '')

      expect(nameField.errors()).toEqual(['Name is required'])
      expect(nameField.isValid()).toBe(false)
      expect(formController.isValid()).toBe(false)
    })

    it('should reset field state', () => {
      const nameField = formController.field('name')

      // Make field dirty and touched
      formController.setValue('name', 'Jane')
      formController.reset()

      expect(nameField.isDirty()).toBe(false)
      expect(nameField.isTouched()).toBe(false)
    })

    it('should set field errors directly', () => {
      const nameField = formController.field('name')

      formController.setErrors({ 'name': ['Custom error'] })

      expect(nameField.errors()).toEqual(['Custom error'])
      expect(nameField.isValid()).toBe(false)
    })

    it('should clear field errors when empty array is set', () => {
      const nameField = formController.field('name')

      formController.setErrors({ 'name': ['Error'] })
      formController.setErrors({ 'name': [] })

      expect(nameField.errors()).toEqual([])
      expect(nameField.isValid()).toBe(true)
    })
  })

  describe('form-level operations', () => {
    it('should get all values', () => {
      expect(formController.getValues()).toEqual(initialData)
    })

    it('should validate entire form', async () => {
      validator.mockFormValidation({
        'name': ['Name is required'],
        'email': ['Invalid email']
      })

      const isValid = await formController.validate()

      expect(isValid).toBe(false)
      expect(formController.field('name').errors()).toEqual(['Name is required'])
      expect(formController.field('email').errors()).toEqual(['Invalid email'])
    })

    it('should submit form when valid', async () => {
      validator.mockFormValidation({}) // No errors

      const result = await formController.submit()

      expect(result).toBe(true)
      expect(formController.isSubmitting()).toBe(false)
    })

    it('should not submit form when invalid', async () => {
      validator.mockFormValidation({ 'name': ['Error'] })

      const result = await formController.submit()

      expect(result).toBe(false)
    })

    it('should track submitting state', async () => {
      let submittingStates: boolean[] = []

      effect(() => {
        submittingStates.push(formController.isSubmitting())
      })

      const submitPromise = formController.submit()
      expect(formController.isSubmitting()).toBe(true)

      await submitPromise
      expect(formController.isSubmitting()).toBe(false)
    })

    it('should track validating state', async () => {
      let validatingStates: boolean[] = []

      effect(() => {
        validatingStates.push(formController.isValidating())
      })

      const validatePromise = formController.validate()
      expect(formController.isValidating()).toBe(true)

      await validatePromise
      expect(formController.isValidating()).toBe(false)
    })

    it('should reset form to initial state', async () => {
      // Make changes
      await formController.setValue('name', 'Jane')
      await formController.setValue('email', 'jane@example.com')
      await formController.setValue('newField', 'test')

      // Reset
      formController.reset()

      expect(formController.getValues()).toEqual(initialData)
      expect(formController.isDirty()).toBe(false)
      expect(formController.isTouched()).toBe(false)
    })

    it('should set form-level errors', () => {
      formController.setErrors({
        'name': ['Name error'],
        'email': ['Email error']
      })

      expect(formController.field('name').errors()).toEqual(['Name error'])
      expect(formController.field('email').errors()).toEqual(['Email error'])
      expect(formController.isValid()).toBe(false)
    })
  })

  describe('array operations', () => {
    it('should add items to arrays', () => {
      const newItem = { price: 300, quantity: 3 }

      formController.arrayAdd('items', newItem)

      const items = dataSource.get('items') as any[]
      expect(items).toHaveLength(3)
      expect(items[2]).toEqual(newItem)
      expect(formController.isDirty()).toBe(true)
    })

    it('should add items at specific index', () => {
      const newItem = { price: 150, quantity: 1.5 }

      formController.arrayAdd('items', newItem, 1)

      const items = dataSource.get('items') as any[]
      expect(items).toHaveLength(3)
      expect(items[1]).toEqual(newItem)
      expect(items[2].price).toBe(200) // Original item shifted
    })

    it('should remove items from arrays', () => {
      formController.arrayRemove('items', 0)

      const items = dataSource.get('items') as any[]
      expect(items).toHaveLength(1)
      expect(items[0].price).toBe(200) // Second item becomes first
      expect(formController.isDirty()).toBe(true)
    })

    it('should move items within arrays', () => {
      formController.arrayMove('items', 0, 1)

      const items = dataSource.get('items') as any[]
      expect(items[0].price).toBe(200) // Second item moved to first
      expect(items[1].price).toBe(100) // First item moved to second
      expect(formController.isDirty()).toBe(true)
    })
  })

  describe('reactive state updates', () => {
    it('should update isDirty when fields change', async () => {
      expect(formController.isDirty()).toBe(false)

      await formController.setValue('name', 'Jane')

      expect(formController.isDirty()).toBe(true)
    })

    it('should update isTouched when fields are touched', async () => {
      expect(formController.isTouched()).toBe(false)

      await formController.setValue('name', 'Jane')

      expect(formController.isTouched()).toBe(true)
    })

    it('should update isValid when validation state changes', () => {
      expect(formController.isValid()).toBe(true)

      formController.setErrors({ 'name': ['Error'] })

      expect(formController.isValid()).toBe(false)
    })

    it('should react to field state changes', () => {
      let validityStates: boolean[] = []

      effect(() => {
        validityStates.push(formController.isValid())
      })

      // Should start valid
      expect(validityStates[validityStates.length - 1]).toBe(true)

      // Add error - should become invalid
      formController.setErrors({ 'name': ['Error'] })
      expect(validityStates[validityStates.length - 1]).toBe(false)

      // Clear error - should become valid again
      formController.setErrors({ 'name': [] })
      expect(validityStates[validityStates.length - 1]).toBe(true)
    })
  })

  describe('field state management', () => {
    it('should track field validation state', async () => {
      const nameField = formController.field('name')
      let validatingStates: boolean[] = []

      effect(() => {
        validatingStates.push(nameField.isValidating())
      })

      const validatePromise = formController.validateField('name')
      expect(nameField.isValidating()).toBe(true)

      await validatePromise
      expect(nameField.isValidating()).toBe(false)
    })

    it('should maintain field state consistency', async () => {
      const field1 = formController.field('name')
      const field2 = formController.field('name')

      await formController.setValue('name', 'Jane')

      expect(field2.value()).toBe('Jane')
      expect(field2.isDirty()).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should cleanup resources on destroy', () => {
      expect(() => formController.destroy()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle empty field paths', () => {
      const rootField = formController.field('')
      expect(rootField.value()).toEqual(initialData)
    })

    it('should handle deeply nested non-existent paths', () => {
      const deepField = formController.field('deeply.nested.non.existent.path')
      expect(deepField.value()).toBeUndefined()
    })

    it('should handle concurrent operations', async () => {
      const nameField = formController.field('name')

      const promises = [
        formController.setValue('name', 'Jane'),
        formController.setValue('name', 'Bob'),
        formController.validateField('name'),
        formController.validate()
      ]

      await Promise.all(promises)

      // Last setValue should win
      expect(nameField.value()).toBe('Bob')
    })

    it('should handle validation errors during submit', async () => {
      validator.mockFormValidation({ 'name': ['Error'] })

      const result = await formController.submit()

      expect(result).toBe(false)
      expect(formController.field('name').errors()).toEqual(['Error'])
    })

    it('should handle async validation', async () => {
      validator.mockAsyncValidation('name', ['Async error'], 100)

      const nameField = formController.field('name')
      const validatePromise = formController.validateField('name')

      expect(nameField.isValidating()).toBe(true)

      const result = await validatePromise

      expect(result).toBe(false)
      expect(nameField.isValidating()).toBe(false)
      expect(nameField.errors()).toEqual(['Async error'])
    })
  })

  describe('options handling', () => {
    it('should respect setValue options', async () => {
      const nameField = formController.field('name')

      await formController.setValue('name', 'Jane', {
        validate: false,
        touch: false,
        dirty: false
      })

      expect(nameField.value()).toBe('Jane')
      expect(nameField.isDirty()).toBe(false)
      expect(nameField.isTouched()).toBe(false)
    })

    it('should validate when validate option is true', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      await formController.setValue('name', '', { validate: true })

      expect(nameField.errors()).toEqual(['Error'])
    })
  })
})