import { describe, it, expect, beforeEach } from 'vitest'
import { FormController, PlainObjectDataSource } from '../../src'
import { MockFormValidator } from '../mocks/MockFormValidator'
import createForm from '../../src'

describe('FormController - Repeatable Field Validation', () => {
  let formController: FormController
  let dataSource: PlainObjectDataSource
  let validator: MockFormValidator

  beforeEach(() => {
    // Initial data with one order item that will be invalid
    const initialData = {
      orderItems: [
        { name: '', price: 10 }, // Empty name will be invalid
      ],
    }

    dataSource = new PlainObjectDataSource(initialData)
    validator = new MockFormValidator()

    // Configure validator to fail for empty names on any path ending with '.name'
    const originalValidateField = validator.validateField.bind(validator)
    // @ts-ignore
    const originalValidate = validator.validate.bind(validator)

    validator.validateField = async (
      path: string,
      dataSource: PlainObjectDataSource
    ) => {
      const value = dataSource.get(path)
      if (path.endsWith('.name') && (value === '' || value == null)) {
        return ['Name is required']
      }
      return originalValidateField(path, dataSource)
    }

    validator.validate = async (dataSource: PlainObjectDataSource) => {
      const errors: Record<string, string[]> = {}
      const data = dataSource.all()

      // Find all paths with empty names
      const findEmptyNames = (obj: any, basePath = ''): void => {
        for (const key in obj) {
          const currentPath = basePath ? `${basePath}.${key}` : key
          if (key === 'name' && (obj[key] === '' || obj[key] == null)) {
            errors[currentPath] = ['Name is required']
          } else if (
            typeof obj[key] === 'object' &&
            obj[key] !== null &&
            !Array.isArray(obj[key])
          ) {
            findEmptyNames(obj[key], currentPath)
          } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item: any, index: number) => {
              if (typeof item === 'object' && item !== null) {
                findEmptyNames(item, `${currentPath}.${index}`)
              }
            })
          }
        }
      }

      findEmptyNames(data)
      return errors
    }

    formController = createForm(dataSource, validator)
  })

  it('should clear validation errors when invalid field is removed from repeatable array', async () => {
    // Step 1: Validate the form to attach error messages (empty name will fail)
    await formController.validate()

    // Verify the error is present
    const firstItemNameField = formController.field('orderItems.0.name')
    expect(firstItemNameField.errors()).toEqual(['Name is required'])
    expect(firstItemNameField.wasValidated()).toBe(true)

    // Step 3: Add a new item to the end of the array
    const newItem = { name: 'New Item', price: 20 }
    await formController.arrayAppend('orderItems', newItem)

    // Verify we now have 2 items
    const orderItems = formController.getValue('orderItems') as any[]
    expect(orderItems).toHaveLength(2)
    expect(orderItems[0]).toEqual({ name: '', price: 10 })
    expect(orderItems[1]).toEqual({ name: 'New Item', price: 20 })

    // The error should still be on the first item
    expect(formController.field('orderItems.0.name').errors()).toEqual([
      'Name is required',
    ])

    // Step 4: Remove the first item (the one with the validation error)
    await formController.arrayRemove('orderItems', 0)

    // Verify we now have 1 item and it's the second item (now at index 0)
    const updatedItems = formController.getValue('orderItems') as any[]
    expect(updatedItems).toHaveLength(1)
    expect(updatedItems[0]).toEqual({ name: 'New Item', price: 20 })

    // Step 5: Verify the validation error has disappeared
    // The field that previously had the error no longer exists
    // The new orderItems.0.name field should not have any errors
    const newFirstItemField = formController.field('orderItems.0.name')
    expect(newFirstItemField.errors()).toEqual([])
    expect(newFirstItemField.wasValidated()).toBe(false)
    expect(newFirstItemField.value()).toBe('New Item')

    // Form should also be valid since the invalid field was removed
    expect(formController.isValid()).toBe(true)
  })

  it('should handle validation state correctly when middle item is removed', async () => {
    // Start with 3 items
    await formController.arrayAppend('orderItems', {
      name: 'Second Item',
      price: 15,
    })
    await formController.arrayAppend('orderItems', { name: '', price: 25 }) // Invalid third item

    // Validate to attach errors (validator will automatically fail empty names)
    await formController.validate()

    // Verify initial state
    expect(formController.field('orderItems.0.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.1.name').errors()).toEqual([])
    expect(formController.field('orderItems.2.name').errors()).toEqual([
      'Name is required',
    ])

    // Remove the middle item (index 1)
    await formController.arrayRemove('orderItems', 1)

    // After removal:
    // - orderItems.0 should still have its error (was index 0, still index 0)
    // - orderItems.1 should have the error from what was orderItems.2 (shifted down)
    const items = formController.getValue('orderItems') as any[]
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ name: '', price: 10 })
    expect(items[1]).toEqual({ name: '', price: 25 })

    // The error states should have shifted appropriately
    expect(formController.field('orderItems.0.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.1.name').errors()).toEqual([
      'Name is required',
    ])
  })

  it('should clear all validation errors when entire array is cleared', async () => {
    // Add more items with validation errors
    await formController.arrayAppend('orderItems', { name: '', price: 15 })
    await formController.arrayAppend('orderItems', { name: '', price: 25 })

    // Validate to attach errors (validator will automatically fail empty names)
    await formController.validate()

    // Verify all errors are present
    expect(formController.field('orderItems.0.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.1.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.2.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.isValid()).toBe(false)

    // Remove all items
    await formController.arrayRemove('orderItems', 2)
    await formController.arrayRemove('orderItems', 1)
    await formController.arrayRemove('orderItems', 0)

    // Verify array is empty
    const items = formController.getValue('orderItems') as any[]
    expect(items).toHaveLength(0)

    // Form should now be valid since all invalid fields are gone
    expect(formController.isValid()).toBe(true)

    // Any attempt to access the removed fields should return clean state
    expect(formController.field('orderItems.0.name').errors()).toEqual([])
    expect(formController.field('orderItems.0.name').wasValidated()).toBe(false)
  })

  it('should maintain validation state for remaining items after partial removal', async () => {
    // Start with 3 items: valid, invalid, valid
    await formController.setValue('orderItems.0.name', 'Valid Item 1')
    await formController.arrayAppend('orderItems', { name: '', price: 15 }) // Invalid
    await formController.arrayAppend('orderItems', {
      name: 'Valid Item 3',
      price: 25,
    })

    // Validate to attach errors (validator will automatically fail empty names)
    await formController.validate()

    // Verify initial state (only middle item has empty name, so only it has errors)
    expect(formController.field('orderItems.0.name').errors()).toEqual([])
    expect(formController.field('orderItems.1.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.2.name').errors()).toEqual([])
    expect(formController.isValid()).toBe(false)

    // Remove the invalid middle item
    await formController.arrayRemove('orderItems', 1)

    // Verify remaining items and their validation states
    const items = formController.getValue('orderItems') as any[]
    expect(items).toHaveLength(2)
    expect(items[0].name).toBe('Valid Item 1')
    expect(items[1].name).toBe('Valid Item 3')

    // Validation states should be preserved for remaining items
    expect(formController.field('orderItems.0.name').errors()).toEqual([])
    expect(formController.field('orderItems.1.name').errors()).toEqual([])

    // Form should now be valid
    expect(formController.isValid()).toBe(true)
  })

  it('should preserve validation errors correctly when array items are moved', async () => {
    // Start with 5 items: valid, invalid, valid, invalid, valid
    await formController.setValue('orderItems.0.name', 'Valid Item 1')
    await formController.arrayAppend('orderItems', { name: '', price: 15 }) // Invalid at index 1
    await formController.arrayAppend('orderItems', {
      name: 'Valid Item 3',
      price: 25,
    })
    await formController.arrayAppend('orderItems', { name: '', price: 35 }) // Invalid at index 3
    await formController.arrayAppend('orderItems', {
      name: 'Valid Item 5',
      price: 45,
    }) // Valid at index 4

    // Validate to attach errors (validator will automatically fail empty names)
    await formController.validate()

    // Verify initial state - errors on indices 1 and 3 only
    expect(formController.field('orderItems.0.name').errors()).toEqual([])
    expect(formController.field('orderItems.1.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.2.name').errors()).toEqual([])
    expect(formController.field('orderItems.3.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.4.name').errors()).toEqual([])
    expect(formController.isValid()).toBe(false)

    // Verify initial data values
    const initialItems = formController.getValue('orderItems') as any[]
    expect(initialItems).toHaveLength(5)
    expect(initialItems[0].name).toBe('Valid Item 1')
    expect(initialItems[1].name).toBe('')
    expect(initialItems[2].name).toBe('Valid Item 3')
    expect(initialItems[3].name).toBe('')
    expect(initialItems[4].name).toBe('Valid Item 5')

    // Move second item (index 1, invalid empty string) to last position (index 4)
    await formController.arrayMove('orderItems', 1, 4)

    // Verify data after move (moved item from index 1 to index 4)
    const movedItems = formController.getValue('orderItems') as any[]
    expect(movedItems).toHaveLength(5)
    expect(movedItems[0].name).toBe('Valid Item 1') // Unchanged
    expect(movedItems[1].name).toBe('Valid Item 3') // Item 3 shifted left from index 2
    expect(movedItems[2].name).toBe('') // Empty item shifted left from index 3
    expect(movedItems[3].name).toBe('Valid Item 5') // Item 5 shifted left from index 4
    expect(movedItems[4].name).toBe('') // Empty item moved from index 1

    // Verify validation errors after move:
    // - Index 0: no error (unchanged position, valid item)
    // - Index 1: no error (Valid Item 3 shifted from index 2, valid)
    // - Index 2: error (empty item shifted from index 3, invalid)
    // - Index 3: no error (Valid Item 5 shifted from index 4, valid)
    // - Index 4: error (empty item moved from index 1, invalid)
    expect(formController.field('orderItems.0.name').errors()).toEqual([])
    expect(formController.field('orderItems.1.name').errors()).toEqual([])
    expect(formController.field('orderItems.2.name').errors()).toEqual([
      'Name is required',
    ])
    expect(formController.field('orderItems.3.name').errors()).toEqual([])
    expect(formController.field('orderItems.4.name').errors()).toEqual([
      'Name is required',
    ])

    // Form should still be invalid since there are still empty names
    expect(formController.isValid()).toBe(false)
  })
})
