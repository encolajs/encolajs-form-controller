# Yup Validation

EncolaJS Form Controller integrates seamlessly with [Yup](https://github.com/jquense/yup), a JavaScript schema validation library.

## Installation

```bash
npm install @encolajs/form-controller yup
```

## Basic Setup

```javascript
import createForm, { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { YupValidatorAdapter } from '@encolajs/form-controller/yup'
import * as yup from 'yup'

// Define your schema
const userSchema = yup.object({
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),

  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),

  age: yup.number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Please enter a valid age')
    .required('Age is required'),

  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),

  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], "Passwords don't match")
    .required('Please confirm your password'),

  profile: yup.object({
    bio: yup.string().max(500, 'Bio must be less than 500 characters'),
    website: yup.string().url('Please enter a valid URL')
  }),

  preferences: yup.object({
    newsletter: yup.boolean().default(false),
    notifications: yup.boolean().default(true)
  }),

  contacts: yup.array().of(yup.object({
    name: yup.string().min(1, 'Contact name is required').required('Contact name is required'),
    email: yup.string().email('Please enter a valid email address').required('Contact email is required')
  }))
})

// Create the validator
const validator = new YupValidatorAdapter(userSchema)

// Create form controller
const dataSource = new PlainObjectDataSource({
  name: '',
  email: '',
  age: 18,
  password: '',
  confirmPassword: '',
  profile: {
    bio: '',
    website: ''
  },
  preferences: {
    newsletter: false,
    notifications: true
  },
  contacts: []
})

const form = createForm(dataSource, validator)
```

## Advanced Yup Features

### Conditional Validation with `when()`

```javascript
const conditionalSchema = yup.object({
  accountType: yup.string().oneOf(['personal', 'business']).required(),

  companyName: yup.string().when('accountType', {
    is: 'business',
    then: (schema) => schema.required('Company name is required for business accounts'),
    otherwise: (schema) => schema.notRequired()
  }),

  taxId: yup.string().when('accountType', {
    is: 'business',
    then: (schema) => schema.required('Tax ID is required for business accounts'),
    otherwise: (schema) => schema.notRequired()
  })
})
```

### Custom Validation Methods

```javascript
const customSchema = yup.object({
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .test('no-spaces', 'Username cannot contain spaces', (value) => {
      return !value || !value.includes(' ')
    }),

  age: yup.number()
    .test('is-adult', 'Must be at least 13 years old', (value) => {
      return !value || value >= 13
    }),

  password: yup.string()
    .test('password-strength', 'Password is too weak', function(value) {
      if (!value) return true

      const hasUpper = /[A-Z]/.test(value)
      const hasLower = /[a-z]/.test(value)
      const hasNumber = /\d/.test(value)
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value)

      const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

      if (score < 3) {
        return this.createError({
          message: 'Password must contain at least 3 of: uppercase, lowercase, number, special character'
        })
      }

      return true
    })
})
```

## Working with Arrays

### Adding/Removing Contact Items

```javascript
// Add a new contact
await form.arrayAppend('contacts', { name: '', email: '' })

// Remove contact at index 1
await form.arrayRemove('contacts', 1)

// Move contact from index 0 to index 2
await form.arrayMove('contacts', 0, 2)

// Update specific contact field
await form.setValue('contacts.0.name', 'John Doe')
await form.setValue('contacts.0.email', 'john@example.com')
```

### Validating Array Items

```javascript
// Validate a specific contact
const isValid = await form.validateField('contacts.0.name')

// Get field state for array item
const contactNameField = form.field('contacts.0.name')
console.log(contactNameField.errors()) // Array of error messages
```