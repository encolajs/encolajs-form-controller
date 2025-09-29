# Zod Validation

EncolaJS Form Controller integrates seamlessly with [Zod](https://zod.dev), a TypeScript-first schema validation library with static type inference.

## Installation

```bash
npm install @encolajs/form-controller zod
```

## Basic Setup

```javascript
import { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
import { z } from 'zod'

// Define your schema
const userSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),

  email: z.string()
    .email('Please enter a valid email address'),

  age: z.number()
    .min(18, 'Must be at least 18 years old')
    .max(120, 'Please enter a valid age'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string(),

  profile: z.object({
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    website: z.string().url('Please enter a valid URL').optional().or(z.literal(''))
  }),

  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean()
  }),

  contacts: z.array(z.object({
    name: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Please enter a valid email address')
  }))
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Create the validator
const validator = new ZodValidatorAdapter(userSchema)

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

const form = new FormController(dataSource, validator)
```

## Advanced Zod Features

### Custom Validations with `refine()`

```javascript
const advancedSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  confirmPassword: z.string(),
  birthDate: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear()
    return age >= 13
  }, 'Must be at least 13 years old')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})
```

### Conditional Validation

```javascript
const conditionalSchema = z.object({
  accountType: z.enum(['personal', 'business']),
  companyName: z.string().optional(),
  taxId: z.string().optional()
}).refine((data) => {
  if (data.accountType === 'business') {
    return data.companyName && data.companyName.length > 0
  }
  return true
}, {
  message: "Company name is required for business accounts",
  path: ["companyName"]
}).refine((data) => {
  if (data.accountType === 'business') {
    return data.taxId && data.taxId.length > 0
  }
  return true
}, {
  message: "Tax ID is required for business accounts",
  path: ["taxId"]
})
```

## Working with Arrays

### Adding/Removing Contact Items

```javascript
// Add a new contact
await form.arrayAdd('contacts', { name: '', email: '' })

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