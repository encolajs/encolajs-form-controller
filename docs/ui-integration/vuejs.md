<script setup>
import VueJs from '../.vitepress/examples/VueJs.vue'
</script>

# VueJS Integration

This example demonstrates a complete form implementation using EncolaJS Form Controller with VueJS and EncolaJS Validator. The example uses headless components with Vue's Composition API, `provide`/`inject` pattern, and scoped slots to expose reactive form state and methods.

<ClientOnly>
    <LiveDemo :component="VueJs"></LiveDemo>
</ClientOnly>

## Headless Components Architecture

The VueJS integration uses a headless component pattern where the form logic is separated from the presentation. This approach provides maximum flexibility while maintaining strong integration with the FormController.

### HeadlessForm Component

The `HeadlessForm` component is the root component that creates the FormController instance and provides it to child components via Vue's `provide`/`inject` mechanism.

:::code-group

```vue [HeadlessForm.vue]
<script setup>
import { provide, reactive, onMounted, onUnmounted } from 'vue'
import createForm, { effect } from '@encolajs/form-controller'

const props = defineProps({
  dataSource: {
    type: Object,
    required: true
  },
  validator: {
    type: Object,
    required: false,
    default: null
  }
})

// Create form controller
const formController = createForm(props.dataSource, props.validator)

// Reactive form state
const formState = reactive({
  isDirty: formController.isDirty(),
  isTouched: formController.isTouched(),
  isValid: formController.isValid(),
  errors: formController.getErrors(),
  values: formController.getValues()
})

// Form methods exposed to child components
const formMethods = {
  submit: async () => {
    const success = await formController.submit()
    return success
  },
  reset: () => {
    formController.reset()
  },
  setValue: (path, value, options) => {
    return formController.setValue(path, value, options)
  },
  getValue: (path) => {
    return formController.getValue(path)
  },
  getErrors: (path) => {
    if (path) {
      return formState.errors[path] || []
    }
    return formState.errors
  },
  hasErrors: (path) => {
    const errors = formState.errors[path] || []
    return errors.length > 0
  }
}

// Provide form controller and methods to child components
provide('formController', formController)
provide('formState', formState)
provide('formMethods', formMethods)

// Setup reactivity with alien-signals effects
let effects = []

onMounted(() => {
  // Form-level state reactivity
  effects.push(effect(() => {
    formState.isDirty = formController.isDirty()
    formState.isTouched = formController.isTouched()
    formState.isValid = formController.isValid()
  }))

  // Error reactivity (only needed for form-level error tracking)
  effects.push(effect(() => {
    formController.errorsChanged()
    formState.errors = { ...formController.getErrors() }
  }))

  // Note: Individual field reactivity is now handled by HeadlessInput and HeadlessRepeatable
  // components using path-specific change tracking (pathChanged), which prevents unnecessary
  // re-renders when unrelated fields change
})

onUnmounted(() => {
  // Clean up effects
  effects.forEach(dispose => dispose?.())
  effects = []
})
</script>

<template>
  <slot
    :state="formState"
    :methods="formMethods"
    :controller="formController"
  />
</template>
```

:::

### HeadlessInput Component

The `HeadlessInput` component handles individual form fields. It injects the form state and methods, and exposes field-specific data through scoped slots.

:::code-group

```vue [HeadlessInput.vue]
<script setup>
import { inject, computed, reactive, onMounted, onUnmounted } from 'vue'
import { effect } from 'alien-signals'

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const formController = inject('formController')
const formMethods = inject('formMethods')

// Reactive field state
const fieldState = reactive({
  value: formMethods.getValue(props.name),
  errors: formMethods.getErrors(props.name),
  hasErrors: formMethods.hasErrors(props.name)
})

// Computed properties for this specific field
const value = computed(() => fieldState.value)
const errors = computed(() => fieldState.errors)
const hasErrors = computed(() => fieldState.hasErrors)

// Setup field-specific reactivity
let effects = []

onMounted(() => {
  // Get field reference
  const field = formController.field(props.name)

  // Watch for changes to this specific field only
  effects.push(effect(() => {
    field.valueUpdated() // Subscribe to field-specific value changes
    fieldState.value = formMethods.getValue(props.name)
  }))

  // Watch for errors on this specific field
  effects.push(effect(() => {
    formController.errorsChanged() // Subscribe to errors changes
    fieldState.errors = formMethods.getErrors(props.name)
    fieldState.hasErrors = formMethods.hasErrors(props.name)
  }))
})

onUnmounted(() => {
  // Clean up effects
  effects.forEach(dispose => dispose?.())
  effects = []
})

// Handle input for touched state
const handleInput = (inputValue) => {
  formMethods.setValue(props.name, inputValue, {
    touched: true,
    dirty: false
  })
}

// Handle change for dirty state
const handleChange = (inputValue) => {
  formMethods.setValue(props.name, inputValue, {
    touched: true,
    dirty: true
  })
}
</script>

<template>
  <slot
    :value="value"
    :errors="errors"
    :hasErrors="hasErrors"
    :handleInput="handleInput"
    :handleChange="handleChange"
  />
</template>
```

:::

### HeadlessRepeatable Component

The `HeadlessRepeatable` component manages array fields, exposing array manipulation methods like add, remove, and move.

:::code-group

```vue [HeadlessRepeatable.vue]
<script setup>
import { inject, computed, reactive, onMounted, onUnmounted } from 'vue'
import { effect } from 'alien-signals'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  defaultItem: {
    type: Object,
    default: () => ({})
  }
})

const formController = inject('formController')
const formMethods = inject('formMethods')

// Reactive array state
const arrayState = reactive({
  items: Array.isArray(formMethods.getValue(props.name))
    ? formMethods.getValue(props.name)
    : []
})

// Get array items
const items = computed(() => arrayState.items)

// Setup array-specific reactivity
let effects = []

onMounted(() => {
  // Get field reference
  const field = formController.field(props.name)

  // Watch for changes to this specific array field only
  effects.push(effect(() => {
    field.valueUpdated() // Subscribe to field-specific value changes
    const value = formMethods.getValue(props.name)
    arrayState.items = Array.isArray(value) ? value : []
  }))
})

onUnmounted(() => {
  // Clean up effects
  effects.forEach(dispose => dispose?.())
  effects = []
})

// Array manipulation methods
const arrayAppend = () => {
  const newItem = { ...props.defaultItem }
  formController.arrayAppend(props.name, newItem).catch(console.error)
}

const arrayRemove = (index) => {
  formController.arrayRemove(props.name, index).catch(console.error)
}

const arrayMoveUp = (index) => {
  if (index > 0) {
    formController.arrayMove(props.name, index, index - 1).catch(console.error)
  }
}

const arrayMoveDown = (index) => {
  if (index < items.value.length - 1) {
    formController.arrayMove(props.name, index, index + 1).catch(console.error)
  }
}
</script>

<template>
  <slot
    :items="items"
    :arrayAppend="arrayAppend"
    :arrayRemove="arrayRemove"
    :arrayMoveUp="arrayMoveUp"
    :arrayMoveDown="arrayMoveDown"
  />
</template>
```

:::

## Complete Example

Here's a complete example showing how to use the headless components to build a user registration form:

:::code-group

```vue [App.vue]
<script setup>
import { PlainObjectDataSource } from '@encolajs/form-controller'
import { createEncolaValidatorFromRules } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'
import HeadlessForm from './HeadlessForm.vue'
import HeadlessInput from './HeadlessInput.vue'
import HeadlessRepeatable from './HeadlessRepeatable.vue'

// Create validator factory
const validatorFactory = new ValidatorFactory()

// Initial form values
const initialValues = {
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
}

// Validation rules
const rules = {
  'name': 'required|min_length:2|max_length:50',
  'email': 'required|email',
  'age': 'required|integer|min:18|max:120',
  'password': 'required|min_length:8|matches:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
  'confirmPassword': 'required|same_as:@password',
  'profile.bio': 'max_length:500',
  'profile.website': 'url',
  'contacts.*.name': 'required',
  'contacts.*.email': 'required|email'
}

// Custom validation messages
const messages = {
  'password:matches': 'Password must contain at least one digit, one small letter and one capital letter',
  'contacts.*.name:required': 'Contact name is required',
  'contacts.*.email:required': 'Contact email is required',
}

// Create data source and validator
const dataSource = new PlainObjectDataSource(initialValues)
const validator = createEncolaValidatorFromRules(validatorFactory, rules, messages)

// Default item for contacts array
const contactDefault = { name: '', email: '' }

// Handle form submission
const handleSubmit = async (methods) => {
  const success = await methods.submit()
  if (success) {
    alert('Form submitted successfully!')
    console.log('Form data:', methods.getValue())
  } else {
    alert('Please fix the errors before submitting')
  }
}

// Handle form reset
const handleReset = (methods) => {
  methods.reset()
}

// Helper to get input value based on type
const getInputValue = (event) => {
  const element = event.target
  if (element.type === 'checkbox') {
    return element.checked
  } else if (element.type === 'number') {
    return element.value === '' ? undefined : Number(element.value)
  }
  return element.value
}
</script>

<template>
  <HeadlessForm :data-source="dataSource" :validator="validator" v-slot="{ state, methods }">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- Form State Indicators -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
          <p class="text-gray-600">Complete form with EncolaJS Validator and VueJS headless components</p>

          <div class="mt-4 flex gap-4 text-sm">
            <span>Status: <span
              :class="state.isDirty ? 'text-orange-600 font-medium' : 'text-gray-500'"
            >{{ state.isDirty ? 'Has Changes' : 'No Changes' }}</span></span>
            <span>Touched: <span class="font-medium">{{ state.isTouched ? 'Touched' : 'Untouched' }}</span></span>
            <span>Valid: <span
              :class="state.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'"
            >{{ state.isValid ? 'Valid' : 'Invalid' }}</span></span>
          </div>
        </div>

        <form class="space-y-8" @submit.prevent="handleSubmit(methods)">
          <!-- Basic Information -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name Field -->
              <HeadlessInput name="name" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="Enter your full name"
                  />
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>

              <!-- Email Field -->
              <HeadlessInput name="email" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="Enter your email"
                  />
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>
            </div>
          </section>

          <!-- Security -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Security</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Password Field -->
              <HeadlessInput name="password" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    id="password"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="Create a secure password"
                  />
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>

              <!-- Confirm Password Field -->
              <HeadlessInput name="confirmPassword" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="Confirm your password"
                  />
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>
            </div>
          </section>

          <!-- Profile Information -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div class="space-y-4">
              <!-- Bio Field -->
              <HeadlessInput name="profile.bio" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    id="bio"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    rows="3"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="Tell us about yourself (optional)"
                  ></textarea>
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>

              <!-- Website Field -->
              <HeadlessInput name="profile.website" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="website" class="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    id="website"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    placeholder="https://yourwebsite.com (optional)"
                  />
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>
            </div>
          </section>

          <!-- Preferences -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
            <div class="space-y-4">
              <!-- Newsletter Checkbox -->
              <HeadlessInput name="preferences.newsletter" v-slot="{ value, handleChange }">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="newsletter"
                    :checked="value"
                    @change="handleChange(getInputValue($event))"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label for="newsletter" class="ml-2 block text-sm text-gray-900">
                    Subscribe to newsletter
                  </label>
                </div>
              </HeadlessInput>

              <!-- Notifications Checkbox -->
              <HeadlessInput name="preferences.notifications" v-slot="{ value, handleChange }">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    :checked="value"
                    @change="handleChange(getInputValue($event))"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label for="notifications" class="ml-2 block text-sm text-gray-900">
                    Enable notifications
                  </label>
                </div>
              </HeadlessInput>
            </div>
          </section>

          <!-- Contacts Array -->
          <section>
            <HeadlessRepeatable
              name="contacts"
              :default-item="contactDefault"
              v-slot="{ items, arrayAppend, arrayRemove, arrayMoveUp, arrayMoveDown }"
            >
              <div>
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-semibold text-gray-900">Emergency Contacts</h2>
                  <button
                    type="button"
                    @click="arrayAppend"
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Add Contact
                  </button>
                </div>

                <div class="space-y-4">
                  <div
                    v-for="(contact, index) in items"
                    :key="`contact-${index}`"
                    class="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div class="flex justify-between items-center">
                      <h4 class="font-medium text-gray-900">Contact {{ index + 1 }}</h4>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          @click="arrayMoveUp(index)"
                          :disabled="index === 0"
                          class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                        >↑</button>
                        <button
                          type="button"
                          @click="arrayMoveDown(index)"
                          :disabled="index === items.length - 1"
                          class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                        >↓</button>
                        <button
                          type="button"
                          @click="arrayRemove(index)"
                          class="text-red-600 hover:text-red-800 text-sm"
                        >Remove</button>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Contact Name -->
                      <HeadlessInput :name="`contacts.${index}.name`" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            :value="value"
                            @input="handleInput(getInputValue($event))"
                            @change="handleChange(getInputValue($event))"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                          />
                          <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                            {{ errors[0] }}
                          </div>
                        </div>
                      </HeadlessInput>

                      <!-- Contact Email -->
                      <HeadlessInput :name="`contacts.${index}.email`" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            :value="value"
                            @input="handleInput(getInputValue($event))"
                            @change="handleChange(getInputValue($event))"
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                          />
                          <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                            {{ errors[0] }}
                          </div>
                        </div>
                      </HeadlessInput>
                    </div>
                  </div>
                </div>
              </div>
            </HeadlessRepeatable>
          </section>

          <!-- Form Actions -->
          <div class="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="handleReset(methods)"
              class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
            >
              Reset Form
            </button>

            <button
              type="submit"
              class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  </HeadlessForm>
</template>
```

:::

## Key Concepts

### Provide/Inject Pattern

The headless components use Vue's `provide`/`inject` mechanism to share the FormController instance and related state across the component tree. This eliminates prop drilling and allows any nested component to access form state and methods.

### Scoped Slots

Each headless component uses scoped slots to expose relevant data and methods to the parent component. This gives you complete control over the HTML structure and styling while the headless component manages the logic.

### Reactivity with alien-signals

The integration uses `alien-signals` effects to bridge between the FormController's signal-based reactivity and Vue's reactivity system. This ensures that Vue components automatically update when form state changes.

**Field-specific Change Tracking**: Each field has its own `valueUpdated()` method that returns an incrementing number when the field's value changes. Field components subscribe only to their specific field's changes using `field.valueUpdated()`, preventing unnecessary re-renders when unrelated fields change. This is much more efficient than watching a global data change signal.

### Component Responsibilities

- **HeadlessForm**: Creates and manages the FormController, provides it to children, sets up reactivity
- **HeadlessInput**: Exposes field-specific values, errors, and handlers for individual inputs
- **HeadlessRepeatable**: Manages array fields and exposes array manipulation methods (add, remove, move)

## Benefits of This Approach

1. **Separation of Concerns**: Logic is separated from presentation, making components more reusable
2. **Maximum Flexibility**: You have complete control over HTML structure and styling
3. **Type Safety**: Works seamlessly with TypeScript for type-safe form handling
4. **Framework Integration**: Properly integrates with Vue's reactivity system
5. **Reusable Logic**: Headless components can be reused across different projects with different designs