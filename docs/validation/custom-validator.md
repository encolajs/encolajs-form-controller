# Creating Custom Validation Adapters

If none of the built-in validation adapters (Zod, Yup, Valibot, EncolaJS Validator) meet your needs, you can create your own custom validation adapter.

## `FormValidator` Interface

All validation adapters must implement the `FormValidator` interface:

```typescript
interface FormValidator {
  /** Validate a specific field */
  validateField(path: string, dataSource: DataSource): Promise<string[]>

  /** Validate entire form */
  validate(dataSource: DataSource): Promise<Record<string, string[]>>

  /** Get current field errors */
  getFieldErrors(path: string): string[]

  /** Get all current errors */
  getAllErrors(): Record<string, string[]>

  /** Check if field is valid */
  isFieldValid(path: string): boolean

  /** Check if entire form is valid */
  isValid(): boolean

  /** Get fields that depend on the given field */
  getDependentFields(path: string): string[]

  /** Clear errors for specific field */
  clearFieldErrors(path: string): void

  /** Clear all errors */
  clearAllErrors(): void

  /** Set errors for specific field */
  setFieldErrors(path: string, errors: string[]): void

  /** Set multiple field errors */
  setErrors(errors: Record<string, string[]>): void
}
```

## Basic Custom Validator

Here's a simple example of a custom validator that validates our standard user schema:

```javascript
import useForm, { FormController, PlainObjectDataSource } from '@encolajs/form-controller'

class CustomValidator {
  constructor() {
    this.errors = {}
  }

  async validateField(path, dataSource) {
    const value = dataSource.get(path)
    const errors = []

    // Apply validation rules based on field path
    switch (path) {
      case 'name':
        if (!value || value.length < 2) {
          errors.push('Name must be at least 2 characters')
        }
        if (value && value.length > 50) {
          errors.push('Name must be less than 50 characters')
        }
        break

      case 'email':
        if (!value) {
          errors.push('Email is required')
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Please enter a valid email address')
        }
        break

      case 'age':
        if (!value) {
          errors.push('Age is required')
        } else if (value < 18) {
          errors.push('Must be at least 18 years old')
        } else if (value > 120) {
          errors.push('Please enter a valid age')
        }
        break

      case 'password':
        if (!value) {
          errors.push('Password is required')
        } else {
          if (value.length < 8) {
            errors.push('Password must be at least 8 characters')
          }
          if (!/[A-Z]/.test(value)) {
            errors.push('Password must contain at least one uppercase letter')
          }
          if (!/[a-z]/.test(value)) {
            errors.push('Password must contain at least one lowercase letter')
          }
          if (!/[0-9]/.test(value)) {
            errors.push('Password must contain at least one number')
          }
        }
        break

      case 'confirmPassword':
        const password = dataSource.get('password')
        if (!value) {
          errors.push('Please confirm your password')
        } else if (value !== password) {
          errors.push("Passwords don't match")
        }
        break

      case 'profile.bio':
        if (value && value.length > 500) {
          errors.push('Bio must be less than 500 characters')
        }
        break

      case 'profile.website':
        if (value && value !== '' && !/^https?:\/\/.+/.test(value)) {
          errors.push('Please enter a valid URL')
        }
        break

      default:
        // Handle array fields for contacts
        if (path.startsWith('contacts.') && path.endsWith('.name')) {
          if (!value || value.length === 0) {
            errors.push('Contact name is required')
          }
        } else if (path.startsWith('contacts.') && path.endsWith('.email')) {
          if (!value) {
            errors.push('Contact email is required')
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push('Please enter a valid email address')
          }
        }
        break
    }

    // Update internal errors state
    if (errors.length > 0) {
      this.errors[path] = errors
    } else {
      delete this.errors[path]
    }

    return errors
  }

  async validate(dataSource) {
    const allData = dataSource.all()
    const allErrors = {}

    // Validate all fields
    const fieldPaths = this.getAllFieldPaths(allData)

    for (const path of fieldPaths) {
      const errors = await this.validateField(path, dataSource)
      if (errors.length > 0) {
        allErrors[path] = errors
      }
    }

    this.errors = allErrors
    return allErrors
  }

  getFieldErrors(path) {
    return this.errors[path] || []
  }

  getAllErrors() {
    return { ...this.errors }
  }

  isFieldValid(path) {
    return !this.errors[path] || this.errors[path].length === 0
  }

  isValid() {
    return Object.keys(this.errors).length === 0
  }

  getDependentFields(path) {
    // Return fields that should be re-validated when this field changes
    switch (path) {
      case 'password':
        return ['confirmPassword']
      default:
        return []
    }
  }

  clearFieldErrors(path) {
    delete this.errors[path]
  }

  clearAllErrors() {
    this.errors = {}
  }

  setFieldErrors(path, errors) {
    if (errors.length > 0) {
      this.errors[path] = errors
    } else {
      delete this.errors[path]
    }
  }

  setErrors(errors) {
    this.errors = { ...errors }
  }

  // Helper method to get all field paths from data
  getAllFieldPaths(data, prefix = '') {
    const paths = []

    for (const key in data) {
      const currentPath = prefix ? `${prefix}.${key}` : key
      const value = data[key]

      paths.push(currentPath)

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            paths.push(...this.getAllFieldPaths(item, `${currentPath}.${index}`))
          } else {
            paths.push(`${currentPath}.${index}`)
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        paths.push(...this.getAllFieldPaths(value, currentPath))
      }
    }

    return paths
  }
}

// Usage
const validator = new CustomValidator()
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

## Advanced Custom Validator

For more complex scenarios, you can create a rule-based validator:

```javascript
class RuleBasedValidator {
  constructor(rules = {}) {
    this.rules = rules
    this.errors = {}
  }

  addRule(field, rule) {
    if (!this.rules[field]) {
      this.rules[field] = []
    }
    this.rules[field].push(rule)
  }

  async validateField(path, dataSource) {
    const value = dataSource.get(path)
    const fieldRules = this.rules[path] || []
    const errors = []

    for (const rule of fieldRules) {
      const result = await this.executeRule(rule, value, path, dataSource)
      if (result !== true) {
        errors.push(result)
      }
    }

    if (errors.length > 0) {
      this.errors[path] = errors
    } else {
      delete this.errors[path]
    }

    return errors
  }

  async executeRule(rule, value, path, dataSource) {
    switch (rule.type) {
      case 'required':
        return value && value.toString().trim().length > 0
          ? true
          : rule.message || 'This field is required'

      case 'minLength':
        return !value || value.length >= rule.min
          ? true
          : rule.message || `Must be at least ${rule.min} characters`

      case 'maxLength':
        return !value || value.length <= rule.max
          ? true
          : rule.message || `Must be no more than ${rule.max} characters`

      case 'email':
        return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? true
          : rule.message || 'Please enter a valid email address'

      case 'min':
        return !value || value >= rule.min
          ? true
          : rule.message || `Must be at least ${rule.min}`

      case 'max':
        return !value || value <= rule.max
          ? true
          : rule.message || `Must be no more than ${rule.max}`

      case 'regex':
        return !value || rule.pattern.test(value)
          ? true
          : rule.message || 'Invalid format'

      case 'same':
        const compareValue = dataSource.get(rule.field)
        return value === compareValue
          ? true
          : rule.message || `Must match ${rule.field}`

      case 'custom':
        return await rule.validator(value, path, dataSource)

      default:
        return true
    }
  }

  // Implement other required methods...
  async validate(dataSource) {
    const allErrors = {}

    for (const field in this.rules) {
      const errors = await this.validateField(field, dataSource)
      if (errors.length > 0) {
        allErrors[field] = errors
      }
    }

    this.errors = allErrors
    return allErrors
  }

  getFieldErrors(path) { return this.errors[path] || [] }
  getAllErrors() { return { ...this.errors } }
  isFieldValid(path) { return !this.errors[path] || this.errors[path].length === 0 }
  isValid() { return Object.keys(this.errors).length === 0 }
  getDependentFields(path) { return [] }
  clearFieldErrors(path) { delete this.errors[path] }
  clearAllErrors() { this.errors = {} }
  setFieldErrors(path, errors) {
    if (errors.length > 0) {
      this.errors[path] = errors
    } else {
      delete this.errors[path]
    }
  }
  setErrors(errors) { this.errors = { ...errors } }
}

// Usage with rules
const validator = new RuleBasedValidator()

// Add validation rules
validator.addRule('name', { type: 'required', message: 'Name is required' })
validator.addRule('name', { type: 'minLength', min: 2, message: 'Name must be at least 2 characters' })
validator.addRule('name', { type: 'maxLength', max: 50, message: 'Name must be less than 50 characters' })

validator.addRule('email', { type: 'required', message: 'Email is required' })
validator.addRule('email', { type: 'email', message: 'Please enter a valid email address' })

validator.addRule('age', { type: 'required', message: 'Age is required' })
validator.addRule('age', { type: 'min', min: 18, message: 'Must be at least 18 years old' })
validator.addRule('age', { type: 'max', max: 120, message: 'Please enter a valid age' })

validator.addRule('password', { type: 'required', message: 'Password is required' })
validator.addRule('password', { type: 'minLength', min: 8, message: 'Password must be at least 8 characters' })
validator.addRule('password', {
  type: 'regex',
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  message: 'Password must contain uppercase, lowercase, and number'
})

validator.addRule('confirmPassword', { type: 'required', message: 'Please confirm your password' })
validator.addRule('confirmPassword', { type: 'same', field: 'password', message: "Passwords don't match" })

// Add custom validation
validator.addRule('contacts.*.name', {
  type: 'custom',
  validator: async (value, path, dataSource) => {
    if (!value || value.length === 0) {
      return 'Contact name is required'
    }
    return true
  }
})

validator.addRule('contacts.*.email', {
  type: 'custom',
  validator: async (value, path, dataSource) => {
    if (!value) {
      return 'Contact email is required'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address'
    }
    return true
  }
})
```

## Integrating 3rd-party Libraries

You can also create adapters for external validation libraries that aren't natively supported:

```javascript
// Example: Joi adapter
class JoiValidatorAdapter {
  constructor(schema) {
    this.schema = schema
    this.errors = {}
  }

  async validateField(path, dataSource) {
    try {
      const allData = dataSource.all()
      await this.schema.validateAsync(allData, { allowUnknown: true })

      // If validation passes, clear errors for this field
      delete this.errors[path]
      return []
    } catch (error) {
      // Extract errors for the specific field
      const fieldErrors = error.details
        .filter(detail => detail.path.join('.') === path)
        .map(detail => detail.message)

      if (fieldErrors.length > 0) {
        this.errors[path] = fieldErrors
      }

      return fieldErrors
    }
  }

  async validate(dataSource) {
    try {
      const allData = dataSource.all()
      await this.schema.validateAsync(allData)
      this.errors = {}
      return {}
    } catch (error) {
      const errors = {}

      error.details.forEach(detail => {
        const path = detail.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(detail.message)
      })

      this.errors = errors
      return errors
    }
  }

  // Implement other required methods...
  getFieldErrors(path) { return this.errors[path] || [] }
  getAllErrors() { return { ...this.errors } }
  isFieldValid(path) { return !this.errors[path] || this.errors[path].length === 0 }
  isValid() { return Object.keys(this.errors).length === 0 }
  getDependentFields(path) { return [] }
  clearFieldErrors(path) { delete this.errors[path] }
  clearAllErrors() { this.errors = {} }
  setFieldErrors(path, errors) {
    if (errors.length > 0) {
      this.errors[path] = errors
    } else {
      delete this.errors[path]
    }
  }
  setErrors(errors) { this.errors = { ...errors } }
}
```

## Testing Your Custom Validator

```javascript
// Test your custom validator
const validator = new CustomValidator()
const dataSource = new PlainObjectDataSource({
  name: 'Jo', // Too short
  email: 'invalid-email', // Invalid format
  age: 16, // Too young
  password: 'weak', // Too weak
  confirmPassword: 'different', // Doesn't match
  contacts: [
    { name: '', email: 'invalid' } // Both invalid
  ]
})

// Test individual field validation
const nameErrors = await validator.validateField('name', dataSource)
console.log('Name errors:', nameErrors)

// Test full form validation
const allErrors = await validator.validate(dataSource)
console.log('All errors:', allErrors)

// Test error state methods
console.log('Is valid:', validator.isValid())
console.log('Is name valid:', validator.isFieldValid('name'))
```

Creating custom validators gives you complete control over validation logic while maintaining compatibility with the EncolaJS Form Controller ecosystem.