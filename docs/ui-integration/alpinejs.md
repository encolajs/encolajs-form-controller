<script setup>
import AlpineJs from '../.vitepress/examples/AlpineJs.vue'
</script>

# AlpineJS Integration

This example demonstrates a complete form implementation using EncolaJS Form Controller with AlpineJS and EncolaJS Validator. The example uses AlpineJS directives for reactive UI updates and `x-for` for rendering repeatable fields.

<ClientOnly>
    <LiveDemo :component="AlpineJs"></LiveDemo>
</ClientOnly>


:::code-group

```js [Javascript]
// Import dependencies (replace with actual CDN URLs or local files)
import createForm, { FormController, PlainObjectDataSource, effect /* exported from alien-signals */ } from '@encolajs/form-controller'
import { createEncolaValidatorFromRules } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'

// Create global validator factory
const validatorFactory = new ValidatorFactory()

// Register Alpine.js component for form handling
document.addEventListener('alpine:init', () => {
  Alpine.data('encolaForm', (config = {}) => {
    const {
      values = {},
      rules = {},
      messages = {},
      arrayDefaults = {},
      onSubmit = null,
      onReset = null
    } = config

    // Create validator and form controller immediately
    const validator = createEncolaValidatorFromRules(validatorFactory, rules, messages)
    const dataSource = new PlainObjectDataSource(values)
    const formController = createForm(dataSource, validator)

    // Make form controller globally available for debugging
    if (typeof window !== 'undefined') {
      window.form = formController
    }

    const alpineData = {
      // Form controller instance
      formController,

      // Reactive form state (initialized with current values)
      formState: {
        isDirty: formController.isDirty(),
        isTouched: formController.isTouched(),
        isValid: formController.isValid()
      },

      // Field errors (reactive)
      errors: formController.getAllErrors(),

      // Form data (reactive)
      formData: formController.getValues(),

      // Initialize reactivity when component mounts
      init() {
        this.setupReactivity()
      },

      setupReactivity() {
        // Form-level state reactivity
        effect(() => {
          this.formState = {
            isDirty: formController.isDirty(),
            isTouched: formController.isTouched(),
            isValid: formController.isValid()
          }
        })

        // Error reactivity
        effect(() => {
          formController.errorsChanged()
          // this is required by Alpine's reactivity system
          this.errors = {...formController.getErrors()}
        })

        // Data change reactivity
        effect(() => {
          formController.dataChanged()
          // this is required by Alpine's reactivity system
          this.formValues = {...formController.getValues()}
        })
      },

      // Get errors for a specific field
      getFieldErrors(fieldPath) {
        return this.errors[fieldPath] || []
      },

      // Check if a field has errors
      hasFieldErrors(fieldPath) {
        return this.getFieldErrors(fieldPath).length > 0
      },

      // Handle field value changes
      handleFieldChange(fieldPath, value, options = {}) {
        formController.setValue(fieldPath, value, options).catch(console.error)
      },

      // Handle input events (for touched state)
      handleInput(event) {
        const fieldPath = event.target.getAttribute('name')
        if (!fieldPath) return

        let value = this.getInputValue(event.target)

        this.handleFieldChange(fieldPath, value, {
          touched: true,
          dirty: false
        })
      },

      // Handle change events (for dirty state)
      handleChange(event) {
        const fieldPath = event.target.getAttribute('name')
        if (!fieldPath) return

        let value = this.getInputValue(event.target)

        this.handleFieldChange(fieldPath, value, {
          touched: true,
          dirty: true
        })
      },

      // Get value from input element based on type
      getInputValue(element) {
        if (element.type === 'checkbox') {
          return element.checked
        } else if (element.type === 'number') {
          return element.value === '' ? undefined : Number(element.value)
        }
        return element.value
      },

      // Array manipulation methods
      arrayAppend(arrayPath) {
        const newItem = arrayDefaults[arrayPath] || {}
        formController.arrayAppend(arrayPath, newItem).catch(console.error)
      },

      arrayRemove(arrayPath, index) {
        formController.arrayRemove(arrayPath, index).catch(console.error)
      },

      arrayMoveUp(arrayPath, index) {
        if (index > 0) {
          formController.arrayMove(arrayPath, index, index - 1).catch(console.error)
        }
      },

      arrayMoveDown(arrayPath, index) {
        const array = formController.getValue(arrayPath)
        if (Array.isArray(array) && index < array.length - 1) {
          formController.arrayMove(arrayPath, index, index + 1).catch(console.error)
        }
      },

      // Form submission
      async submitForm(event) {
        event.preventDefault()

        if (onSubmit) {
          await onSubmit(formController, this)
        } else {
          // Default submit behavior
          try {
            const success = await formController.submit()
            if (success) {
              alert('Form submitted successfully!')
              console.log('Form data:', formController.getValues())
            } else {
              alert('Please fix the errors before submitting')
            }
          } catch (error) {
            console.error('Submit error:', error)
          }
        }
      },

      // Form reset
      resetForm(event) {
        event.preventDefault()

        if (onReset) {
          onReset(formController, this)
        } else {
          // Default reset behavior
          formController.reset()
        }
      }
    }

    return alpineData
  })
})
```

```html [HTML]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EncolaJS Form Controller - AlpineJS Example</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script type="module">
        // check the script tab
    </script>
</head>
<body class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
                <p class="text-gray-600">Complete form with EncolaJS Validator and AlpineJS reactive state management</p>

                <!-- Form State Indicators -->
                <div class="mt-4 flex gap-4 text-sm"
                     x-data="encolaForm({
                        values: {
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
                        },
                        rules: {
                          'name': 'required|min_length:2|max_length:50',
                          'email': 'required|email',
                          'age': 'required|integer|min:18|max:120',
                          'password': 'required|min_length:8|matches:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
                          'confirmPassword': 'required|same_as:@password',
                          'profile.bio': 'max_length:500',
                          'profile.website': 'url',
                          'contacts.*.name': 'required',
                          'contacts.*.email': 'required|email'
                        },
                        messages: {
                          'password:matches': 'Password must contain at least one digit, one small letter and on capital letter',
                          'contacts.*.name:required': 'Contact name is required',
                          'contacts.*.email:required': 'Contact email is required',
                        },
                        arrayDefaults: {
                          contacts: { name: '', email: '' }
                        }
                     })"
                    <span>Status: <span
                        x-text="formState.isDirty ? 'Has Changes' : 'No Changes'"
                        :class="formState.isDirty ? 'text-orange-600 font-medium' : 'text-gray-500'"></span></span>
                    <span>Touched: <span
                        x-text="formState.isTouched ? 'Touched' : 'Untouched'"
                        class="font-medium"></span></span>
                    <span>Valid: <span
                        x-text="formState.isValid ? 'Valid' : 'Invalid'"
                        :class="formState.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'"></span></span>
                </div>
            </div>

            <form class="space-y-8"
                  x-data="encolaForm({
                    values: {
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
                    },
                    rules: {
                      'name': 'required|min_length:2|max_length:50',
                      'email': 'required|email',
                      'age': 'required|integer|min:18|max:120',
                      'password': 'required|min_length:8|matches:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
                      'confirmPassword': 'required|same_as:@password',
                      'profile.bio': 'max_length:500',
                      'profile.website': 'url',
                      'contacts.*.name': 'required',
                      'contacts.*.email': 'required|email'
                    },
                    messages: {
                      'password:matches': 'Password must contain at least one digit, one small letter and on capital letter',
                      'contacts.*.name:required': 'Contact name is required',
                      'contacts.*.email:required': 'Contact email is required',
                    },
                    arrayDefaults: {
                      contacts: { name: '', email: '' }
                    }
                  })"
                  @submit="submitForm">
                <!-- Basic Information -->
                <section>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text"
                                   id="name"
                                   name="name"
                                   x-model="formData.name"
                                   @input="handleInput"
                                   @change="handleChange"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter your full name">
                            <div x-show="hasFieldErrors('name')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('name')[0]"></div>
                            </div>
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email"
                                   id="email"
                                   name="email"
                                   x-model="formData.email"
                                   @input="handleInput"
                                   @change="handleChange"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter your email">
                            <div x-show="hasFieldErrors('email')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('email')[0]"></div>
                            </div>
                        </div>

                        <div>
                            <label for="age" class="block text-sm font-medium text-gray-700">Age</label>
                            <input type="number"
                                   id="age"
                                   name="age"
                                   x-model="formData.age"
                                   @input="handleInput"
                                   @change="handleChange"
                                   min="18"
                                   max="120"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <div x-show="hasFieldErrors('age')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('age')[0]"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Security -->
                <section>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Security</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password"
                                   id="password"
                                   name="password"
                                   x-model="formData.password"
                                   @input="handleInput"
                                   @change="handleChange"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Create a secure password">
                            <div x-show="hasFieldErrors('password')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('password')[0]"></div>
                            </div>
                        </div>

                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <input type="password"
                                   id="confirmPassword"
                                   name="confirmPassword"
                                   x-model="formData.confirmPassword"
                                   @input="handleInput"
                                   @change="handleChange"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Confirm your password">
                            <div x-show="hasFieldErrors('confirmPassword')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('confirmPassword')[0]"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Profile Information -->
                <section>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                    <div class="space-y-4">
                        <div>
                            <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea id="bio"
                                      name="profile.bio"
                                      x-model="formData.profile?.bio"
                                      @input="handleInput"
                                      @change="handleChange"
                                      rows="3"
                                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Tell us about yourself (optional)"></textarea>
                            <div x-show="hasFieldErrors('profile.bio')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('profile.bio')[0]"></div>
                            </div>
                        </div>

                        <div>
                            <label for="website" class="block text-sm font-medium text-gray-700">Website</label>
                            <input type="url"
                                   id="website"
                                   name="profile.website"
                                   x-model="formData.profile?.website"
                                   @input="handleInput"
                                   @change="handleChange"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="https://yourwebsite.com (optional)">
                            <div x-show="hasFieldErrors('profile.website')" class="text-red-500 text-sm mt-1">
                                <div x-text="getFieldErrors('profile.website')[0]"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Preferences -->
                <section>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
                    <div class="space-y-4">
                        <div class="flex items-center">
                            <input type="checkbox"
                                   id="newsletter"
                                   name="preferences.newsletter"
                                   x-model="formData.preferences?.newsletter"
                                   @change="handleChange"
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label for="newsletter" class="ml-2 block text-sm text-gray-900">
                                Subscribe to newsletter
                            </label>
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox"
                                   id="notifications"
                                   name="preferences.notifications"
                                   x-model="formData.preferences?.notifications"
                                   @change="handleChange"
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label for="notifications" class="ml-2 block text-sm text-gray-900">
                                Enable notifications
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Contacts Array -->
                <section>
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-900">Emergency Contacts</h2>
                        <button type="button"
                                @click="arrayAppend('contacts')"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">
                            Add Contact
                        </button>
                    </div>

                    <div class="space-y-4">
                        <template x-for="(contact, index) in formData?.contacts || []" :key="`contact-${index}`">
                            <div class="border border-gray-200 rounded-lg p-4 space-y-4">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-medium text-gray-900" x-text="`Contact ${index + 1}`"></h4>
                                    <div class="flex gap-2">
                                        <button type="button"
                                                @click="arrayMoveUp('contacts', index)"
                                                :disabled="index === 0"
                                                class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed">↑</button>
                                        <button type="button"
                                                @click="arrayMoveDown('contacts', index)"
                                                :disabled="index === (formData.contacts?.length || 0) - 1"
                                                class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed">↓</button>
                                        <button type="button"
                                                @click="arrayRemove('contacts', index)"
                                                class="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Name</label>
                                        <input type="text"
                                               :name="`contacts.${index}.name`"
                                               x-model="contact.name"
                                               @input="handleInput"
                                               @change="handleChange"
                                               class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <div x-show="hasFieldErrors(`contacts.${index}.name`)" class="text-red-500 text-sm mt-1">
                                            <div x-text="getFieldErrors(`contacts.${index}.name`)[0]"></div>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700">Email</label>
                                        <input type="email"
                                               :name="`contacts.${index}.email`"
                                               x-model="contact.email"
                                               @input="handleInput"
                                               @change="handleChange"
                                               class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                        <div x-show="hasFieldErrors(`contacts.${index}.email`)" class="text-red-500 text-sm mt-1">
                                            <div x-text="getFieldErrors(`contacts.${index}.email`)[0]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </section>

                <!-- Form Actions -->
                <div class="flex justify-between pt-6 border-t border-gray-200">
                    <button type="button"
                            @click="resetForm"
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md">
                        Reset Form
                    </button>

                    <button type="submit"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                        Create Account
                    </button>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
```

:::