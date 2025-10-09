import { describe, it, expect, beforeEach } from 'vitest'
import * as v from 'valibot'
import {
  ValibotValidatorAdapter,
  useValibotValidator,
} from '../../src/adapters/ValibotValidatorAdapter'
import { PlainObjectDataSource } from '../../src/data-sources/PlainObjectDataSource'

// Set up global valibot for the adapter to use
;(globalThis as any).valibot = v

describe('ValibotValidatorAdapter', () => {
  let adapter: ValibotValidatorAdapter
  let dataSource: PlainObjectDataSource

  const userSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
    email: v.pipe(v.string(), v.email('Invalid email format')),
    age: v.pipe(v.number(), v.minValue(18, 'Must be at least 18')),
    profile: v.optional(
      v.object({
        bio: v.optional(v.string()),
        website: v.optional(v.pipe(v.string(), v.url('Invalid URL'))),
      })
    ),
    tags: v.optional(v.array(v.string())),
  })

  beforeEach(() => {
    adapter = new ValibotValidatorAdapter(userSchema)
    dataSource = new PlainObjectDataSource({
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      profile: {
        bio: 'Software developer',
        website: 'https://johndoe.com',
      },
      tags: ['javascript', 'typescript'],
    })
  })

  describe('initialization', () => {
    it('should initialize with schema', () => {
      expect(adapter).toBeInstanceOf(ValibotValidatorAdapter)
      expect(adapter.isValid()).toBe(true)
    })

    it('should initialize without schema', () => {
      const emptyAdapter = new ValibotValidatorAdapter()
      expect(emptyAdapter.isValid()).toBe(true)
    })

    it('should be created using factory function', () => {
      const factoryAdapter = useValibotValidator(userSchema)
      expect(factoryAdapter).toBeInstanceOf(ValibotValidatorAdapter)
    })
  })

  describe('schema management', () => {
    it('should set schema after initialization', () => {
      const emptyAdapter = new ValibotValidatorAdapter()
      emptyAdapter.setSchema(userSchema)

      // Should clear any existing errors
      expect(emptyAdapter.getAllErrors()).toEqual({})
    })

    it('should clear errors when setting new schema', () => {
      adapter.setFieldErrors('name', ['Some error'])
      expect(adapter.getFieldErrors('name')).toEqual(['Some error'])

      adapter.setSchema(userSchema)
      expect(adapter.getFieldErrors('name')).toEqual([])
    })
  })

  describe('validateField - single field validation', () => {
    it('should validate valid field and return no errors', async () => {
      const errors = await adapter.validateField('name', dataSource)
      expect(errors).toEqual([])
      expect(adapter.isFieldValid('name')).toBe(true)
    })

    it('should validate invalid field and return errors for that field only', async () => {
      dataSource.set('name', '')

      const errors = await adapter.validateField('name', dataSource)
      expect(errors).toEqual(['Name is required'])
      expect(adapter.isFieldValid('name')).toBe(false)

      // Other fields should not have errors
      expect(adapter.getFieldErrors('email')).toEqual([])
      expect(adapter.getFieldErrors('age')).toEqual([])
    })

    it('should validate email field with specific error', async () => {
      dataSource.set('email', 'invalid-email')

      const errors = await adapter.validateField('email', dataSource)
      expect(errors).toEqual(['Invalid email format'])
      expect(adapter.isFieldValid('email')).toBe(false)
    })

    it('should validate nested field', async () => {
      dataSource.set('profile.website', 'not-a-url')

      const errors = await adapter.validateField('profile.website', dataSource)
      expect(errors).toEqual(['Invalid URL'])
      expect(adapter.isFieldValid('profile.website')).toBe(false)
    })

    it('should clear field errors when field becomes valid', async () => {
      // Make field invalid first
      dataSource.set('name', '')
      await adapter.validateField('name', dataSource)
      expect(adapter.getFieldErrors('name')).toEqual(['Name is required'])

      // Make field valid
      dataSource.set('name', 'Valid Name')
      const errors = await adapter.validateField('name', dataSource)
      expect(errors).toEqual([])
      expect(adapter.getFieldErrors('name')).toEqual([])
    })

    it('should handle validation of non-existent field paths', async () => {
      const errors = await adapter.validateField('nonExistent', dataSource)
      expect(errors).toEqual([])
    })

    it('should validate array field', async () => {
      dataSource.set('tags', ['valid-tag'])
      const errors = await adapter.validateField('tags', dataSource)
      expect(errors).toEqual([])
    })

    it('should handle missing schema gracefully', async () => {
      const noSchemaAdapter = new ValibotValidatorAdapter()
      const errors = await noSchemaAdapter.validateField('name', dataSource)
      expect(errors).toEqual([])
    })
  })

  describe('validate - full form validation', () => {
    it('should validate entire form successfully', async () => {
      const errors = await adapter.validate(dataSource)
      expect(errors).toEqual({})
      expect(adapter.isValid()).toBe(true)
    })

    it('should return errors for all invalid fields', async () => {
      dataSource.set('name', '')
      dataSource.set('email', 'invalid')
      dataSource.set('age', 16)

      const errors = await adapter.validate(dataSource)
      expect(errors).toEqual({
        name: ['Name is required'],
        email: ['Invalid email format'],
        age: ['Must be at least 18'],
      })
      expect(adapter.isValid()).toBe(false)
    })

    it('should handle nested object validation', async () => {
      dataSource.set('profile.website', 'not-a-url')

      const errors = await adapter.validate(dataSource)
      expect(errors).toEqual({
        'profile.website': ['Invalid URL'],
      })
    })

    it('should clear all errors when form becomes valid', async () => {
      // Make form invalid first
      dataSource.set('name', '')
      await adapter.validate(dataSource)
      expect(adapter.getAllErrors()).not.toEqual({})

      // Make form valid
      dataSource.set('name', 'Valid Name')
      const errors = await adapter.validate(dataSource)
      expect(errors).toEqual({})
      expect(adapter.getAllErrors()).toEqual({})
    })
  })

  describe('error management', () => {
    it('should get field errors', () => {
      adapter.setFieldErrors('name', ['Error 1', 'Error 2'])
      expect(adapter.getFieldErrors('name')).toEqual(['Error 1', 'Error 2'])
      expect(adapter.getFieldErrors('nonExistent')).toEqual([])
    })

    it('should get all errors', () => {
      adapter.setFieldErrors('name', ['Name error'])
      adapter.setFieldErrors('email', ['Email error'])

      expect(adapter.getAllErrors()).toEqual({
        name: ['Name error'],
        email: ['Email error'],
      })
    })

    it('should check field validity', () => {
      expect(adapter.isFieldValid('name')).toBe(true)

      adapter.setFieldErrors('name', ['Error'])
      expect(adapter.isFieldValid('name')).toBe(false)
    })

    it('should check overall validity', () => {
      expect(adapter.isValid()).toBe(true)

      adapter.setFieldErrors('name', ['Error'])
      expect(adapter.isValid()).toBe(false)
    })

    it('should clear field errors', () => {
      adapter.setFieldErrors('name', ['Error'])
      expect(adapter.getFieldErrors('name')).toEqual(['Error'])

      adapter.clearFieldErrors('name')
      expect(adapter.getFieldErrors('name')).toEqual([])
    })

    it('should clear all errors', () => {
      adapter.setFieldErrors('name', ['Name error'])
      adapter.setFieldErrors('email', ['Email error'])
      expect(Object.keys(adapter.getAllErrors())).toHaveLength(2)

      adapter.clearAllErrors()
      expect(adapter.getAllErrors()).toEqual({})
    })

    it('should set multiple errors', () => {
      const errors = {
        name: ['Name error'],
        email: ['Email error'],
      }

      adapter.setErrors(errors)
      expect(adapter.getAllErrors()).toEqual(errors)
    })

    it('should handle empty errors when setting field errors', () => {
      adapter.setFieldErrors('name', ['Error'])
      expect(adapter.getFieldErrors('name')).toEqual(['Error'])

      adapter.setFieldErrors('name', [])
      expect(adapter.getFieldErrors('name')).toEqual([])
    })
  })

  describe('dependency tracking', () => {
    it('should return empty array for dependent fields', () => {
      // Valibot doesn't have built-in dependency tracking
      expect(adapter.getDependentFields('name')).toEqual([])
    })
  })

  describe('complex validation scenarios', () => {
    it('should handle validation with multiple nested errors', async () => {
      const complexSchema = v.object({
        user: v.object({
          name: v.pipe(v.string(), v.minLength(1, 'Name required')),
          contacts: v.object({
            email: v.pipe(v.string(), v.email('Invalid email')),
            phone: v.pipe(v.string(), v.minLength(10, 'Phone too short')),
          }),
        }),
        settings: v.object({
          theme: v.picklist(['light', 'dark'], 'Invalid theme'),
        }),
      })

      const complexAdapter = new ValibotValidatorAdapter(complexSchema)
      const complexDataSource = new PlainObjectDataSource({
        user: {
          name: '',
          contacts: {
            email: 'invalid',
            phone: '123',
          },
        },
        settings: {
          theme: 'blue',
        },
      })

      const errors = await complexAdapter.validate(complexDataSource)
      expect(errors['user.name']).toEqual(['Name required'])
      expect(errors['user.contacts.email']).toEqual(['Invalid email'])
      expect(errors['user.contacts.phone']).toEqual(['Phone too short'])
      expect(errors['settings.theme']).toContain('Invalid theme')
    })

    it('should validate single field in complex schema', async () => {
      const complexSchema = v.object({
        user: v.object({
          name: v.pipe(v.string(), v.minLength(1, 'Name required')),
          email: v.pipe(v.string(), v.email('Invalid email')),
        }),
      })

      const complexAdapter = new ValibotValidatorAdapter(complexSchema)
      const complexDataSource = new PlainObjectDataSource({
        user: {
          name: '',
          email: 'valid@example.com',
        },
      })

      // Validate only the name field - should only return name errors
      const nameErrors = await complexAdapter.validateField(
        'user.name',
        complexDataSource
      )
      expect(nameErrors).toEqual(['Name required'])

      // Email field should not have errors in the adapter state
      expect(complexAdapter.getFieldErrors('user.email')).toEqual([])
    })

    it('should handle optional fields correctly', async () => {
      const optionalSchema = v.object({
        required: v.pipe(v.string(), v.minLength(1, 'Required field')),
        optional: v.optional(v.string()),
      })

      const optionalAdapter = new ValibotValidatorAdapter(optionalSchema)
      const optionalDataSource = new PlainObjectDataSource({
        required: 'valid',
        // optional field is missing
      })

      const errors = await optionalAdapter.validate(optionalDataSource)
      expect(errors).toEqual({})
    })

    it('should handle array validation with element errors', async () => {
      const arraySchema = v.object({
        items: v.array(
          v.object({
            name: v.pipe(v.string(), v.minLength(1, 'Item name required')),
            value: v.pipe(v.number(), v.minValue(1, 'Value must be positive')),
          })
        ),
      })

      const arrayAdapter = new ValibotValidatorAdapter(arraySchema)
      const arrayDataSource = new PlainObjectDataSource({
        items: [
          { name: 'valid', value: 5 },
          { name: '', value: -1 },
        ],
      })

      const errors = await arrayAdapter.validate(arrayDataSource)
      expect(errors['items.1.name']).toEqual(['Item name required'])
      expect(errors['items.1.value']).toEqual(['Value must be positive'])
    })

    it('should handle different Valibot API patterns', async () => {
      // Test with both safeParse and regular parse patterns
      const simpleSchema = v.object({
        test: v.pipe(v.string(), v.minLength(1, 'Test required')),
      })

      const testAdapter = new ValibotValidatorAdapter(simpleSchema)
      const testDataSource = new PlainObjectDataSource({
        test: '',
      })

      const errors = await testAdapter.validateField('test', testDataSource)
      expect(errors).toEqual(['Test required'])
    })
  })
})
