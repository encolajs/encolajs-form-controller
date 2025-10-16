# Installation

## Prerequisites

- Node.js 18 or higher
- A JavaScript framework (Vue 3, React, Alpine.js, or vanilla JavaScript)

## Basic Installation

Install the core package:

```bash
npm install @encolajs/form-controller
```

## Validation Libraries

EncolaJS Form Controller works with multiple validation libraries through adapters. Choose the one that fits your project:

### Zod

```bash
npm install zod
```

### Yup

```bash
npm install yup
```

### Valibot

```bash
npm install valibot
```

### EncolaJS Validator

```bash
npm install @encolajs/validator
```

## Framework-Specific Setup

### Vue 3

No additional setup required. The form controller works out of the box with Vue's reactivity system through alien-signals.

```javascript
import { FormController } from '@encolajs/form-controller'
import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
```

### React

Install the alien-signals React integration (if not already installed):

```bash
npm install @preact/signals-react
```

### Alpine.js

No additional dependencies needed. The form controller integrates seamlessly with Alpine.js's reactivity.

### Vanilla JavaScript

Works directly with any JavaScript environment that supports ES modules.

## TypeScript Support

EncolaJS Form Controller is written in TypeScript and includes full type definitions. No additional `@types` packages are needed.

## CDN Usage

For quick prototyping or simple projects, you can use the CDN version:

```html
<script type="module">
  import { FormController } from 'https://unpkg.com/@encolajs/form-controller/dist/index.es.js'
</script>
```

## Verification

To verify your installation, create a simple form controller:

```javascript
import createForm, { FormController, PlainObjectDataSource } from '@encolajs/form-controller'

const dataSource = new PlainObjectDataSource({
  name: '',
  email: ''
})

const form = createForm(dataSource)

console.log('Installation successful!', form.getValues())
```

## Next Steps

- [Getting Started](/getting-started.md) - Learn the basic concepts
- [Quick Start](/quick-start.md) - Build your first form in minutes