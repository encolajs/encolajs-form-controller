# EncolaJS Validator

EncolaJS Form Controller integrates seamlessly with [EncolaJS Validator](https://www.npmjs.com/package/@encolajs/validator), a Laravel-inspired validation library with string-based rule syntax.

## Installation

```bash
npm install @encolajs/form-controller @encolajs/validator
```

## Basic Setup

```javascript
import { useForm, FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { EncolaValidatorAdapter } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'

const validatorFactory = new ValidatorFactory()

// Define your validation rules
const userRules = {
  'name': 'required|min_length:2|max_length:50',
  'email': 'required|email',
  'age': 'required|integer|min_value:18|max_value:120',
  'password': 'required|min_length:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/',
  'confirmPassword': 'required|same:password',
  'profile.bio': 'max_length:500',
  'profile.website': 'url',
  'preferences.newsletter': 'boolean',
  'preferences.notifications': 'boolean',
  'contacts.*.name': 'required',
  'contacts.*.email': 'required|email'
}

// Define custom error messages, if the defaults are not of your liking
const customMessages = {
  'contacts.*.name:required': 'Contact name is required',
  'contacts.*.email:required': 'Contact email is required',
}

// Create the schema and validator
const userSchema = validatorFactory.make(userRules, customMessages)
const validator = new EncolaValidatorAdapter(userSchema)

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

const form = useForm(dataSource, validator)
```

## Advanced Features

### Wildcard Rules for Arrays

```javascript
const arrayRules = {
  'items': 'required|array|min_items:1',
  'items.*.name': 'required',
  'items.*.price': 'required|numeric|min_value:0',
  'items.*.category': 'required|in_list:electronics,books,clothing',

  // Nested array validation
  'users.*.contacts.*.type': 'required|in_list:email,phone',
  'users.*.contacts.*.value': 'required'
}
```

### Conditional Validation Rules

```javascript
const conditionalRules = {
  'account_type': 'required|in_list:personal,business',
  'company_name': 'required_if:account_type,business',
  'tax_id': 'required_if:account_type,business|alpha_num',
  'personal_id': 'required_if:account_type,personal'
}

const conditionalMessages = {
  'company_name.required_if': 'Company name is required for business accounts',
  'tax_id.required_if': 'Tax ID is required for business accounts',
  'personal_id.required_if': 'Personal ID is required for personal accounts'
}
```

### Custom Validation Rules

```javascript
// Register a custom rule
validatorFactory.extend('strong_password', function(attribute, value, parameters, validator) {
  if (!value) return true

  const hasUpper = /[A-Z]/.test(value)
  const hasLower = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value)

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
  return score >= 3
}, 'The :attribute must contain at least 3 of: uppercase, lowercase, number, special character')

// Use the custom rule
const rulesWithCustom = {
  'password': 'required|min_length:8|strong_password'
}
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

## Helper Functions

### Creating Adapters

```javascript
import { createEncolaAdapter, createEncolaValidatorFromRules } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'

// Method 1: From existing validator instance
const existingValidator = validatorFactory.make(rules, messages)
const adapter1 = createEncolaAdapter(existingValidator)

// Method 2: From rules directly
const adapter2 = createEncolaValidatorFromRules(validatorFactory, rules, messages)
```
