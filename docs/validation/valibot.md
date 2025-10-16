# Valibot Validation

EncolaJS Form Controller integrates seamlessly with [Valibot](https://valibot.dev), a modular and type-safe schema validation library.

## Installation

```bash
npm install @encolajs/form-controller valibot
```

## Basic Setup

```javascript
import createForm, { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { ValibotValidatorAdapter } from '@encolajs/form-controller/valibot'
import * as v from 'valibot'

// Define your schema
const userSchema = v.pipe(
  v.object({
    name: v.pipe(
      v.string(),
      v.minLength(2, 'Name must be at least 2 characters'),
      v.maxLength(50, 'Name must be less than 50 characters')
    ),

    email: v.pipe(
      v.string(),
      v.email('Please enter a valid email address')
    ),

    age: v.pipe(
      v.number(),
      v.minValue(18, 'Must be at least 18 years old'),
      v.maxValue(120, 'Please enter a valid age')
    ),

    password: v.pipe(
      v.string(),
      v.minLength(8, 'Password must be at least 8 characters'),
      v.regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),
      v.regex(/[a-z]/, 'Password must contain at least one lowercase letter'),
      v.regex(/[0-9]/, 'Password must contain at least one number')
    ),

    confirmPassword: v.string(),

    profile: v.object({
      bio: v.optional(v.pipe(
        v.string(),
        v.maxLength(500, 'Bio must be less than 500 characters')
      )),
      website: v.optional(v.union([
        v.literal(''),
        v.pipe(v.string(), v.url('Please enter a valid URL'))
      ]))
    }),

    preferences: v.object({
      newsletter: v.boolean(),
      notifications: v.boolean()
    }),

    contacts: v.array(v.object({
      name: v.pipe(v.string(), v.minLength(1, 'Contact name is required')),
      email: v.pipe(v.string(), v.email('Please enter a valid email address'))
    }))
  }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      "Passwords don't match"
    ),
    ['confirmPassword']
  )
)

// Create the validator
const validator = new ValibotValidatorAdapter(userSchema)

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

## Advanced Valibot Features

### Custom Validation with `check()`

```javascript
const advancedSchema = v.pipe(
  v.object({
    username: v.pipe(
      v.string(),
      v.minLength(3, 'Username must be at least 3 characters'),
      v.check(
        (value) => !value.includes(' '),
        'Username cannot contain spaces'
      )
    ),

    birthDate: v.pipe(
      v.string(),
      v.isoDate('Please enter a valid date'),
      v.check(
        (date) => {
          const age = new Date().getFullYear() - new Date(date).getFullYear()
          return age >= 13
        },
        'Must be at least 13 years old'
      )
    )
  })
)
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