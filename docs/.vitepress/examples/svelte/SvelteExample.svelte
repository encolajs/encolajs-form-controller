<script>
import { onMount, onDestroy } from 'svelte'
import useForm, { FormController, PlainObjectDataSource } from '../../../../src/'
import { createEncolaValidatorFromRules } from '../../../../encola'
import { ValidatorFactory } from '@encolajs/validator'
import { useFormController } from './useFormController.svelte.js'
import { useField } from './useField.svelte.js'
import { useArrayField } from './useArrayField.svelte.js'

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
  'age': 'required|integer|gte:18|lte:120',
  'password': 'required|min_length:8|matches:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
  'confirmPassword': 'required|same_as:@password',
  'profile.bio': 'max_length:500',
  'profile.website': 'url',
  'contacts': 'array_min:2',
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
const formController = useForm(dataSource, validator)

// Create form state
const form = useFormController(formController)

// Default item for contacts array
const contactDefault = { name: '', email: '' }
const contacts = useArrayField(formController, 'contacts', contactDefault)

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

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault()
  const success = await form.methods.submit()
  if (success) {
    alert('Form submitted successfully!')
    console.log('Form data:', form.methods.getValue())
  } else {
    alert('Please fix the errors before submitting')
  }
}

// Handle form reset
const handleReset = () => {
  form.methods.reset()
}

// Cleanup on destroy
onDestroy(() => {
  form.cleanup()
  contacts.cleanup()
})
</script>

<div class="bg-gray-100 min-h-screen p-4">
  <div class="mb-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
      <p class="text-gray-600">Complete form with EncolaJS Validator and Svelte 5 runes</p>

      <!-- Form State Indicators -->
      <div class="mt-4 flex gap-4 text-sm">
        <span>Status: <span class={form.state.isDirty ? 'text-orange-600 font-medium' : 'text-gray-500'}>
          {form.state.isDirty ? 'Has Changes' : 'No Changes'}
        </span></span>
        <span>Touched: <span class="font-medium">{form.state.isTouched ? 'Touched' : 'Untouched'}</span></span>
        <span>Valid: <span class={form.state.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {form.state.isValid ? 'Valid' : 'Invalid'}
        </span></span>
      </div>
    </div>

    <form class="space-y-8" on:submit={handleSubmit}>
      <!-- Basic Information -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name Field -->
          {#snippet nameField()}
            {@const field = useField(formController, 'name')}
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render nameField()}

          <!-- Email Field -->
          {#snippet emailField()}
            {@const field = useField(formController, 'email')}
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="email"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render emailField()}

          <!-- Age Field -->
          {#snippet ageField()}
            {@const field = useField(formController, 'age')}
            <div>
              <label for="age" class="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                id="age"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                min="18"
                max="120"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render ageField()}
        </div>
      </section>

      <!-- Security -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Security</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Password Field -->
          {#snippet passwordField()}
            {@const field = useField(formController, 'password')}
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a secure password"
              />
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render passwordField()}

          <!-- Confirm Password Field -->
          {#snippet confirmPasswordField()}
            {@const field = useField(formController, 'confirmPassword')}
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render confirmPasswordField()}
        </div>
      </section>

      <!-- Profile Information -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <div class="space-y-4">
          <!-- Bio Field -->
          {#snippet bioField()}
            {@const field = useField(formController, 'profile.bio')}
            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                id="bio"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                rows="3"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about yourself (optional)"
              ></textarea>
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render bioField()}

          <!-- Website Field -->
          {#snippet websiteField()}
            {@const field = useField(formController, 'profile.website')}
            <div>
              <label for="website" class="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                id="website"
                value={field.value}
                on:input={(e) => {
                  const val = getInputValue(e)
                  field.handleInput(val)
                  field.handleChange(val)
                }}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://yourwebsite.com (optional)"
              />
              {#if field.hasErrors}
                <div class="text-red-500 text-sm mt-1">
                  {field.errors[0]}
                </div>
              {/if}
            </div>
          {/snippet}
          {@render websiteField()}
        </div>
      </section>

      <!-- Preferences -->
      <section>
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
        <div class="space-y-4">
          <!-- Newsletter Checkbox -->
          {#snippet newsletterField()}
            {@const field = useField(formController, 'preferences.newsletter')}
            <div class="flex items-center">
              <input
                type="checkbox"
                id="newsletter"
                checked={field.value}
                on:change={(e) => field.handleChange(getInputValue(e))}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="newsletter" class="ml-2 block text-sm text-gray-900">
                Subscribe to newsletter
              </label>
            </div>
          {/snippet}
          {@render newsletterField()}

          <!-- Notifications Checkbox -->
          {#snippet notificationsField()}
            {@const field = useField(formController, 'preferences.notifications')}
            <div class="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={field.value}
                on:change={(e) => field.handleChange(getInputValue(e))}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="notifications" class="ml-2 block text-sm text-gray-900">
                Enable notifications
              </label>
            </div>
          {/snippet}
          {@render notificationsField()}
        </div>
      </section>

      <!-- Contacts Array -->
      <section>
        <div>
          <h2 class="mb-2 flex items-center justify-between">
            <div class="text-xl font-semibold text-gray-900" style="margin-top: 0">Emergency Contacts</div>
            <button
              type="button"
              on:click={contacts.arrayAppend}
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Add Contact
            </button>
          </h2>
          {#if contacts.errors[0]}
            <div class="text-red-500 text-sm mb-4">
              {contacts.errors[0]}
            </div>
          {/if}
          <div class="space-y-4">
            {#each contacts.items as contact, index (index)}
              <div class="border border-gray-200 rounded-lg p-4 space-y-4">
                <div class="flex justify-between items-center">
                  <h4 class="font-medium text-gray-900">Contact {index + 1}</h4>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      on:click={() => contacts.arrayMoveUp(index)}
                      disabled={index === 0}
                      class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >↑</button>
                    <button
                      type="button"
                      on:click={() => contacts.arrayMoveDown(index)}
                      disabled={index === contacts.items.length - 1}
                      class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >↓</button>
                    <button
                      type="button"
                      on:click={() => contacts.arrayRemove(index)}
                      class="text-red-600 hover:text-red-800 text-sm"
                    >Remove</button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Contact Name -->
                  {#snippet contactNameField()}
                    {@const field = useField(formController, `contacts.${index}.name`)}
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={field.value}
                        on:input={(e) => {
                          const val = getInputValue(e)
                          field.handleInput(val)
                          field.handleChange(val)
                        }}
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {#if field.hasErrors}
                        <div class="text-red-500 text-sm mt-1">
                          {field.errors[0]}
                        </div>
                      {/if}
                    </div>
                  {/snippet}
                  {@render contactNameField()}

                  <!-- Contact Email -->
                  {#snippet contactEmailField()}
                    {@const field = useField(formController, `contacts.${index}.email`)}
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={field.value}
                        on:input={(e) => {
                          const val = getInputValue(e)
                          field.handleInput(val)
                          field.handleChange(val)
                        }}
                        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {#if field.hasErrors}
                        <div class="text-red-500 text-sm mt-1">
                          {field.errors[0]}
                        </div>
                      {/if}
                    </div>
                  {/snippet}
                  {@render contactEmailField()}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </section>

      <!-- Form Actions -->
      <div class="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          on:click={handleReset}
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
