import { describe, it, expect, beforeEach } from 'vitest'
import { PlainObjectDataSource } from '../../src/data-sources/PlainObjectDataSource'

describe('PlainObjectDataSource', () => {
  let dataSource: PlainObjectDataSource

  const createInitialData = () => ({
    name: 'John',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'LA'
    },
    items: [
      { price: 100, quantity: 1 },
      { price: 200, quantity: 2 }
    ]
  })

  beforeEach(() => {
    dataSource = new PlainObjectDataSource(createInitialData())
  })

  describe('initialization', () => {
    it('should initialize with data', () => {
      expect(dataSource.all()).toEqual(createInitialData())
    })

    it('should initialize with empty object when no data provided', () => {
      const emptyDataSource = new PlainObjectDataSource()
      expect(emptyDataSource.all()).toEqual({})
    })

    it('should work with original data object to preserve reactivity', () => {
      const original = { nested: { value: 1 } }
      const source = new PlainObjectDataSource(original)

      source.set('nested.value', 2)
      expect(original.nested.value).toBe(2) // Original should be changed (preserves reactivity)
      expect(source.get('nested.value')).toBe(2)
    })
  })

  describe('get operations', () => {
    it('should get primitive values by path', () => {
      expect(dataSource.get('name')).toBe('John')
      expect(dataSource.get('age')).toBe(30)
    })

    it('should get nested object properties', () => {
      expect(dataSource.get('address.street')).toBe('123 Main St')
      expect(dataSource.get('address.city')).toBe('LA')
    })

    it('should get array items by index', () => {
      expect(dataSource.get('items.0.price')).toBe(100)
      expect(dataSource.get('items.1.quantity')).toBe(2)
    })

    it('should return undefined for non-existent paths', () => {
      expect(dataSource.get('nonExistent')).toBeUndefined()
      expect(dataSource.get('address.zipCode')).toBeUndefined()
      expect(dataSource.get('items.5.price')).toBeUndefined()
    })

    it('should handle empty path', () => {
      expect(dataSource.get('')).toEqual(dataSource.all())
    })

    it('should return undefined for invalid paths', () => {
      expect(dataSource.get('name.invalid')).toBeUndefined()
      expect(dataSource.get('age.invalid')).toBeUndefined()
    })
  })

  describe('set operations', () => {
    it('should set primitive values', () => {
      dataSource.set('name', 'Jane')
      expect(dataSource.get('name')).toBe('Jane')
    })

    it('should set nested object properties', () => {
      dataSource.set('address.zipCode', '12345')
      expect(dataSource.get('address.zipCode')).toBe('12345')
    })

    it('should create missing nested objects', () => {
      dataSource.set('profile.bio', 'Software Engineer')
      expect(dataSource.get('profile.bio')).toBe('Software Engineer')
      expect(dataSource.get('profile')).toEqual({ bio: 'Software Engineer' })
    })

    it('should set array item values', () => {
      dataSource.set('items.0.price', 150)
      expect(dataSource.get('items.0.price')).toBe(150)
    })

    it('should extend arrays when setting beyond current length', () => {
      dataSource.set('items.5.price', 300)
      expect(dataSource.get('items').length).toBe(6)
      expect(dataSource.get('items.5.price')).toBe(300)
    })

    it('should handle deep nested path creation', () => {
      dataSource.set('deeply.nested.path.value', 'test')
      expect(dataSource.get('deeply.nested.path.value')).toBe('test')
    })

    it('should overwrite existing values', () => {
      dataSource.set('address', { country: 'USA' })
      expect(dataSource.get('address')).toEqual({ country: 'USA' })
      expect(dataSource.get('address.street')).toBeUndefined()
    })
  })

  describe('has operations', () => {
    it('should return true for existing paths', () => {
      expect(dataSource.has('name')).toBe(true)
      expect(dataSource.has('address.street')).toBe(true)
      expect(dataSource.has('items.0.price')).toBe(true)
    })

    it('should return false for non-existent paths', () => {
      expect(dataSource.has('nonExistent')).toBe(false)
      expect(dataSource.has('address.zipCode')).toBe(false)
      expect(dataSource.has('items.5.price')).toBe(false)
    })

    it('should handle empty path', () => {
      expect(dataSource.has('')).toBe(true)
    })
  })

  describe('remove operations', () => {
    it('should remove primitive properties', () => {
      dataSource.remove('name')
      expect(dataSource.has('name')).toBe(false)
      expect(dataSource.get('name')).toBeUndefined()
    })

    it('should remove nested properties', () => {
      dataSource.remove('address.street')
      expect(dataSource.has('address.street')).toBe(false)
      expect(dataSource.get('address.city')).toBe('LA') // Other properties should remain
    })

    it('should remove array items', () => {
      dataSource.remove('items.0')
      expect(dataSource.get('items').length).toBe(2) // Array length unchanged (sparse array)
      expect(dataSource.get('items.0')).toBeUndefined() // First item removed
      expect(dataSource.get('items.1.price')).toBe(200) // Second item still at index 1
    })

    it('should handle removing non-existent paths gracefully', () => {
      expect(() => dataSource.remove('nonExistent')).not.toThrow()
      expect(() => dataSource.remove('address.nonExistent')).not.toThrow()
    })
  })

  describe('array operations', () => {
    describe('arrayPush', () => {
      it('should add items to existing arrays', () => {
        dataSource.arrayPush('items', { price: 300, quantity: 3 })
        expect(dataSource.get('items').length).toBe(3)
        expect(dataSource.get('items.2.price')).toBe(300)
      })

      it('should create new array if path does not exist', () => {
        dataSource.arrayPush('tags', 'javascript')
        expect(dataSource.get('tags')).toEqual(['javascript'])
      })

      it('should handle deeply nested array paths', () => {
        dataSource.arrayPush('address.tags', 'residential')
        expect(dataSource.get('address.tags')).toEqual(['residential'])
      })
    })

    describe('arrayInsert', () => {
      it('should insert items at specific index', () => {
        dataSource.arrayInsert('items', 1, { price: 150, quantity: 1.5 })
        expect(dataSource.get('items').length).toBe(3)
        expect(dataSource.get('items.1.price')).toBe(150)
        expect(dataSource.get('items.2.price')).toBe(200) // Original item shifted
      })

      it('should insert at beginning when index is 0', () => {
        dataSource.arrayInsert('items', 0, { price: 50, quantity: 0.5 })
        expect(dataSource.get('items.0.price')).toBe(50)
        expect(dataSource.get('items.1.price')).toBe(100) // Original first item shifted
      })

      it('should append when index is greater than array length', () => {
        dataSource.arrayInsert('items', 10, { price: 400, quantity: 4 })
        expect(dataSource.get('items').length).toBe(3)
        expect(dataSource.get('items.2.price')).toBe(400)
      })

      it('should handle negative index by treating as 0', () => {
        dataSource.arrayInsert('items', -1, { price: 25, quantity: 0.25 })
        expect(dataSource.get('items.0.price')).toBe(25)
      })

      it('should create new array if path does not exist', () => {
        dataSource.arrayInsert('newArray', 0, 'first')
        expect(dataSource.get('newArray')).toEqual(['first'])
      })
    })

    describe('arrayRemove', () => {
      it('should remove items at specific index', () => {
        dataSource.arrayRemove('items', 0)
        expect(dataSource.get('items').length).toBe(1)
        expect(dataSource.get('items.0.price')).toBe(200) // Second item becomes first
      })

      it('should handle index out of bounds gracefully', () => {
        expect(() => dataSource.arrayRemove('items', 10)).not.toThrow()
        expect(dataSource.get('items').length).toBe(2) // Array unchanged
      })

      it('should handle negative index gracefully', () => {
        expect(() => dataSource.arrayRemove('items', -1)).not.toThrow()
        expect(dataSource.get('items').length).toBe(2) // Array unchanged
      })

      it('should handle non-existent array path gracefully', () => {
        expect(() => dataSource.arrayRemove('nonExistent', 0)).not.toThrow()
      })
    })

    describe('arrayMove', () => {
      it('should move items within array', () => {
        dataSource.arrayMove('items', 0, 1)
        expect(dataSource.get('items.0.price')).toBe(200) // Second item moved to first
        expect(dataSource.get('items.1.price')).toBe(100) // First item moved to second
      })

      it('should handle same index gracefully', () => {
        const originalItems = dataSource.get('items')
        dataSource.arrayMove('items', 0, 0)
        expect(dataSource.get('items')).toEqual(originalItems) // Array unchanged
      })

      it('should handle out of bounds indices gracefully', () => {
        const originalItems = dataSource.get('items')
        dataSource.arrayMove('items', 0, 10)
        dataSource.arrayMove('items', 10, 0)
        dataSource.arrayMove('items', -1, 1)
        expect(dataSource.get('items')).toEqual(originalItems) // Array unchanged
      })

      it('should handle non-existent array path gracefully', () => {
        expect(() => dataSource.arrayMove('nonExistent', 0, 1)).not.toThrow()
      })
    })
  })

  describe('clone operations', () => {
    it('should create a deep clone of the data source', () => {
      // Modify original data source
      dataSource.set('name', 'Jane')
      dataSource.set('newField', 'test')

      // Create clone
      const clonedDataSource = dataSource.clone()

      expect(clonedDataSource.get('name')).toBe('Jane')
      expect(clonedDataSource.get('newField')).toBe('test')
      expect(clonedDataSource.all()).toEqual(dataSource.all())
    })

    it('should create independent copies', () => {
      const clonedDataSource = dataSource.clone()

      // Modify original
      dataSource.set('name', 'Jane')

      // Clone should be unchanged
      expect(clonedDataSource.get('name')).toBe('John')
      expect(dataSource.get('name')).toBe('Jane')
    })

    it('should clone nested objects independently', () => {
      const clonedDataSource = dataSource.clone()

      // Modify nested property in original
      dataSource.set('address.zipCode', '12345')

      // Clone should not have the new property
      expect(clonedDataSource.has('address.zipCode')).toBe(false)
      expect(clonedDataSource.get('address.street')).toBe('123 Main St')
    })

    it('should clone arrays independently', () => {
      const clonedDataSource = dataSource.clone()

      // Modify array in original
      dataSource.arrayPush('items', { price: 300, quantity: 3 })

      // Clone should have original array
      expect(clonedDataSource.get('items')).toHaveLength(2)
      expect(dataSource.get('items')).toHaveLength(3)
    })

    it('should handle cloning with complex nested structures', () => {
      // Add complex nested structure
      dataSource.set('complex.nested.array', [{ id: 1, data: { value: 'test' } }])

      const clonedDataSource = dataSource.clone()

      // Modify original complex structure
      dataSource.set('complex.nested.array.0.data.value', 'modified')

      // Clone should be unchanged
      expect(clonedDataSource.get('complex.nested.array.0.data.value')).toBe('test')
      expect(dataSource.get('complex.nested.array.0.data.value')).toBe('modified')
    })
  })

  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      dataSource.set('nullValue', null)
      dataSource.set('undefinedValue', undefined)

      expect(dataSource.get('nullValue')).toBeNull()
      expect(dataSource.get('undefinedValue')).toBeUndefined()
    })

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'circular' }
      circular.self = circular

      expect(() => {
        const source = new PlainObjectDataSource(circular)
        source.set('test', 'value')
      }).not.toThrow()
    })

    it('should handle special characters in paths', () => {
      dataSource.set('field-name', 'value1')
      dataSource.set('field_name', 'value2')
      dataSource.set('field name', 'value3') // This might not work with dot notation

      expect(dataSource.get('field-name')).toBe('value1')
      expect(dataSource.get('field_name')).toBe('value2')
    })

    it('should handle numeric string keys', () => {
      dataSource.set('123', 'numeric key')
      expect(dataSource.get('123')).toBe('numeric key')
    })

    it('should preserve data types', () => {
      const testData = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: true },
        nullValue: null,
        undefinedValue: undefined,
        date: new Date('2023-01-01')
      }

      const source = new PlainObjectDataSource(testData)

      expect(typeof source.get('string')).toBe('string')
      expect(typeof source.get('number')).toBe('number')
      expect(typeof source.get('boolean')).toBe('boolean')
      expect(Array.isArray(source.get('array'))).toBe(true)
      expect(typeof source.get('object')).toBe('object')
      expect(source.get('nullValue')).toBeNull()
      expect(source.get('undefinedValue')).toBeUndefined()
      expect(source.get('date')).toBeInstanceOf(Date)
    })
  })
})