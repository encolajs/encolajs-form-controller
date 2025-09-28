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

  describe('field state preservation during array operations', () => {
    beforeEach(async () => {
      // Set up initial field states with dirty and touched states
      const field0Price = formController.field('items.0.price')
      const field0Quantity = formController.field('items.0.quantity')
      const field1Price = formController.field('items.1.price')

      // Make some fields dirty and touched
      await formController.setValue('items.0.price', 150, { validate: false })
      await formController.setValue('items.0.quantity', 5, { validate: false })
      await formController.setValue('items.1.price', 250, { validate: false })

      // Verify initial state
      expect(field0Price.isDirty()).toBe(true)
      expect(field0Quantity.isDirty()).toBe(true)
      expect(field1Price.isDirty()).toBe(true)
    })

    describe('array insert operations', () => {
      it('should shift field states when inserting at beginning', () => {
        const newItem = { price: 50, quantity: 1 }

        // Get field references before operation
        const originalField0Price = formController.field('items.0.price')
        const originalField0Quantity = formController.field('items.0.quantity')
        const originalField1Price = formController.field('items.1.price')

        // Verify initial dirty states
        expect(originalField0Price.isDirty()).toBe(true)
        expect(originalField0Quantity.isDirty()).toBe(true)
        expect(originalField1Price.isDirty()).toBe(true)

        // Insert at beginning
        formController.arrayAdd('items', newItem, 0)

        // After insertion, the original items.0 data should now be at items.1
        // but the field state for items.0 should be clean (new item)
        // and items.1 should have the dirty state from original items.0
        const newField0Price = formController.field('items.0.price')
        const newField1Price = formController.field('items.1.price')
        const newField1Quantity = formController.field('items.1.quantity')
        const newField2Price = formController.field('items.2.price')

        // New item at index 0 should have clean state
        expect(newField0Price.isDirty()).toBe(false)
        expect(newField0Price.value()).toBe(50)

        // Original items.0 state should move to items.1
        expect(newField1Price.isDirty()).toBe(true)
        expect(newField1Quantity.isDirty()).toBe(true)
        expect(newField1Price.value()).toBe(150) // Original modified value
        expect(newField1Quantity.value()).toBe(5) // Original modified value

        // Original items.1 state should move to items.2
        expect(newField2Price.isDirty()).toBe(true)
        expect(newField2Price.value()).toBe(250) // Original modified value
      })

      it('should shift field states when inserting in middle', () => {
        const newItem = { price: 175, quantity: 2 }

        // Insert at index 1
        formController.arrayAdd('items', newItem, 1)

        // Original items.0 should remain unchanged
        const field0Price = formController.field('items.0.price')
        const field0Quantity = formController.field('items.0.quantity')
        expect(field0Price.isDirty()).toBe(true)
        expect(field0Quantity.isDirty()).toBe(true)
        expect(field0Price.value()).toBe(150)
        expect(field0Quantity.value()).toBe(5)

        // New item at index 1 should have clean state
        const field1Price = formController.field('items.1.price')
        expect(field1Price.isDirty()).toBe(false)
        expect(field1Price.value()).toBe(175)

        // Original items.1 should move to items.2 with its dirty state
        const field2Price = formController.field('items.2.price')
        expect(field2Price.isDirty()).toBe(true)
        expect(field2Price.value()).toBe(250)
      })

      it('should not affect field states when appending at end', () => {
        const newItem = { price: 400, quantity: 4 }

        // Append at end
        formController.arrayAdd('items', newItem)

        // Original field states should remain unchanged
        const field0Price = formController.field('items.0.price')
        const field0Quantity = formController.field('items.0.quantity')
        const field1Price = formController.field('items.1.price')

        expect(field0Price.isDirty()).toBe(true)
        expect(field0Quantity.isDirty()).toBe(true)
        expect(field1Price.isDirty()).toBe(true)

        // New item should have clean state
        const field2Price = formController.field('items.2.price')
        expect(field2Price.isDirty()).toBe(false)
        expect(field2Price.value()).toBe(400)
      })
    })

    describe('array remove operations', () => {
      it('should shift field states when removing from beginning', () => {
        // Remove first item
        formController.arrayRemove('items', 0)

        // Original items.1 should move to items.0 with its dirty state
        const field0Price = formController.field('items.0.price')
        expect(field0Price.isDirty()).toBe(true)
        expect(field0Price.value()).toBe(250) // Original items.1 value

        // Field states for removed item should be cleaned up
        // items.1 should now be clean since we only have 1 item left
        const field1Price = formController.field('items.1.price')
        expect(field1Price.isDirty()).toBe(false)
        expect(field1Price.value()).toBeUndefined()
      })

      it('should shift field states when removing from middle', async () => {
        // Add a third item with dirty state first
        const originalField2Price = formController.field('items.2.price') // Create field state first
        await formController.setValue('items.2.price', 350, { validate: false })
        const newItem = { price: 999, quantity: 9 }
        formController.arrayAdd('items', newItem)

        // Remove middle item (index 1)
        formController.arrayRemove('items', 1)

        // Original items.0 should remain unchanged
        const field0Price = formController.field('items.0.price')
        const field0Quantity = formController.field('items.0.quantity')
        expect(field0Price.isDirty()).toBe(true)
        expect(field0Quantity.isDirty()).toBe(true)

        // Original items.2 should move to items.1
        const field1Price = formController.field('items.1.price')
        expect(field1Price.isDirty()).toBe(true)
        expect(field1Price.value()).toBe(350)

        // items.2 should now be the appended item
        const field2Price = formController.field('items.2.price')
        expect(field2Price.isDirty()).toBe(false)
        expect(field2Price.value()).toBe(999)
      })

      it('should clean up field states when removing from end', () => {
        // Remove last item
        formController.arrayRemove('items', 1)

        // Original items.0 should remain unchanged
        const field0Price = formController.field('items.0.price')
        const field0Quantity = formController.field('items.0.quantity')
        expect(field0Price.isDirty()).toBe(true)
        expect(field0Quantity.isDirty()).toBe(true)

        // Removed item's field state should be cleaned
        const field1Price = formController.field('items.1.price')
        expect(field1Price.isDirty()).toBe(false)
        expect(field1Price.value()).toBeUndefined()
      })
    })

    describe('array move operations', () => {
      it('should swap field states when moving items', () => {
        // Move first item to second position
        formController.arrayMove('items', 0, 1)

        // Field states should move with the data
        const field0Price = formController.field('items.0.price')
        const field0Quantity = formController.field('items.0.quantity')
        const field1Price = formController.field('items.1.price')
        const field1Quantity = formController.field('items.1.quantity')

        // items.0 should now have the state from original items.1
        expect(field0Price.isDirty()).toBe(true)
        expect(field0Price.value()).toBe(250) // Original items.1 value
        expect(field0Quantity.isDirty()).toBe(false) // items.1.quantity was not dirty

        // items.1 should now have the state from original items.0
        expect(field1Price.isDirty()).toBe(true)
        expect(field1Quantity.isDirty()).toBe(true)
        expect(field1Price.value()).toBe(150) // Original items.0 value
        expect(field1Quantity.value()).toBe(5) // Original items.0 value
      })

      it('should handle complex move operations', async () => {
        // Add more items and states
        const newItem1 = { price: 300, quantity: 3 }
        const newItem2 = { price: 400, quantity: 4 }
        formController.arrayAdd('items', newItem1)
        formController.arrayAdd('items', newItem2)

        // Create field states first, then set values
        formController.field('items.2.price')
        formController.field('items.3.quantity')
        await formController.setValue('items.2.price', 350, { validate: false })
        await formController.setValue('items.3.quantity', 8, { validate: false })

        // Move item from index 0 to index 3
        formController.arrayMove('items', 0, 3)

        // Original items.0 should now be at items.3
        const field3Price = formController.field('items.3.price')
        const field3Quantity = formController.field('items.3.quantity')
        expect(field3Price.isDirty()).toBe(true)
        expect(field3Quantity.isDirty()).toBe(true)
        expect(field3Price.value()).toBe(150)
        expect(field3Quantity.value()).toBe(5)

        // Other items should shift accordingly
        const field0Price = formController.field('items.0.price')
        expect(field0Price.value()).toBe(250) // Original items.1

        const field2Price = formController.field('items.2.price')
        const field2Quantity = formController.field('items.2.quantity')
        expect(field2Price.isDirty()).toBe(false) // Original items.3, quantity was dirty
        expect(field2Quantity.isDirty()).toBe(true) // Original items.3 quantity
        expect(field2Quantity.value()).toBe(8)
      })
    })

    describe('field state cleanup', () => {
      it('should remove orphaned field states after array operations', () => {
        // Create field states for all items
        formController.field('items.0.price')
        formController.field('items.1.price')
        formController.field('items.2.price') // This doesn't exist in data but creates field state

        // Remove all items
        formController.arrayRemove('items', 0)
        formController.arrayRemove('items', 0)

        // All field states should be cleaned up
        const field0Price = formController.field('items.0.price')
        const field1Price = formController.field('items.1.price')
        const field2Price = formController.field('items.2.price')

        expect(field0Price.isDirty()).toBe(false)
        expect(field1Price.isDirty()).toBe(false)
        expect(field2Price.isDirty()).toBe(false)
        expect(field0Price.value()).toBeUndefined()
        expect(field1Price.value()).toBeUndefined()
        expect(field2Price.value()).toBeUndefined()
      })
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

    it('should validate when validate option is explicitly true', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      await formController.setValue('name', '', { validate: true })

      expect(nameField.errors()).toEqual(['Error'])
    })

    it('should not validate when validate option is explicitly false', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      await formController.setValue('name', '', { validate: false, dirty: true })

      expect(nameField.errors()).toEqual([])
    })

    it('should validate when validate is undefined and dirty is true (default)', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      await formController.setValue('name', '', { dirty: true })

      expect(nameField.errors()).toEqual(['Error'])
    })

    it('should not validate when validate is undefined and dirty is false', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      await formController.setValue('name', '', { dirty: false })

      expect(nameField.errors()).toEqual([])
    })

    it('should validate by default when no options are provided', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      await formController.setValue('name', '')

      expect(nameField.errors()).toEqual(['Error'])
    })

    it('should prioritize explicit validate option over dirty state', async () => {
      validator.mockFieldValidation('name', ['Error'])
      const nameField = formController.field('name')

      // validate=false should override dirty=true
      await formController.setValue('name', '', { validate: false, dirty: true })

      expect(nameField.errors()).toEqual([])
    })
  })
})