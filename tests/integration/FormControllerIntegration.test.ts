import { describe, it, expect, beforeEach } from 'vitest'
import { FormController, PlainObjectDataSource } from '../../src'
import { MockFormValidator } from '../mocks/MockFormValidator'
import { effect } from 'alien-signals'
import createForm from '../../src'

describe('FormController Integration', () => {
  let formController: FormController
  let dataSource: PlainObjectDataSource
  let validator: MockFormValidator
  let initialData: any

  const createInitialData = () =>
    JSON.parse(
      JSON.stringify({
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          profile: {
            bio: 'Software Developer',
            avatar: null,
          },
        },
        products: [
          {
            id: 1,
            name: 'Product 1',
            price: 100,
            tags: ['electronics', 'mobile'],
          },
          {
            id: 2,
            name: 'Product 2',
            price: 200,
            tags: ['electronics', 'computer'],
          },
        ],
        settings: {
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          preferences: ['dark-mode', 'auto-save'],
        },
      })
    )

  beforeEach(() => {
    initialData = createInitialData()
    dataSource = new PlainObjectDataSource(createInitialData()) // Use a separate copy for the data source
    validator = new MockFormValidator()
    formController = createForm(dataSource, validator)
  })

  describe('real-world form scenarios', () => {
    it('should handle user profile editing workflow', async () => {
      // Get field controllers
      const nameField = formController.field('user.name')
      const emailField = formController.field('user.email')
      // @ts-ignore
      const bioField = formController.field('user.profile.bio')

      // Track form state changes
      const stateChanges: any[] = []
      effect(() => {
        stateChanges.push({
          isDirty: formController.isDirty(),
          isTouched: formController.isTouched(),
          isValid: formController.isValid(),
        })
      })

      // Initial state should be clean
      expect(formController.isDirty()).toBe(false)
      expect(formController.isTouched()).toBe(false)

      // Update user name
      await formController.setValue('user.name', 'Jane Doe')
      expect(nameField.isDirty()).toBe(true)
      expect(formController.isDirty()).toBe(true)

      // Update email with validation error
      validator.mockFieldValidation('user.email', ['Invalid email format'])
      await formController.setValue('user.email', 'invalid-email')
      expect(emailField.errors()).toEqual(['Invalid email format'])
      expect(formController.isValid()).toBe(false)

      // Fix email
      validator.mockFieldValidation('user.email', [])
      await formController.setValue('user.email', 'jane@example.com')
      expect(emailField.errors()).toEqual([])
      expect(formController.isValid()).toBe(true)

      // Update bio
      await formController.setValue(
        'user.profile.bio',
        'Senior Software Developer'
      )

      // Verify final state
      expect(formController.getValues()).toMatchObject({
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          profile: {
            bio: 'Senior Software Developer',
          },
        },
      })
    })

    it('should handle product management with array operations', async () => {
      // Initial product count
      expect(dataSource.get('products')).toHaveLength(2)

      // Add new product
      const newProduct = {
        id: 3,
        name: 'Product 3',
        price: 300,
        tags: ['electronics', 'gaming'],
      }
      await formController.arrayAppend('products', newProduct)

      expect(dataSource.get('products')).toHaveLength(3)
      expect(formController.field('products.2.name').value()).toBe('Product 3')

      // Update product price
      const priceField = formController.field('products.0.price')
      await formController.setValue('products.0.price', 150)
      expect(priceField.value()).toBe(150)

      // Move product (reorder)
      formController.arrayMove('products', 0, 2)
      expect(formController.field('products.2.price').value()).toBe(150)
      expect(formController.field('products.0.name').value()).toBe('Product 2')

      // Remove product
      formController.arrayRemove('products', 1)
      expect(dataSource.get('products')).toHaveLength(2)

      expect(formController.isDirty()).toBe(true)
    })

    it('should handle nested settings configuration', async () => {
      // Toggle email notifications
      const emailNotifField = formController.field(
        'settings.notifications.email'
      )
      await formController.setValue('settings.notifications.email', false)
      expect(emailNotifField.value()).toBe(false)

      // Add new preference
      formController.arrayAppend('settings.preferences', 'compact-view')
      expect(dataSource.get('settings.preferences')).toContain('compact-view')

      // Update nested notification setting
      // @ts-ignore
      const pushNotifField = formController.field('settings.notifications.push')
      await formController.setValue('settings.notifications.push', false)

      // Verify nested structure
      expect(formController.getValues()).toMatchObject({
        settings: {
          notifications: {
            email: false,
            sms: false,
            push: false,
          },
          preferences: ['dark-mode', 'auto-save', 'compact-view'],
        },
      })
    })
  })

  describe('reactive behavior', () => {
    it('should propagate changes through reactive signals', async () => {
      const nameField = formController.field('user.name')
      const formValidChanges: boolean[] = []
      const fieldValidChanges: boolean[] = []

      // Track form validity
      effect(() => {
        formValidChanges.push(formController.isValid())
      })

      // Track field validity
      effect(() => {
        fieldValidChanges.push(nameField.isValid())
      })

      // Start valid
      expect(formValidChanges[formValidChanges.length - 1]).toBe(true)
      expect(fieldValidChanges[fieldValidChanges.length - 1]).toBe(true)

      // Add validation error
      validator.mockFieldValidation('user.name', ['Name is required'])
      await formController.setValue('user.name', '')

      // Should become invalid
      expect(formValidChanges[formValidChanges.length - 1]).toBe(false)
      expect(fieldValidChanges[fieldValidChanges.length - 1]).toBe(false)

      // Clear error
      validator.mockFieldValidation('user.name', [])
      await formController.setValue('user.name', 'John')

      // Should become valid again
      expect(formValidChanges[formValidChanges.length - 1]).toBe(true)
      expect(fieldValidChanges[fieldValidChanges.length - 1]).toBe(true)
    })

    it('should handle multiple simultaneous field updates', async () => {
      const nameField = formController.field('user.name')
      const emailField = formController.field('user.email')
      const priceField = formController.field('products.0.price')

      // Update multiple fields simultaneously
      await Promise.all([
        formController.setValue('user.name', 'Jane'),
        formController.setValue('user.email', 'jane@example.com'),
        formController.setValue('products.0.price', 150),
      ])

      expect(nameField.value()).toBe('Jane')
      expect(emailField.value()).toBe('jane@example.com')
      expect(priceField.value()).toBe(150)
      expect(formController.isDirty()).toBe(true)
    })

    it('should maintain field state consistency', async () => {
      const field1 = formController.field('user.name')
      const field2 = formController.field('user.name') // Same path

      // Should be the same instance
      expect(field1).toBe(field2)

      // Changes should be reflected in both references
      await formController.setValue('user.name', 'New Name')
      expect(field2.value()).toBe('New Name')
      expect(field2.isDirty()).toBe(true)
    })
  })

  describe('validation workflows', () => {
    it('should handle server-side validation errors', async () => {
      // Simulate server validation errors
      const serverErrors = {
        'user.email': ['Email already exists'],
        'products.0.name': ['Product name must be unique'],
      }

      formController.setErrors(serverErrors)

      expect(formController.field('user.email').errors()).toEqual([
        'Email already exists',
      ])
      expect(formController.field('products.0.name').errors()).toEqual([
        'Product name must be unique',
      ])
      expect(formController.isValid()).toBe(false)

      // Clear one error
      formController.setErrors({ 'user.email': [] })
      expect(formController.field('user.email').isValid()).toBe(true)
      expect(formController.isValid()).toBe(false) // Still invalid due to product name

      // Clear all errors
      formController.setErrors({ 'products.0.name': [] })
      expect(formController.isValid()).toBe(true)
    })

    it('should handle async validation with loading states', async () => {
      const emailField = formController.field('user.email')

      // Mock async validation with delay
      validator.mockAsyncValidation('user.email', ['Email not available'], 100)

      const validationPromise = formController.validateField('user.email')

      // Should be validating
      expect(emailField.isValidating()).toBe(true)

      const result = await validationPromise

      // Should complete with error
      expect(result).toBe(false)
      expect(emailField.isValidating()).toBe(false)
      expect(emailField.errors()).toEqual(['Email not available'])
    })

    it('should handle form validation workflow', async () => {
      // Set up form with validation errors
      validator.mockFormValidation({
        'user.name': ['Name is required'],
        'products.0.price': ['Price must be positive'],
      })

      // Attempt to validate
      const result = await formController.validate()

      expect(result).toBe(false)
      expect(formController.isValid()).toBe(false)
      expect(formController.field('user.name').errors()).toEqual([
        'Name is required',
      ])
      expect(formController.field('products.0.price').errors()).toEqual([
        'Price must be positive',
      ])

      // Fix validation errors
      validator.mockFormValidation({})

      // Validate again
      const result2 = await formController.validate()
      expect(result2).toBe(true)
      expect(formController.isValid()).toBe(true)
    })
  })

  describe('complex data manipulation', () => {
    it('should handle deep nested updates', async () => {
      // Create deep nested structure
      const deepField = formController.field(
        'user.profile.settings.theme.colors.primary'
      )
      await formController.setValue(
        'user.profile.settings.theme.colors.primary',
        '#007bff'
      )

      expect(dataSource.get('user.profile.settings.theme.colors.primary')).toBe(
        '#007bff'
      )
      expect(deepField.value()).toBe('#007bff')

      // Update another deep field
      // @ts-ignore
      const secondaryField = formController.field(
        'user.profile.settings.theme.colors.secondary'
      )
      await formController.setValue(
        'user.profile.settings.theme.colors.secondary',
        '#6c757d'
      )

      expect(
        dataSource.get('user.profile.settings.theme.colors.secondary')
      ).toBe('#6c757d')
    })

    it('should handle array of objects with complex operations', async () => {
      // Add new product with tags
      const newProduct = {
        id: 3,
        name: 'Gaming Laptop',
        price: 1500,
        tags: ['electronics', 'gaming', 'computer'],
      }
      formController.arrayAppend('products', newProduct)

      // Update tags for first product
      formController.arrayAppend('products.0.tags', 'bestseller')
      formController.arrayAppend('products.0.tags', 'featured')

      expect(formController.field('products.0.tags').value()).toContain(
        'bestseller'
      )
      expect(formController.field('products.0.tags').value()).toContain(
        'featured'
      )

      // Remove a tag
      formController.arrayRemove('products.0.tags', 0) // Remove 'electronics'

      const tags = formController.field('products.0.tags').value() as string[]
      expect(tags).not.toContain('electronics')
      expect(tags).toContain('mobile')
    })

    it('should maintain data integrity during complex operations', async () => {
      const originalData = JSON.parse(JSON.stringify(initialData))

      // Perform multiple operations
      await formController.setValue('user.name', 'Updated Name')
      formController.arrayAppend('products', {
        id: 3,
        name: 'New Product',
        price: 300,
        tags: [],
      })
      await formController.setValue('settings.notifications.email', false)
      formController.arrayRemove('products', 0)

      // Reset should restore original data
      formController.reset()

      expect(formController.getValues()).toEqual(originalData)
      expect(formController.isDirty()).toBe(false)
      expect(formController.isTouched()).toBe(false)
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle invalid path operations gracefully', async () => {
      // Try to set value on invalid path - our implementation creates missing paths
      const invalidField = formController.field(
        'non.existent.deeply.nested.path'
      )

      expect(() =>
        formController.setValue('non.existent.deeply.nested.path', 'test')
      ).not.toThrow()
      await formController.setValue('non.existent.deeply.nested.path', 'test')
      expect(invalidField.value()).toBe('test') // Path is created and value is set
    })

    it('should handle array operations on non-arrays', () => {
      // Try array operations on non-array field
      expect(() =>
        formController.arrayAppend('user.name', 'test')
      ).not.toThrow()
      expect(() => formController.arrayRemove('user.name', 0)).not.toThrow()
      expect(() => formController.arrayMove('user.name', 0, 1)).not.toThrow()
    })

    it('should handle circular data references', () => {
      const circularData: any = { name: 'test' }
      circularData.self = circularData

      const circularDataSource = new PlainObjectDataSource(circularData)
      const circularController = new FormController(circularDataSource)

      expect(() => {
        // @ts-ignore
        const field = circularController.field('name')
        circularController.setValue('name', 'updated')
      }).not.toThrow()
    })

    it('should handle concurrent validation requests', async () => {
      const emailField = formController.field('user.email')

      // Start multiple validations
      const validations = [
        formController.validateField('user.email'),
        formController.validateField('user.email'),
        formController.validateField('user.email'),
      ]

      const results = await Promise.all(validations)

      // All should complete without errors
      expect(results).toEqual([true, true, true])
      expect(emailField.isValidating()).toBe(false)
    })
  })

  describe('performance and memory', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random() * 1000,
          tags: [`tag${i % 10}`, `category${i % 5}`],
        })),
      }

      const largeDataSource = new PlainObjectDataSource(largeData)
      const largeController = createForm(largeDataSource, validator)

      const startTime = Date.now()

      // Perform operations on large dataset
      await largeController.setValue('items.500.name', 'Updated Item 500')
      await largeController.validate()
      largeController.arrayAppend('items', {
        id: 1000,
        name: 'New Item',
        value: 500,
        tags: [],
      })
      largeController.arrayMove('items', 999, 3)

      const endTime = Date.now()

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(300)
      expect(largeController.field('items.501.name').value()).toBe(
        'Updated Item 500'
      )
    })

    it('should properly cleanup resources', () => {
      // @ts-ignore
      const field = formController.field('user.name')

      // Create many field references
      // @ts-ignore
      const fields = Array.from({ length: 100 }, () =>
        formController.field(`test.${Math.random()}`)
      )

      expect(() => formController.destroy()).not.toThrow()

      // After destroy, operations should not cause memory leaks
      expect(() => formController.setValue('user.name', 'test')).not.toThrow()
    })
  })
})
