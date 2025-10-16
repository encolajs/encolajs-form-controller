# FormController API Reference

## Constructor

```typescript
new FormController(dataSource: DataSource, validator?: FormValidator)
// alternatively
createForm(dataSource: DataSource, validator?: FormValidator)
```

Creates a new FormController instance with the provided data source and optional validator.

**Parameters:**
- `dataSource`: A DataSource instance (typically PlainObjectDataSource)
- `validator`: Optional FormValidator instance for validation

**Example:**
```javascript
import createForm, { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import useZodValidator from '@encolajs/form-controller/zod'

const dataSource = new PlainObjectDataSource({ name: '', email: '' })
const form = createForm(dataSource, useZodValidator(schema))
```

## Reactive Properties

These properties are reactive signals that can be observed for changes.

| Property | Type | Description |
|----------|------|-------------|
| `isSubmitting` | `Signal<boolean>` | Whether the form is currently being submitted |
| `isValidating` | `Signal<boolean>` | Whether the form is currently being validated |
| `isDirty` | `Signal<boolean>` | Whether any field has been modified from its initial value |
| `isTouched` | `Signal<boolean>` | Whether any field has been interacted with |
| `isValid` | `ISignal<boolean>` | Whether the entire form is valid (computed) |

**Usage:**
```javascript
// Access current value
console.log(form.isValid()) // true/false

// Watch for changes
import { effect } from 'alien-signals'
effect(() => {
  console.log('Form validity changed:', form.isValid())
})
```

## Core Methods

### Data Access

| Method | Signature | Description |
|--------|-----------|-------------|
| `getValue` | `getValue(path: string): unknown` | Get the value of a specific field by path |
| `getValues` | `getValues(): Record<string, unknown>` | Get all form values as an object |
| `setValue` | `setValue(path: string, value: unknown, options?: FormSetValueOptions): Promise<void>` | Set the value of a specific field |

**setValue Options:**
```typescript
interface FormSetValueOptions {
  validate?: boolean  // Whether to trigger validation (default: true if dirty)
  touch?: boolean     // Whether to mark field as touched (default: true)
  dirty?: boolean     // Whether to mark field as dirty (default: true)
}
```

**Examples:**
```javascript
// Get values
const name = form.getValue('user.name')
const allData = form.getValues()

// Set values
await form.setValue('name', 'John Doe')
await form.setValue('email', 'john@example.com', {
  validate: false, // Don't validate immediately
  touch: true,     // Mark as touched
  dirty: true      // Mark as dirty
})
```

### Field Management

| Method | Signature | Description |
|--------|-----------|-------------|
| `field` | `field(path: string): IFieldState` | Get the reactive state object for a specific field |

**Field State Properties:**
```typescript
interface IFieldState {
  readonly path: string                    // Field path
  readonly value: ISignal<unknown>         // Current field value (reactive)
  readonly isDirty: Signal<boolean>        // Whether field has been modified
  readonly isTouched: Signal<boolean>      // Whether field has been interacted with
  readonly isValidating: Signal<boolean>   // Whether field is currently validating
  readonly wasValidated: Signal<boolean>   // Whether field has been validated at least once
  readonly isValid: ISignal<boolean>       // Whether field is valid (computed)
  readonly errors: ISignal<string[]>       // Current field validation errors (computed)

  // Change tracking methods
  valueUpdated(): number                   // Subscribe to value changes for this field
  triggerValueUpdate(): void               // Trigger value update (internal use)
}
```

**Example:**
```javascript
const nameField = form.field('name')

// Access field properties
console.log(nameField.value())      // Current value
console.log(nameField.errors())     // Validation errors
console.log(nameField.isValid())    // Validity status
console.log(nameField.isDirty())    // Dirty status

// Watch field changes using alien-signals
import { effect } from 'alien-signals'

effect(() => {
  // Subscribe to field-specific value changes
  nameField.valueUpdated()
  console.log('Name changed:', nameField.value())
})
```

### Validation

| Method | Signature | Description |
|--------|-----------|-------------|
| `validate` | `validate(): Promise<boolean>` | Validate the entire form |
| `validateField` | `validateField(path: string): Promise<boolean>` | Validate a specific field |
| `getErrors` | `getErrors(): Record<string, string[]>` | Get all current validation errors |
| `setErrors` | `setErrors(errors: Record<string, string[]>): void` | Set form-level validation errors |

**Examples:**
```javascript
// Validate entire form
const isValid = await form.validate()
if (isValid) {
  console.log('Form is valid!')
} else {
  console.log('Validation errors:', form.getErrors())
}

// Validate specific field
const isNameValid = await form.validateField('name')

// Set custom errors
form.setErrors({
  email: ['This email is already taken'],
  password: ['Password is too weak']
})
```

### Form Lifecycle

| Method | Signature | Description |
|--------|-----------|-------------|
| `submit` | `submit(): Promise<boolean>` | Submit the form (validates first) |
| `reset` | `reset(): void` | Reset form to initial state |
| `destroy` | `destroy(): void` | Clean up form resources |

**Examples:**
```javascript
// Submit form
const success = await form.submit()
if (success) {
  console.log('Form submitted successfully')
}

// Reset form
form.reset() // Restores to initial values and clears all state

// Clean up when done
form.destroy() // Call when component unmounts
```

### Array Operations

| Method         | Signature                                                                                | Description                              |
|----------------|------------------------------------------------------------------------------------------|------------------------------------------|
| `arrayAppend`  | `arrayAppend(arrayPath: string, item: unknown, validate: boolean = true): Promise<void>` | Add item to array field at the end       |
| `arrayPrepend` | `arrayAppend(arrayPath: string, item: unknown, validate: boolean = true): Promise<void>`                           | Add item to array field at the beginning |
| `arrayInsert`  | `arrayAppend(arrayPath: string, index: number, item: unknown, validate: boolean = true): Promise<void>`            | Add item to array field at the beginning |
| `arrayRemove`  | `arrayRemove(arrayPath: string, index: number, validate: boolean = true): Promise<void>`                           | Remove item from array field             |
| `arrayMove`    | `arrayMove(arrayPath: string, fromIndex: number, toIndex: number, validate: boolean = true): Promise<void>`        | Move item within array field             |

The `validate` parameter is used for triggering validation at the array-path level. This is for situations where you need a minimum/maximum numbers of items present in the array.

**Examples:**
```javascript
// Add item to end of array
await form.arrayAppend('tags', 'javascript')

// Insert item at specific position
await form.arrayInsert('items', 1, { name: 'New Item' })

// Remove item at index
await form.arrayRemove('tags', 0)

// Move item from one position to another
await form.arrayMove('items', 0, 2) // Move first item to third position
```

### Change Propagation

| Method | Signature | Description |
|--------|-----------|-------------|
| `triggerValueChanged` | `triggerValueChanged(path: string): void` | Trigger value change notifications for a field and all related paths (parent, children, and global) |

**Example:**
```javascript
// Manually trigger value change propagation
// Useful when the underlying data changes outside FormController
form.triggerValueChanged('contacts')
// This will trigger updates for:
// - The 'contacts' field itself
// - All parent paths (if any)
// - All children paths (e.g., 'contacts.0.name', 'contacts.1.email')
// - The global data change signal
```

## Path Syntax

The FormController supports dot notation for nested objects and bracket notation for arrays:

```javascript
// Nested objects
form.setValue('user.profile.name', 'John')
form.setValue('user.contact.email', 'john@example.com')

// Arrays
form.setValue('tags.0', 'javascript')
form.setValue('items.1.name', 'Item Name')

// Mixed
form.setValue('users.0.profile.bio', 'Developer bio')
```

## Error Handling

```javascript
try {
  await form.setValue('email', 'invalid-email')
  const isValid = await form.validate()

  if (!isValid) {
    const errors = form.getErrors()
    console.log('Validation failed:', errors)
  }
} catch (error) {
  console.error('Form operation failed:', error)
}
```

## Best Practices

1. **Always use async/await** with `setValue`, `validate`, `validateField`, and array operations
2. **Clean up** forms in component unmount using `destroy()`
3. **Use field states** for reactive UI updates rather than polling values
4. **Batch operations** when setting multiple values to avoid unnecessary validations
5. **Use path notation** consistently for nested data access