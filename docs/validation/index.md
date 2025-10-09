# Validation

EncolaJS Form Controller supports multiple validation libraries through a flexible adapter system. Choose the validation library that best fits your project's needs and coding style.

## Supported Validation Libraries

### [Zod](/validation/zod.md)

TypeScript-first schema validation with static type inference.

**Best for:** TypeScript projects, type safety, modern development

```javascript
import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  contacts: z.array(z.object({
    name: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Please enter a valid email address')
  }))
})

const validator = new ZodValidatorAdapter(schema)
```

### [Yup](/validation/yup.md)

JavaScript schema validation with expressive API.

**Best for:** JavaScript projects, familiar API, existing Yup schemas

```javascript
import { YupValidatorAdapter } from '@encolajs/form-controller/yup'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required(),
  email: yup.string().email('Please enter a valid email').required(),
  contacts: yup.array().of(yup.object({
    name: yup.string().min(1, 'Contact name is required').required(),
    email: yup.string().email('Please enter a valid email address').required()
  }))
})

const validator = new YupValidatorAdapter(schema)
```

### [Valibot](/validation/valibot.md)

Modular and type-safe schema validation library.

**Best for:** Modern TypeScript projects, modular approach, performance

```javascript
import { ValibotValidatorAdapter } from '@encolajs/form-controller/valibot'
import * as v from 'valibot'

const schema = v.object({
  name: v.pipe(v.string(), v.minLength(2, 'Name must be at least 2 characters')),
  email: v.pipe(v.string(), v.email('Please enter a valid email')),
  contacts: v.array(v.object({
    name: v.pipe(v.string(), v.minLength(1, 'Contact name is required')),
    email: v.pipe(v.string(), v.email('Please enter a valid email address'))
  }))
})

const validator = new ValibotValidatorAdapter(schema)
```

### [EncolaJS Validator](/validation/encola-validator.md)

Laravel-inspired validation with string-based rule syntax.

**Best for:** Laravel developers, rule-based validation, dynamic rules

```javascript
import { EncolaValidatorAdapter, createEncolaValidatorFromRules } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'

const rules = {
  'name': 'required|min_length:2',
  'email': 'required|email',
  'contacts.*.name': 'required|min_length:1',
  'contacts.*.email': 'required|email'
}

const validatorFactory = new ValidatorFactory()
const validator = createEncolaValidatorFromRules(validatorFactory, rules)
```

## Custom Validation

If none of the built-in adapters meet your needs, you can [create a custom validation adapter](/validation/custom-validator.md).