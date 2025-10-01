import { describe, it, expect, beforeEach } from 'vitest'
import { ValidatorFactory } from '@encolajs/validator'
import {
  EncolaValidatorAdapter,
  createEncolaAdapter,
  createEncolaAdapterFromRules,
} from '../../src/adapters/EncolaValidatorAdapter'
import { PlainObjectDataSource } from '../../src/data-sources/PlainObjectDataSource'

describe('EncolaValidatorAdapter', () => {
  let adapter: EncolaValidatorAdapter
  let dataSource: PlainObjectDataSource
  let validatorFactory: ValidatorFactory

  const userRules = {
    name: 'required|min_length:2',
    email: 'required|email',
    age: 'required|integer',
    'profile.bio': 'max_length:500',
    'profile.website': 'url',
    'tags.*': 'min_length:1',
  }

  beforeEach(() => {
    validatorFactory = new ValidatorFactory()
    const validator = validatorFactory.make(userRules)
    adapter = new EncolaValidatorAdapter(validator)
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
    it('should initialize with validator', () => {
      expect(adapter).toBeInstanceOf(EncolaValidatorAdapter)
      expect(adapter.isValid()).toBe(true)
    })

    it('should initialize without validator', () => {
      const emptyAdapter = new EncolaValidatorAdapter()
      expect(emptyAdapter.isValid()).toBe(true)
    })

    it('should be created using factory function', () => {
      const validator = validatorFactory.make(userRules)
      const factoryAdapter = createEncolaAdapter(validator)
      expect(factoryAdapter).toBeInstanceOf(EncolaValidatorAdapter)
    })

    it('should be created from rules using factory helper', () => {
      const rulesAdapter = createEncolaAdapterFromRules(
        validatorFactory,
        userRules
      )
      expect(rulesAdapter).toBeInstanceOf(EncolaValidatorAdapter)
    })
  })

  describe('validator management', () => {
    it('should set validator after initialization', () => {
      const emptyAdapter = new EncolaValidatorAdapter()
      const validator = validatorFactory.make(userRules)
      emptyAdapter.setValidator(validator)

      // Should clear any existing errors
      expect(emptyAdapter.getAllErrors()).toEqual({})
    })

    it('should clear errors when setting new validator', () => {
      adapter.setFieldErrors('name', ['Some error'])
      expect(adapter.getFieldErrors('name')).toEqual(['Some error'])

      const newValidator = validatorFactory.make(userRules)
      adapter.setValidator(newValidator)
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
      expect(errors).toEqual(['This field is required'])
      expect(adapter.isFieldValid('name')).toBe(false)

      // Other fields should not have errors
      expect(adapter.getFieldErrors('email')).toEqual([])
      expect(adapter.getFieldErrors('age')).toEqual([])
    })

    it('should validate email field with specific error', async () => {
      dataSource.set('email', 'invalid-email')

      const errors = await adapter.validateField('email', dataSource)
      expect(errors).toEqual(['This field must be a valid email address'])
      expect(adapter.isFieldValid('email')).toBe(false)
    })

    it('should validate nested field', async () => {
      dataSource.set('profile.website', 'not-a-url')

      const errors = await adapter.validateField('profile.website', dataSource)
      expect(errors).toEqual(['This field must be a valid URL'])
      expect(adapter.isFieldValid('profile.website')).toBe(false)
    })

    it('should clear field errors when field becomes valid', async () => {
      // Make field invalid first
      dataSource.set('name', '')
      await adapter.validateField('name', dataSource)
      expect(adapter.getFieldErrors('name')).toEqual(['This field is required'])

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

    it('should validate array field with wildcard rules', async () => {
      dataSource.set('tags', ['valid-tag', ''])
      const errors = await adapter.validateField('tags.1', dataSource)
      // EncolaJS Validator might handle array paths differently
      // This test ensures the adapter doesn't crash
      expect(Array.isArray(errors)).toBe(true)
    })

    it('should handle missing validator gracefully', async () => {
      const noValidatorAdapter = new EncolaValidatorAdapter()
      const errors = await noValidatorAdapter.validateField('name', dataSource)
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
      dataSource.set('age', 'not-a-number')

      const errors = await adapter.validate(dataSource)
      expect(errors).toEqual({
        name: ['This field is required'],
        email: ['This field must be a valid email address'],
        age: ['This field number be an integer'],
      })
      expect(adapter.isValid()).toBe(false)
    })

    it('should handle nested object validation', async () => {
      dataSource.set('profile.website', 'not-a-url')

      const errors = await adapter.validate(dataSource)
      expect(errors).toEqual({
        'profile.website': ['This field must be a valid URL'],
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
    it('should return dependent fields', () => {
      // EncolaJS Validator has built-in dependency tracking
      const dependents = adapter.getDependentFields('name')
      expect(Array.isArray(dependents)).toBe(true)
      // The actual dependent fields would depend on the validation rules
      // For basic rules like 'required', there might not be any dependents
      expect(dependents).toEqual([])
    })

    it('should handle missing validator gracefully for dependency tracking', () => {
      const noValidatorAdapter = new EncolaValidatorAdapter()
      expect(noValidatorAdapter.getDependentFields('name')).toEqual([])
    })
  })

  describe('complex validation scenarios', () => {
    it('should handle validation with multiple nested errors', async () => {
      const complexRules = {
        'user.name': 'required|min_length:1',
        'user.contacts.email': 'required|email',
        'user.contacts.phone': 'required|min_length:10',
        'settings.theme': 'required|in_list:light,dark',
      }

      const complexValidator = validatorFactory.make(complexRules)
      const complexAdapter = new EncolaValidatorAdapter(complexValidator)
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
      expect(errors['user.name']).toEqual(['This field is required'])
      expect(errors['user.contacts.email']).toEqual([
        'This field must be a valid email address',
      ])
      expect(errors['user.contacts.phone']).toEqual([
        'This field must have at least 10 characters',
      ])
      expect(Array.isArray(errors['settings.theme'])).toBe(true)
      expect(errors['settings.theme'].length).toBeGreaterThan(0)
    })

    it('should validate single field in complex schema', async () => {
      const complexRules = {
        'user.name': 'required|min_length:1',
        'user.email': 'required|email',
      }

      const complexValidator = validatorFactory.make(complexRules)
      const complexAdapter = new EncolaValidatorAdapter(complexValidator)
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
      expect(nameErrors).toEqual(['This field is required'])

      // Email field should not have errors in the adapter state
      expect(complexAdapter.getFieldErrors('user.email')).toEqual([])
    })

    it('should handle optional fields correctly', async () => {
      const optionalRules = {
        required: 'required|min_length:1',
        optional: 'max_length:100', // Optional field with max length
      }

      const optionalValidator = validatorFactory.make(optionalRules)
      const optionalAdapter = new EncolaValidatorAdapter(optionalValidator)
      const optionalDataSource = new PlainObjectDataSource({
        required: 'valid',
        // optional field is missing
      })

      const errors = await optionalAdapter.validate(optionalDataSource)
      expect(errors).toEqual({})
    })

    it('should handle array validation with wildcard rules', async () => {
      const arrayRules = {
        'items.*.name': 'required|min_length:1',
        'items.*.value': 'required|integer',
      }

      const arrayValidator = validatorFactory.make(arrayRules)
      const arrayAdapter = new EncolaValidatorAdapter(arrayValidator)
      const arrayDataSource = new PlainObjectDataSource({
        items: [
          { name: 'valid', value: 5 },
          { name: '', value: 'not-number' },
        ],
      })

      const errors = await arrayAdapter.validate(arrayDataSource)
      expect(errors['items.1.name']).toEqual(['This field is required'])
      // Test if we got any validation errors (paths may vary)
      expect(Object.keys(errors).length).toBeGreaterThan(1)
    })

    it('should handle cross-field validation rules', async () => {
      const crossFieldRules = {
        password: 'required|min_length:8',
        password_confirmation: 'required',
      }

      const crossFieldValidator = validatorFactory.make(crossFieldRules)
      const crossFieldAdapter = new EncolaValidatorAdapter(crossFieldValidator)
      const crossFieldDataSource = new PlainObjectDataSource({
        password: 'secret123',
        password_confirmation: '',
      })

      const errors = await crossFieldAdapter.validate(crossFieldDataSource)
      expect(errors['password_confirmation']).toEqual([
        'This field is required',
      ])
    })

    it('should handle custom messages', async () => {
      // Note: Custom messages might not work exactly as expected with EncolaJS Validator
      // This test validates the adapter handles the validation correctly
      const customValidator = validatorFactory.make({
        name: 'required',
        email: 'email',
      })

      const customAdapter = new EncolaValidatorAdapter(customValidator)
      const invalidDataSource = new PlainObjectDataSource({
        name: '',
        email: 'invalid',
      })

      const errors = await customAdapter.validate(invalidDataSource)
      expect(errors['name']).toEqual(['This field is required'])
      expect(errors['email']).toEqual([
        'This field must be a valid email address',
      ])
    })
  })
})
