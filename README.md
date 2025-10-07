# @encolajs/form-controller

Framework-agnostic form state management using `alien-signals` for reactivity.

![CI](https://github.com/encolajs/encolajs-form-controller/workflows/CI/badge.svg)
[![npm version](https://badge.fury.io/js/@encolajs%2Fform-controller.svg)](https://badge.fury.io/js/@encolajs%2Fvalidator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)


## Features

- 🚀 **Framework Agnostic** - Works with Vue, React, Alpine.js, or vanilla JavaScript
- ⚡ **Reactive** - Built on alien-signals for efficient reactivity
- 🎯 **Type Safe** - Full TypeScript support
- 🧩 **Pluggable** - Supports custom data sources and validators
- 📦 **Lightweight** - 5Kb gzipped (without validators)

## Installation

### NPM
```bash
npm install @encolajs/form-controller
```

### CDN (Global Usage)
```html
<!-- Include alien-signals first -->
<script src="https://unpkg.com/alien-signals@latest/dist/index.umd.js"></script>
<!-- Then include form-controller -->
<script src="https://unpkg.com/@encolajs/form-controller@latest/dist/index.umd.js"></script>
<script>
  // Available as global EncolaFormController
  const { FormController, PlainObjectDataSource } = EncolaFormController
</script>
```

## Quick Start

```typescript
import { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { effect } from 'alien-signals'

// Create form controller
const dataSource = new PlainObjectDataSource({ name: '', email: '' })
const form = new FormController(dataSource)

// Get field controller
const nameField = form.field('name')

// Subscribe to changes
effect(() => {
  console.log('Name:', nameField.value())
  console.log('Is valid:', nameField.isValid())
})

// Update values
await form.setValue('name', 'John Doe')

// Validate form
const isValid = await form.validate()

// Array operations
await form.arrayInsert('items', toIndex, { name: 'First Item' })
await form.arrayAppend('items', { name: 'Item 2' }) // same as insert to the last position
await form.arrayPrepend('items', { name: 'Item 0' }) // same as insert to the last position
await form.arrayRemove('items', fromIndex)
await form.arrayMove('items', fromIndex, toIndex)
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build

# Type check
npm run type-check
```

## License

MIT