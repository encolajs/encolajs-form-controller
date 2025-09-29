# Quick Start

Let's build a complete user registration form in just a few minutes. This guide will show you how to create a form with validation, error handling, and submission.

## Step 1: Installation

```bash
npm install @encolajs/form-controller zod
```

## Step 2: Configure the Validator

First, let's set up validation for our form. Choose your preferred validation library:

::: code-group

```javascript [Zod]
import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
import { z } from 'zod'

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
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Create the validator
const validator = new ZodValidatorAdapter(userSchema)
```

```javascript [Yup]
import { YupValidatorAdapter } from '@encolajs/form-controller/yup'
import * as yup from 'yup'

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
  })
})

// Create the validator
const validator = new YupValidatorAdapter(userSchema)
```

```javascript [Valibot]
import { ValibotValidatorAdapter } from '@encolajs/form-controller/valibot'
import * as v from 'valibot'

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
    })
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
```

```javascript [EncolaJS Validator]
import { EncolaValidatorAdapter } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'

const validatorFactory = new ValidatorFactory()

const userRules = {
  'name': 'required|min_length:2|max_length:50',
  'email': 'required|email',
  'age': 'required|integer|min_value:18|max_value:120',
  'password': 'required|min_length:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
  'confirmPassword': 'required|same:password',
  'profile.bio': 'max_length:500',
  'profile.website': 'url',
  'preferences.newsletter': 'boolean',
  'preferences.notifications': 'boolean'
}

const userSchema = validatorFactory.make(userRules, {
  'name.required': 'Name is required',
  'name.min_length': 'Name must be at least 2 characters',
  'name.max_length': 'Name must be less than 50 characters',
  'email.required': 'Email is required',
  'email.email': 'Please enter a valid email address',
  'age.required': 'Age is required',
  'age.min_value': 'Must be at least 18 years old',
  'age.max_value': 'Please enter a valid age',
  'password.required': 'Password is required',
  'password.min_length': 'Password must be at least 8 characters',
  'password.regex': 'Password must contain uppercase, lowercase, and number',
  'confirmPassword.required': 'Please confirm your password',
  'confirmPassword.same': "Passwords don't match",
  'profile.bio.max_length': 'Bio must be less than 500 characters',
  'profile.website.url': 'Please enter a valid URL'
})

// Create the validator
const validator = new EncolaValidatorAdapter(userSchema)
```
:::

**Remember!** You can always [create a custom validation adapter](/validation/custom-validator.md).

## Step 3: Create the Form Controller

Now create the form controller using the validator from Step 2:

```javascript
import { FormController, PlainObjectDataSource } from '@encolajs/form-controller'

// Create a data source with initial form data
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
  }
})

// Create the form controller with the validator from Step 2
const form = new FormController(dataSource, validator)
```

## Step 4: Build the Form UI

### Vue 3 Example

```vue
<template>
  <form @submit.prevent="handleSubmit" class="user-form">
    <h2>User Registration</h2>

    <!-- Name Field -->
    <div class="field">
      <label for="name">Name *</label>
      <input
        id="name"
        :value="form.field('name').value()"
        @input="updateName"
        :class="{ error: !form.field('name').isValid() && form.field('name').isDirty() }"
        @blur="form.validateField('name')"
      />
      <div v-if="form.field('name').errors().length" class="error-message">
        {{ form.field('name').errors()[0] }}
      </div>
    </div>

    <!-- Email Field -->
    <div class="field">
      <label for="email">Email *</label>
      <input
        id="email"
        type="email"
        :value="form.field('email').value()"
        @input="updateEmail"
        :class="{ error: !form.field('email').isValid() && form.field('email').isDirty() }"
        @blur="form.validateField('email')"
      />
      <div v-if="form.field('email').errors().length" class="error-message">
        {{ form.field('email').errors()[0] }}
      </div>
    </div>

    <!-- Age Field -->
    <div class="field">
      <label for="age">Age *</label>
      <input
        id="age"
        type="number"
        :value="form.field('age').value()"
        @input="updateAge"
        :class="{ error: !form.field('age').isValid() && form.field('age').isDirty() }"
        @blur="form.validateField('age')"
      />
      <div v-if="form.field('age').errors().length" class="error-message">
        {{ form.field('age').errors()[0] }}
      </div>
    </div>

    <!-- Password Fields -->
    <div class="field">
      <label for="password">Password *</label>
      <input
        id="password"
        type="password"
        :value="form.field('password').value()"
        @input="updatePassword"
        :class="{ error: !form.field('password').isValid() && form.field('password').isDirty() }"
        @blur="form.validateField('password')"
      />
      <div v-if="form.field('password').errors().length" class="error-message">
        {{ form.field('password').errors()[0] }}
      </div>
    </div>

    <div class="field">
      <label for="confirmPassword">Confirm Password *</label>
      <input
        id="confirmPassword"
        type="password"
        :value="form.field('confirmPassword').value()"
        @input="updateConfirmPassword"
        :class="{ error: !form.field('confirmPassword').isValid() && form.field('confirmPassword').isDirty() }"
        @blur="form.validateField('confirmPassword')"
      />
      <div v-if="form.field('confirmPassword').errors().length" class="error-message">
        {{ form.field('confirmPassword').errors()[0] }}
      </div>
    </div>

    <!-- Nested Profile Fields -->
    <fieldset>
      <legend>Profile Information</legend>

      <div class="field">
        <label for="bio">Bio</label>
        <textarea
          id="bio"
          :value="form.field('profile.bio').value()"
          @input="updateBio"
          :class="{ error: !form.field('profile.bio').isValid() && form.field('profile.bio').isDirty() }"
          @blur="form.validateField('profile.bio')"
          rows="3"
        ></textarea>
        <div v-if="form.field('profile.bio').errors().length" class="error-message">
          {{ form.field('profile.bio').errors()[0] }}
        </div>
      </div>

      <div class="field">
        <label for="website">Website</label>
        <input
          id="website"
          type="url"
          :value="form.field('profile.website').value()"
          @input="updateWebsite"
          :class="{ error: !form.field('profile.website').isValid() && form.field('profile.website').isDirty() }"
          @blur="form.validateField('profile.website')"
          placeholder="https://example.com"
        />
        <div v-if="form.field('profile.website').errors().length" class="error-message">
          {{ form.field('profile.website').errors()[0] }}
        </div>
      </div>
    </fieldset>

    <!-- Preferences -->
    <fieldset>
      <legend>Preferences</legend>

      <div class="field checkbox">
        <label>
          <input
            type="checkbox"
            :checked="form.field('preferences.newsletter').value()"
            @change="updateNewsletter"
          />
          Subscribe to newsletter
        </label>
      </div>

      <div class="field checkbox">
        <label>
          <input
            type="checkbox"
            :checked="form.field('preferences.notifications').value()"
            @change="updateNotifications"
          />
          Enable notifications
        </label>
      </div>
    </fieldset>

    <!-- Submit Button -->
    <div class="actions">
      <button
        type="submit"
        :disabled="!form.isValid() || isSubmitting"
        :class="{ loading: isSubmitting }"
      >
        {{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
      </button>
    </div>

    <!-- Form Summary -->
    <div v-if="form.isDirty.value" class="form-summary">
      <p>Form Status:</p>
      <ul>
        <li>Valid: {{ form.isValid.value ? '' : 'L' }}</li>
        <li>Dirty: {{ form.isDirty.value ? '' : 'L' }}</li>
        <li>Errors: {{ Object.keys(form.errors.value).length }}</li>
      </ul>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { FormController, PlainObjectDataSource } from '@encolajs/form-controller'
import { validator } from './validator' // Your validator from Step 2

const isSubmitting = ref(false)

// Create form (from Step 3)
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
  }
})

const form = new FormController(dataSource, validator)

// Update methods for form fields
const updateName = async (event) => {
  await form.setValue('name', event.target.value)
}

const updateEmail = async (event) => {
  await form.setValue('email', event.target.value)
}

const updateAge = async (event) => {
  await form.setValue('age', parseInt(event.target.value) || 0)
}

const updatePassword = async (event) => {
  await form.setValue('password', event.target.value)
}

const updateConfirmPassword = async (event) => {
  await form.setValue('confirmPassword', event.target.value)
}

const updateBio = async (event) => {
  await form.setValue('profile.bio', event.target.value)
}

const updateWebsite = async (event) => {
  await form.setValue('profile.website', event.target.value)
}

const updateNewsletter = async (event) => {
  await form.setValue('preferences.newsletter', event.target.checked)
}

const updateNotifications = async (event) => {
  await form.setValue('preferences.notifications', event.target.checked)
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    // Validate the entire form
    const isValid = await form.validate()

    if (!isValid) {
      console.log('Form has errors:', form.getErrors())
      return
    }

    // Submit the form data
    const userData = form.getValues()
    console.log('Submitting user data:', userData)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    alert('Account created successfully!')

    // Reset form after successful submission
    form.reset()

  } catch (error) {
    console.error('Submission error:', error)
    alert('Failed to create account. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
.user-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.field input.error,
.field textarea.error {
  border-color: #e74c3c;
  background-color: #fdf2f2;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.field.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
}

.field.checkbox input {
  width: auto;
}

fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
}

legend {
  font-weight: 500;
  padding: 0 0.5rem;
}

.actions {
  margin-top: 2rem;
}

button[type="submit"] {
  background: #3498db;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button[type="submit"]:hover:not(:disabled) {
  background: #2980b9;
}

button[type="submit"]:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.form-summary {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>
```

## Step 5: Handle Form Submission

The form submission logic is already included in the Vue example above. Here are the key points:

1. **Validate Before Submit**: Always validate the entire form before submission
2. **Handle Loading State**: Show loading indicators during submission
3. **Error Handling**: Gracefully handle both validation and submission errors
4. **Success Handling**: Reset the form or redirect after successful submission

## Next Steps

Congratulations! You've built a complete form with validation. Here are some next steps:

- [Advanced Usage](/advanced.md) - Learn about complex validation scenarios
- [API Reference](/api-reference.md) - Explore all available methods and options
- [Examples](/examples.md) - See more real-world examples