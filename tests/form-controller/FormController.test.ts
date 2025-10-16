import { describe, it, expect, beforeEach } from 'vitest'
import { FormController, PlainObjectDataSource } from '../../src'
import { MockFormValidator } from '../mocks/MockFormValidator'
import { effect } from 'alien-signals'
import createForm from '../../src'

describe('FormController', () => {
  let formController: FormController
  let dataSource: PlainObjectDataSource
  let validator: MockFormValidator
  let initialData: any

  const createInitialData = () =>
    JSON.parse(
      JSON.stringify({
        name: 'John',
        email: 'john@example.com',
        items: [
          { price: 100, quantity: 1 },
          { price: 200, quantity: 2 },
        ],
        address: {
          street: '123 Main St',
          city: 'LA',
        },
      })
    )

  beforeEach(() => {
    initialData = createInitialData()
    dataSource = new PlainObjectDataSource(createInitialData()) // Use a separate copy for the data source
    validator = new MockFormValidator()
    formController = createForm(dataSource, validator)
  })

  describe('initialization', () => {
    it('should initialize with data source and validator', () => {
      expect(formController).toBeDefined()
      expect(formController.getValues()).toEqual(initialData)
    })

    it('should initialize with default validator when none provided', () => {
      const controller = createForm(dataSource)
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

      formController.setErrors({ name: ['Custom error'] })

      expect(nameField.errors()).toEqual(['Custom error'])
      expect(nameField.isValid()).toBe(false)
    })

    it('should clear field errors when empty array is set', () => {
      const nameField = formController.field('name')

      formController.setErrors({ name: ['Error'] })
      formController.setErrors({ name: [] })

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
        name: ['Name is required'],
        email: ['Invalid email'],
      })

      const isValid = await formController.validate()

      expect(isValid).toBe(false)
      expect(formController.field('name').errors()).toEqual([
        'Name is required',
      ])
      expect(formController.field('email').errors()).toEqual(['Invalid email'])
    })

    it('should submit form when valid', async () => {
      validator.mockFormValidation({}) // No errors

      const result = await formController.submit()

      expect(result).toBe(true)
      expect(formController.isSubmitting()).toBe(false)
    })

    it('should not submit form when invalid', async () => {
      validator.mockFormValidation({ name: ['Error'] })

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
        name: ['Name error'],
        email: ['Email error'],
      })

      expect(formController.field('name').errors()).toEqual(['Name error'])
      expect(formController.field('email').errors()).toEqual(['Email error'])
      expect(formController.isValid()).toBe(false)
    })
  })

  describe('array operations', () => {
    it('should push items to arrays', async () => {
      const newItem = { price: 300, quantity: 3 }

      await formController.arrayAppend('items', newItem)

      const items = dataSource.get('items') as any[]
      expect(items).toHaveLength(3)
      expect(items[2]).toEqual(newItem)
      expect(formController.isDirty()).toBe(true)
    })

    it('should insert items at specific index', async () => {
      const newItem = { price: 150, quantity: 1.5 }

      await formController.arrayInsert('items', 1, newItem)

      const items = dataSource.get('items') as any[]
      expect(items).toHaveLength(3)
      expect(items[1]).toEqual(newItem)
      expect(items[2].price).toBe(200) // Original item shifted
    })

    it('should remove items from arrays', async () => {
      await formController.arrayRemove('items', 0)

      const items = dataSource.get('items') as any[]
      expect(items).toHaveLength(1)
      expect(items[0].price).toBe(200) // Second item becomes first
      expect(formController.isDirty()).toBe(true)
    })

    it('should move items within arrays', async () => {
      await formController.arrayMove('items', 0, 1)

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
        formController.arrayInsert('items', 0, newItem)

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
        formController.arrayInsert('items', 1, newItem)

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
        formController.arrayAppend('items', newItem)

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
        // @ts-ignore
        // Add a third item with dirty state first
        const originalField2Price = formController.field('items.2.price')
        await formController.setValue('items.2.price', 350, {
          validate: false,
        })
        const newItem = { price: 999, quantity: 9 }
        await formController.arrayAppend('items', newItem)

        // Remove middle item (index 1)
        await formController.arrayRemove('items', 1)

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
        await formController.arrayAppend('items', newItem1)
        await formController.arrayAppend('items', newItem2)

        // Create field states first, then set values
        formController.field('items.2.price')
        formController.field('items.3.quantity')
        await formController.setValue('items.2.price', 350, {
          validate: false,
        })
        await formController.setValue('items.3.quantity', 8, {
          validate: false,
        })

        // Move item from index 0 to index 3 (drag & drop behavior)
        await formController.arrayMove('items', 0, 3)

        // Original items.0 should now be at items.3
        const field3Price = formController.field('items.3.price')
        const field3Quantity = formController.field('items.3.quantity')
        expect(field3Price.isDirty()).toBe(true)
        expect(field3Quantity.isDirty()).toBe(true)
        expect(field3Price.value()).toBe(150)
        expect(field3Quantity.value()).toBe(5)

        // Original items.1 should now be at items.0 (shifted left)
        const field0Price = formController.field('items.0.price')
        const field0Quantity = formController.field('items.0.quantity')
        expect(field0Price.value()).toBe(250) // Original items.1 price (shifted left)
        expect(field0Quantity.value()).toBe(2) // Original items.1 quantity

        // Original items.2 should now be at items.1 (shifted left)
        const field1Price = formController.field('items.1.price')
        expect(field1Price.value()).toBe(350) // Original items.2 price was modified to 350
        expect(field1Price.isDirty()).toBe(true) // Original items.2 price was modified

        // Original items.3 should now be at items.2 (shifted left)
        const field2Price = formController.field('items.2.price')
        const field2Quantity = formController.field('items.2.quantity')
        expect(field2Price.value()).toBe(400) // Original items.3 price
        expect(field2Quantity.value()).toBe(8) // Original items.3 quantity was modified to 8
        expect(field2Quantity.isDirty()).toBe(true) // Original items.3 quantity was modified
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

      formController.setErrors({ name: ['Error'] })

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
      formController.setErrors({ name: ['Error'] })
      expect(validityStates[validityStates.length - 1]).toBe(false)

      // Clear error - should become valid again
      formController.setErrors({ name: [] })
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

      expect(field1.value()).toBe('Jane')
      expect(field1.isDirty()).toBe(true)
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
        await formController.setValue('name', 'Jane'),
        await formController.setValue('name', 'Bob'),
        await formController.validateField('name'),
        await formController.validate(),
      ]

      await Promise.all(promises)

      // Last setValue should win
      expect(nameField.value()).toBe('Bob')
    })

    it('should handle validation errors during validation', async () => {
      validator.mockFormValidation({ name: ['Error'] })

      const result = await formController.validate()

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
        dirty: false,
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

      await formController.setValue('name', '', {
        validate: false,
        dirty: true,
      })

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
      await formController.setValue('name', '', {
        validate: false,
        dirty: true,
      })

      expect(nameField.errors()).toEqual([])
    })
  })

  describe('array operations with validation', () => {
    beforeEach(() => {
      dataSource.set('items', [
        { name: 'Item 1', value: 10 },
        { name: 'Item 2', value: 20 },
        { name: 'Item 3', value: 30 },
      ])
    })

    it('should revalidate previously validated fields when inserting array item', async () => {
      // Setup: validate some fields first
      validator.mockFieldValidation('items.0.name', ['Error 0'])
      validator.mockFieldValidation('items.1.name', ['Error 1'])
      validator.mockFieldValidation('items.2.name', ['Error 2'])

      const field0 = formController.field('items.0.name')
      const field1 = formController.field('items.1.name')
      const field2 = formController.field('items.2.name')

      await formController.validateField('items.0.name')
      await formController.validateField('items.1.name')
      await formController.validateField('items.2.name')

      expect(field0.wasValidated()).toBe(true)
      expect(field1.wasValidated()).toBe(true)
      expect(field2.wasValidated()).toBe(true)

      // Clear validation mocks and setup new ones for shifted positions
      validator.clearMocks()
      validator.mockFieldValidation('items.1.name', ['New Error 1'])
      validator.mockFieldValidation('items.2.name', ['New Error 2'])
      validator.mockFieldValidation('items.3.name', ['New Error 3'])

      // Insert item at index 1
      await formController.arrayInsert('items', 1, {
        name: 'New Item',
        value: 15,
      })

      // Check that previously validated fields were revalidated at new positions
      const newField1 = formController.field('items.1.name')
      const newField2 = formController.field('items.2.name')
      const newField3 = formController.field('items.3.name')

      expect(newField1.value()).toBe('New Item')
      expect(newField2.value()).toBe('Item 2')
      expect(newField3.value()).toBe('Item 3')

      expect(newField2.errors()).toEqual(['New Error 2'])
      expect(newField3.errors()).toEqual(['New Error 3'])
    })

    it('should revalidate previously validated fields when removing array item', async () => {
      // Setup: validate some fields first
      validator.mockFieldValidation('items.0.name', ['Error 0'])
      validator.mockFieldValidation('items.1.name', ['Error 1'])
      validator.mockFieldValidation('items.2.name', ['Error 2'])

      const field0 = formController.field('items.0.name')
      const field1 = formController.field('items.1.name')
      const field2 = formController.field('items.2.name')

      await formController.validateField('items.0.name')
      await formController.validateField('items.1.name')
      await formController.validateField('items.2.name')

      expect(field0.wasValidated()).toBe(true)
      expect(field1.wasValidated()).toBe(true)
      expect(field2.wasValidated()).toBe(true)

      // Clear validation mocks and setup new ones for shifted positions
      validator.clearMocks()
      validator.mockFieldValidation('items.0.name', ['Preserved Error 0'])
      validator.mockFieldValidation('items.1.name', ['Shifted Error 1'])

      // Remove item at index 1
      await formController.arrayRemove('items', 1)

      // Check that field 0 was preserved and field 2 was shifted to position 1
      const preservedField0 = formController.field('items.0.name')
      const shiftedField1 = formController.field('items.1.name')

      expect(preservedField0.value()).toBe('Item 1')
      expect(shiftedField1.value()).toBe('Item 3')

      expect(preservedField0.errors()).toEqual(['Preserved Error 0'])
      expect(shiftedField1.errors()).toEqual(['Shifted Error 1'])
    })

    it('should revalidate previously validated fields when moving array items', async () => {
      // Setup: validate some fields first
      validator.mockFieldValidation('items.0.name', ['Error 0'])
      validator.mockFieldValidation('items.1.name', ['Error 1'])
      validator.mockFieldValidation('items.2.name', ['Error 2'])

      const field0 = formController.field('items.0.name')
      const field1 = formController.field('items.1.name')
      const field2 = formController.field('items.2.name')

      await formController.validateField('items.0.name')
      await formController.validateField('items.1.name')
      await formController.validateField('items.2.name')

      expect(field0.wasValidated()).toBe(true)
      expect(field1.wasValidated()).toBe(true)
      expect(field2.wasValidated()).toBe(true)

      // Clear validation mocks and setup new ones for moved positions
      validator.clearMocks()
      validator.mockFieldValidation('items.0.name', ['Moved Error 0'])
      validator.mockFieldValidation('items.1.name', ['Moved Error 1'])
      validator.mockFieldValidation('items.2.name', ['Moved Error 2'])

      // Move item from index 0 to index 2 (drag & drop behavior)
      await formController.arrayMove('items', 0, 2)

      // Check that fields were revalidated at their new positions
      const movedField0 = formController.field('items.0.name')
      const movedField1 = formController.field('items.1.name')
      const movedField2 = formController.field('items.2.name')

      expect(movedField0.value()).toBe('Item 2') // Item 2 shifted left from index 1
      expect(movedField1.value()).toBe('Item 3') // Item 3 shifted left from index 2
      expect(movedField2.value()).toBe('Item 1') // Item 1 moved from index 0 to index 2

      expect(movedField0.errors()).toEqual(['Moved Error 0'])
      expect(movedField1.errors()).toEqual(['Moved Error 1'])
      expect(movedField2.errors()).toEqual(['Moved Error 2'])
    })

    it('should preserve field state during array operations', async () => {
      // Setup field states
      const field0 = formController.field('items.0.name')
      const field1 = formController.field('items.1.name')
      const field2 = formController.field('items.2.name')

      // Make fields dirty and touched
      await formController.setValue('items.0.name', 'Modified 0')
      await formController.setValue('items.1.name', 'Modified 1')
      await formController.setValue('items.2.name', 'Modified 2')

      expect(field0.isDirty()).toBe(true)
      expect(field0.isTouched()).toBe(true)
      expect(field1.isDirty()).toBe(true)
      expect(field1.isTouched()).toBe(true)
      expect(field2.isDirty()).toBe(true)
      expect(field2.isTouched()).toBe(true)

      // Insert item at index 1
      await formController.arrayInsert('items', 1, {
        name: 'New Item',
        value: 15,
      })

      // Check that field states were preserved and shifted correctly
      const newField1 = formController.field('items.1.name')
      const shiftedField2 = formController.field('items.2.name')
      const shiftedField3 = formController.field('items.3.name')

      // New field should not be dirty/touched
      expect(newField1.isDirty()).toBe(false)
      expect(newField1.isTouched()).toBe(false)

      // Shifted fields should preserve their states
      expect(shiftedField2.isDirty()).toBe(true)
      expect(shiftedField2.isTouched()).toBe(true)
      expect(shiftedField3.isDirty()).toBe(true)
      expect(shiftedField3.isTouched()).toBe(true)
    })

    it('should not revalidate fields that were never validated', async () => {
      // Setup: create fields but don't validate them
      const field0 = formController.field('items.0.name')
      const field1 = formController.field('items.1.name')
      const field2 = formController.field('items.2.name')

      expect(field0.wasValidated()).toBe(false)
      expect(field1.wasValidated()).toBe(false)
      expect(field2.wasValidated()).toBe(false)

      // Setup validation mocks (these should not be called)
      validator.mockFieldValidation('items.1.name', ['Should not be called'])
      validator.mockFieldValidation('items.2.name', ['Should not be called'])

      // Insert item at index 1
      await formController.arrayInsert('items', 1, {
        name: 'New Item',
        value: 15,
      })

      // Check that validation was not triggered for unvalidated fields
      const newField1 = formController.field('items.1.name')
      const shiftedField2 = formController.field('items.2.name')
      const shiftedField3 = formController.field('items.3.name')

      expect(newField1.errors()).toEqual([])
      expect(shiftedField2.errors()).toEqual([])
      expect(shiftedField3.errors()).toEqual([])
    })
  })

  describe('field-specific change tracking', () => {
    it('should only trigger valueUpdated for the specific field being updated', () => {
      const nameChanges: number[] = []
      const emailChanges: number[] = []

      // Get field references
      const nameField = formController.field('name')
      const emailField = formController.field('email')

      // Subscribe to field-specific changes
      const disposeNameEffect = effect(() => {
        nameChanges.push(nameField.valueUpdated())
      })

      const disposeEmailEffect = effect(() => {
        emailChanges.push(emailField.valueUpdated())
      })

      // Both should have initial value
      expect(nameChanges).toEqual([0])
      expect(emailChanges).toEqual([0])

      // Update name field
      formController.setValue('name', 'Jane')

      // Only name field should change
      expect(nameChanges).toEqual([0, 1])
      expect(emailChanges).toEqual([0]) // Should not change

      // Update email field
      formController.setValue('email', 'jane@example.com')

      // Only email field should change
      expect(nameChanges).toEqual([0, 1]) // Should not change
      expect(emailChanges).toEqual([0, 1])

      // Cleanup
      disposeNameEffect()
      disposeEmailEffect()
    })

    it('should trigger valueUpdated for parent fields when nested field changes', () => {
      const addressChanges: number[] = []
      const addressStreetChanges: number[] = []

      // Get field references (create parent field first)
      const addressField = formController.field('address')
      const addressStreetField = formController.field('address.street')

      // Subscribe to both parent and child fields
      const disposeAddressEffect = effect(() => {
        addressChanges.push(addressField.valueUpdated())
      })

      const disposeStreetEffect = effect(() => {
        addressStreetChanges.push(addressStreetField.valueUpdated())
      })

      // Both should have initial value
      expect(addressChanges).toEqual([0])
      expect(addressStreetChanges).toEqual([0])

      // Update nested field
      formController.setValue('address.street', '456 Oak Ave')

      // Both parent and child fields should change
      expect(addressStreetChanges).toEqual([0, 1])
      expect(addressChanges).toEqual([0, 1]) // Parent field should also change

      // Cleanup
      disposeAddressEffect()
      disposeStreetEffect()
    })

    it('should trigger valueUpdated for array field when array operations occur', async () => {
      const itemsChanges: number[] = []

      // Get field reference
      const itemsField = formController.field('items')

      // Subscribe to array field
      const disposeEffect = effect(() => {
        itemsChanges.push(itemsField.valueUpdated())
      })

      // Should have initial value
      expect(itemsChanges).toEqual([0])

      // Add item to array
      await formController.arrayAppend('items', { price: 300, quantity: 1 })

      // Array field should change
      expect(itemsChanges).toEqual([0, 1])

      // Remove item from array
      await formController.arrayRemove('items', 0)

      // Array field should change again
      expect(itemsChanges).toEqual([0, 1, 2])

      // Cleanup
      disposeEffect()
    })

    it('should trigger valueUpdated for all fields on reset', () => {
      const nameChanges: number[] = []
      const emailChanges: number[] = []

      // Get field references
      const nameField = formController.field('name')
      const emailField = formController.field('email')

      // Subscribe to field-specific changes
      const disposeNameEffect = effect(() => {
        nameChanges.push(nameField.valueUpdated())
      })

      const disposeEmailEffect = effect(() => {
        emailChanges.push(emailField.valueUpdated())
      })

      // Initial values
      expect(nameChanges).toEqual([0])
      expect(emailChanges).toEqual([0])

      // Update both fields
      formController.setValue('name', 'Jane')
      formController.setValue('email', 'jane@example.com')

      expect(nameChanges).toEqual([0, 1])
      expect(emailChanges).toEqual([0, 1])

      // Reset form
      formController.reset()

      // Both fields should change
      expect(nameChanges).toEqual([0, 1, 2])
      expect(emailChanges).toEqual([0, 1, 2])

      // Cleanup
      disposeNameEffect()
      disposeEmailEffect()
    })

    it('should trigger valueUpdated for child fields when parent changes', () => {
      const addressChanges: number[] = []
      const addressStreetChanges: number[] = []
      const addressCityChanges: number[] = []

      // Get field references
      const addressField = formController.field('address')
      const addressStreetField = formController.field('address.street')
      const addressCityField = formController.field('address.city')

      // Subscribe to fields
      const disposeAddressEffect = effect(() => {
        addressChanges.push(addressField.valueUpdated())
      })

      const disposeStreetEffect = effect(() => {
        addressStreetChanges.push(addressStreetField.valueUpdated())
      })

      const disposeCityEffect = effect(() => {
        addressCityChanges.push(addressCityField.valueUpdated())
      })

      // Initial values
      expect(addressChanges).toEqual([0])
      expect(addressStreetChanges).toEqual([0])
      expect(addressCityChanges).toEqual([0])

      // Trigger change on parent (simulating array reorder or object replacement)
      // @ts-ignore
      formController.triggerValueChanged('address')

      // Parent and ALL children should change
      expect(addressChanges).toEqual([0, 1])
      expect(addressStreetChanges).toEqual([0, 1]) // Child should change
      expect(addressCityChanges).toEqual([0, 1]) // Child should change

      // Cleanup
      disposeAddressEffect()
      disposeStreetEffect()
      disposeCityEffect()
    })

    it('should trigger valueUpdated for array item fields when array changes', async () => {
      const itemsChanges: number[] = []
      const item0PriceChanges: number[] = []
      const item1PriceChanges: number[] = []

      // Get field references
      const itemsField = formController.field('items')
      const item0PriceField = formController.field('items.0.price')
      const item1PriceField = formController.field('items.1.price')

      // Subscribe to fields
      const disposeItemsEffect = effect(() => {
        itemsChanges.push(itemsField.valueUpdated())
      })

      const disposeItem0Effect = effect(() => {
        item0PriceChanges.push(item0PriceField.valueUpdated())
      })

      const disposeItem1Effect = effect(() => {
        item1PriceChanges.push(item1PriceField.valueUpdated())
      })

      // Initial values
      expect(itemsChanges).toEqual([0])
      expect(item0PriceChanges).toEqual([0])
      expect(item1PriceChanges).toEqual([0])

      // Move array items (this changes order, so all children should update)
      await formController.arrayMove('items', 0, 1)

      // Array and ALL item fields should change
      expect(itemsChanges.length).toBeGreaterThan(1)
      expect(item0PriceChanges.length).toBeGreaterThan(1) // Now points to different data
      expect(item1PriceChanges.length).toBeGreaterThan(1) // Now points to different data

      // Cleanup
      disposeItemsEffect()
      disposeItem0Effect()
      disposeItem1Effect()
    })
  })
})
