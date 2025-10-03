# Getting Started

## Core Concepts

EncolaJS Form Controller is a framework-agnostic form state management library that provides reactive form handling using alien-signals. It's designed to work seamlessly with any JavaScript framework while providing powerful validation capabilities.

### Key Features

- **Reactive**: Built on `alien-signals` for efficient reactivity
- **UI Agnostic**: Works with Vue 3, React, Alpine.js, and vanilla JavaScript
- **Validation**: Supports multiple validation libraries (Zod, Yup, Valibot, EncolaJS Validator)
- **Single Field Validation**: Validate individual fields without affecting others
- **Nested Data**: Full support for nested objects and arrays
- **TypeScript**: Complete type safety out of the box

## Basic Usage

### 1. Create a Form Controller

```javascript
import { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
import { z } from 'zod'

// Define your ZOD schema
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  age: z.number().min(18, 'Must be at least 18 years old')
})

// Create the validator
const validator = new ZodValidatorAdapter(schema)

// Create data source
const dataSource = new PlainObjectDataSource({
  name: '',
  email: '',
  age: 0
})

// Create form with validation
const form = new FormController(dataSource, validator)
```

### 2. Interact with the form

The code below shows what happens in plain Javascript. Each UI library connects will automate these operations.

```javascript
// Set individual fields
await form.setValue('name', 'John Doe')
await form.setValue('email', 'john@example.com')

// Set field with options
await form.setValue('name', 'John Doe', {
  validate: true,  // Trigger validation after setting
  touch: true,     // Mark field as touched
  dirty: true      // Mark field as dirty
})

// For multiple fields, set them individually
await form.setValue('name', 'Jane Smith')
await form.setValue('email', 'jane@example.com')
await form.setValue('age', 25)
```

### 3. Watch for changes

```javascript
// Watch for changes using alien-signals
import { effect } from 'alien-signals'

effect(() => {
  console.log('Form data changed:', form.getValues())
})
```

### 4. Field State Management

Each field has its own state that you can access:

```javascript
// Get field state
const nameField = form.field('name')
console.log(nameField.value()) // Current field value
console.log(nameField.errors()) // Field validation errors
console.log(nameField.isDirty()) // Has the field been modified?
console.log(nameField.isValid()) // Is the field valid?
console.log(nameField.isTouched()) // Has the field been touched?
console.log(nameField.isValidating()) // Is the field currently being validated?

// Watch field changes using effects
import { effect } from 'alien-signals'

effect(() => {
  console.log('Name field changed:', nameField.value())
})
```

## Working with Nested Data

The form controller handles nested objects and arrays seamlessly using the `dot` notation:

```javascript
import { FormController, PlainObjectDataSource } from '@encolajs/form-controller'

const dataSource = new PlainObjectDataSource({
  user: {
    name: '',
    contact: {
      email: '',
      phone: ''
    }
  },
  tags: ['javascript', 'typescript']
})

const form = new FormController(dataSource)

// Access nested fields
await form.setValue('user.name', 'John Doe')
await form.setValue('user.contact.email', 'john@example.com')
await form.setValue('tags.0', 'vue')

// Get nested field states
const emailField = form.field('user.contact.email')
```

## Next Steps

- [Quick Start](/quick-start.md) - Build a complete form example
- [API Reference](/form-controller-api.md) - Detailed API documentation
- [Validation](/validation/) - Validation adapters for Zod, Yup, Valibot and Encola Validator
- [UI Integration](/ui-integration/) - Integration with various UI libraries and vanilla JS