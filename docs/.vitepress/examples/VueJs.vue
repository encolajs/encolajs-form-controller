<script setup>
import { PlainObjectDataSource } from '../../../src/'
import { createEncolaAdapterFromRules } from '../../../encola'
import { ValidatorFactory } from '@encolajs/validator'
import HeadlessForm from './vuejs/HeadlessForm.vue'
import HeadlessInput from './vuejs/HeadlessInput.vue'
import HeadlessRepeatable from './vuejs/HeadlessRepeatable.vue'

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
const validator = createEncolaAdapterFromRules(validatorFactory, rules, messages)

// Default item for contacts array
const contactDefault = { name: '', email: '' }

// Handle form submission
const handleSubmit = async (controller) => {
  const success = await controller.submit()
  if (success) {
    alert('Form submitted successfully!')
    console.log('Form data:', controller.getValue())
  } else {
    alert('Please fix the errors before submitting')
  }
}

// Handle form reset
const handleReset = (controller) => {
  controller.reset()
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
  <HeadlessForm :data-source="dataSource" :validator="validator" v-slot="{ state, controller }">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
          <p class="text-gray-600">Complete form with EncolaJS Validator and VueJS headless components</p>

          <!-- Form State Indicators -->
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

        <form class="space-y-8" @submit.prevent="handleSubmit(controller)">
          <!-- Basic Information -->
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            {{dataSource.get('name')}}
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
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                  <div v-if="hasErrors" class="text-red-500 text-sm mt-1">
                    {{ errors[0] }}
                  </div>
                </div>
              </HeadlessInput>

              <!-- Age Field -->
              <HeadlessInput name="age" v-slot="{ value, errors, hasErrors, handleInput, handleChange }">
                <div>
                  <label for="age" class="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    id="age"
                    :value="value"
                    @input="handleInput(getInputValue($event))"
                    @change="handleChange(getInputValue($event))"
                    min="18"
                    max="120"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
              v-slot="{ items, arrayAdd, arrayRemove, arrayMoveUp, arrayMoveDown }"
            >
              <div>
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-semibold text-gray-900">Emergency Contacts</h2>
                  <button
                    type="button"
                    @click="arrayAdd"
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Add Contact
                  </button>
                </div>
{{items}}
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
                          class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >↑</button>
                        <button
                          type="button"
                          @click="arrayMoveDown(index)"
                          :disabled="index === items.length - 1"
                          class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              @click="handleReset(controller)"
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
