import { describe, it, expect } from 'vitest'
import { getByPath, setByPath, hasPath, removeByPath, createPath } from '../../src/utils/pathUtils'

describe('pathUtils', () => {
  const testObject = {
    name: 'John',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'LA',
      coordinates: {
        lat: 34.0522,
        lng: -118.2437
      }
    },
    items: [
      { id: 1, price: 100 },
      { id: 2, price: 200 },
      { id: 3, price: 300 }
    ],
    tags: ['developer', 'vue', 'javascript'],
    settings: {
      notifications: {
        email: true,
        sms: false
      }
    }
  }

  describe('getByPath', () => {
    it('should get primitive values by path', () => {
      expect(getByPath(testObject, 'name')).toBe('John')
      expect(getByPath(testObject, 'age')).toBe(30)
    })

    it('should get nested object properties', () => {
      expect(getByPath(testObject, 'address.street')).toBe('123 Main St')
      expect(getByPath(testObject, 'address.city')).toBe('LA')
    })

    it('should get deeply nested properties', () => {
      expect(getByPath(testObject, 'address.coordinates.lat')).toBe(34.0522)
      expect(getByPath(testObject, 'settings.notifications.email')).toBe(true)
    })

    it('should get array items by index', () => {
      expect(getByPath(testObject, 'items.0.id')).toBe(1)
      expect(getByPath(testObject, 'items.1.price')).toBe(200)
      expect(getByPath(testObject, 'tags.0')).toBe('developer')
    })

    it('should return undefined for non-existent paths', () => {
      expect(getByPath(testObject, 'nonExistent')).toBeUndefined()
      expect(getByPath(testObject, 'address.zipCode')).toBeUndefined()
      expect(getByPath(testObject, 'items.10.price')).toBeUndefined()
      expect(getByPath(testObject, 'name.invalid')).toBeUndefined()
    })

    it('should handle empty path', () => {
      expect(getByPath(testObject, '')).toBe(testObject)
    })

    it('should handle null/undefined objects', () => {
      expect(getByPath(null, 'path')).toBeUndefined()
      expect(getByPath(undefined, 'path')).toBeUndefined()
    })

    it('should handle array-like string indices', () => {
      expect(getByPath(testObject, 'tags[0]')).toBeUndefined() // Should only work with dot notation
      expect(getByPath(testObject, 'tags.0')).toBe('developer')
    })
  })

  describe('setByPath', () => {
    it('should set primitive values', () => {
      const obj = { ...testObject }
      setByPath(obj, 'name', 'Jane')
      expect(obj.name).toBe('Jane')
    })

    it('should set nested object properties', () => {
      const obj = { ...testObject, address: { ...testObject.address } }
      setByPath(obj, 'address.zipCode', '90210')
      expect(obj.address.zipCode).toBe('90210')
    })

    it('should create missing nested objects', () => {
      const obj = { ...testObject }
      setByPath(obj, 'profile.bio', 'Software Engineer')
      expect(obj.profile?.bio).toBe('Software Engineer')
    })

    it('should set array item values', () => {
      const obj = { ...testObject, items: [...testObject.items] }
      setByPath(obj, 'items.0.price', 150)
      expect(obj.items[0].price).toBe(150)
    })

    it('should extend arrays when setting beyond current length', () => {
      const obj = { ...testObject, items: [...testObject.items] }
      setByPath(obj, 'items.5.price', 500)
      expect(obj.items[5]?.price).toBe(500)
      expect(obj.items.length).toBe(6)
    })

    it('should handle deep path creation', () => {
      const obj = {}
      setByPath(obj, 'deeply.nested.path.value', 'test')
      expect(getByPath(obj, 'deeply.nested.path.value')).toBe('test')
    })

    it('should overwrite existing values', () => {
      const obj = { ...testObject }
      setByPath(obj, 'address', { country: 'USA' })
      expect(obj.address).toEqual({ country: 'USA' })
    })

    it('should handle null/undefined objects gracefully', () => {
      expect(() => setByPath(null, 'path', 'value')).not.toThrow()
      expect(() => setByPath(undefined, 'path', 'value')).not.toThrow()
    })

    it('should handle empty path', () => {
      const obj = { test: 'value' }
      setByPath(obj, '', { newValue: 'test' })
      // Setting empty path should not modify the object in a destructive way
      expect(obj.test).toBe('value')
    })
  })

  describe('hasPath', () => {
    it('should return true for existing paths', () => {
      expect(hasPath(testObject, 'name')).toBe(true)
      expect(hasPath(testObject, 'address.street')).toBe(true)
      expect(hasPath(testObject, 'items.0.id')).toBe(true)
      expect(hasPath(testObject, 'settings.notifications.email')).toBe(true)
    })

    it('should return false for non-existent paths', () => {
      expect(hasPath(testObject, 'nonExistent')).toBe(false)
      expect(hasPath(testObject, 'address.zipCode')).toBe(false)
      expect(hasPath(testObject, 'items.10.price')).toBe(false)
      expect(hasPath(testObject, 'name.invalid')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(hasPath(testObject, '')).toBe(true)
      expect(hasPath(null, 'path')).toBe(false)
      expect(hasPath(undefined, 'path')).toBe(false)
    })

    it('should distinguish between undefined values and non-existent paths', () => {
      const objWithUndefined = { value: undefined, nested: { value: undefined } }
      expect(hasPath(objWithUndefined, 'value')).toBe(true)
      expect(hasPath(objWithUndefined, 'nested.value')).toBe(true)
      expect(hasPath(objWithUndefined, 'nonExistent')).toBe(false)
    })
  })

  describe('removeByPath', () => {
    it('should remove primitive properties', () => {
      const obj = { ...testObject }
      removeByPath(obj, 'name')
      expect(obj.name).toBeUndefined()
      expect('name' in obj).toBe(false)
    })

    it('should remove nested properties', () => {
      const obj = { ...testObject, address: { ...testObject.address } }
      removeByPath(obj, 'address.street')
      expect(obj.address.street).toBeUndefined()
      expect('street' in obj.address).toBe(false)
      expect(obj.address.city).toBe('LA') // Other properties should remain
    })

    it('should remove array items', () => {
      const obj = { ...testObject, items: [...testObject.items] }
      removeByPath(obj, 'items.0')
      expect(obj.items[0]).toBeUndefined()
      expect(obj.items.length).toBe(3) // Array length unchanged, but slot is empty
    })

    it('should handle non-existent paths gracefully', () => {
      const obj = { ...testObject }
      expect(() => removeByPath(obj, 'nonExistent')).not.toThrow()
      expect(() => removeByPath(obj, 'address.nonExistent')).not.toThrow()
    })

    it('should handle null/undefined objects gracefully', () => {
      expect(() => removeByPath(null, 'path')).not.toThrow()
      expect(() => removeByPath(undefined, 'path')).not.toThrow()
    })
  })

  describe('createPath', () => {
    it('should create nested object structure from path', () => {
      const obj = {}
      createPath(obj, 'deeply.nested.path')
      expect(obj.deeply?.nested?.path).toBeDefined()
      expect(typeof obj.deeply?.nested?.path).toBe('object')
    })

    it('should create array structures for numeric segments', () => {
      const obj = {}
      createPath(obj, 'items.0.value')
      expect(Array.isArray(obj.items)).toBe(true)
      expect(obj.items[0]).toBeDefined()
      expect(typeof obj.items[0]).toBe('object')
    })

    it('should not overwrite existing structures', () => {
      const obj = { existing: { value: 'keep' } }
      createPath(obj, 'existing.nested.path')
      expect(obj.existing.value).toBe('keep')
      expect(obj.existing.nested?.path).toBeDefined()
    })

    it('should handle mixed object/array paths', () => {
      const obj = {}
      createPath(obj, 'data.items.0.properties.1.value')
      expect(obj.data).toBeDefined()
      expect(Array.isArray(obj.data.items)).toBe(true)
      expect(obj.data.items[0]).toBeDefined()
      expect(obj.data.items[0].properties).toBeDefined()
      expect(Array.isArray(obj.data.items[0].properties)).toBe(true)
    })

    it('should handle empty path', () => {
      const obj = { test: 'value' }
      createPath(obj, '')
      expect(obj.test).toBe('value') // Should not modify existing object
    })

    it('should handle null/undefined objects gracefully', () => {
      expect(() => createPath(null, 'path')).not.toThrow()
      expect(() => createPath(undefined, 'path')).not.toThrow()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'circular' }
      circular.self = circular

      expect(() => getByPath(circular, 'self.name')).not.toThrow()
      expect(getByPath(circular, 'self.name')).toBe('circular')
    })

    it('should handle special characters in property names', () => {
      const obj = {
        'field-name': 'value1',
        'field_name': 'value2',
        'field name': 'value3',
        'field.name': 'value4'
      }

      expect(getByPath(obj, 'field-name')).toBe('value1')
      expect(getByPath(obj, 'field_name')).toBe('value2')
      // Note: 'field name' and 'field.name' cannot be accessed with dot notation
    })

    it('should handle numeric string keys', () => {
      const obj = { '123': 'numeric key', '0': 'zero' }
      expect(getByPath(obj, '123')).toBe('numeric key')
      expect(getByPath(obj, '0')).toBe('zero')
    })

    it('should preserve data types', () => {
      const obj = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: true },
        nullValue: null,
        undefinedValue: undefined
      }

      expect(typeof getByPath(obj, 'string')).toBe('string')
      expect(typeof getByPath(obj, 'number')).toBe('number')
      expect(typeof getByPath(obj, 'boolean')).toBe('boolean')
      expect(Array.isArray(getByPath(obj, 'array'))).toBe(true)
      expect(typeof getByPath(obj, 'object')).toBe('object')
      expect(getByPath(obj, 'nullValue')).toBeNull()
      expect(getByPath(obj, 'undefinedValue')).toBeUndefined()
    })

    it('should handle very deep nesting', () => {
      const deepPath = 'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z'
      const obj = {}

      setByPath(obj, deepPath, 'deep value')
      expect(getByPath(obj, deepPath)).toBe('deep value')
      expect(hasPath(obj, deepPath)).toBe(true)
    })

    it('should handle array operations on non-arrays', () => {
      const obj = { notArray: 'string value' }

      expect(() => setByPath(obj, 'notArray.0', 'test')).not.toThrow()
      // This should either fail gracefully or convert to array-like structure
    })
  })
})