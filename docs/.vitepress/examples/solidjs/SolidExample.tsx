import useForm, { FormController, PlainObjectDataSource } from '../../../../src/'
import { createEncolaValidatorFromRules } from '../../../../encola'
import { ValidatorFactory } from '@encolajs/validator'
import { useFormController } from './useFormController'
import { useField } from './useField'
import { useArrayField } from './useArrayField'
import { For } from 'solid-js'

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

// Field Component
function Field(props) {
  const field = useField(props.controller, props.name)

  return (
    <div>
      <label for={props.name} class="block text-sm font-medium text-gray-700">
        {props.label}
      </label>
      {props.type === 'textarea' ? (
        <textarea
          id={props.name}
          value={field.value() || ''}
          onInput={(e) => {
            const val = getInputValue(e)
            field.handleInput(val)
            field.handleChange(val)
          }}
          rows={props.rows}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder={props.placeholder}
        />
      ) : (
        <input
          type={props.type || 'text'}
          id={props.name}
          value={field.value() || ''}
          checked={props.type === 'checkbox' ? field.value() : undefined}
          onInput={(e) => {
            const val = getInputValue(e)
            field.handleInput(val)
            field.handleChange(val)
          }}
          min={props.min}
          max={props.max}
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder={props.placeholder}
        />
      )}
      {field.hasErrors() && (
        <div class="text-red-500 text-sm mt-1">
          {field.errors()[0]}
        </div>
      )}
    </div>
  )
}

// Checkbox Component
function Checkbox(props) {
  const field = useField(props.controller, props.name)

  return (
    <div class="flex items-center">
      <input
        type="checkbox"
        id={props.name}
        checked={field.value() || false}
        onChange={(e) => field.handleChange(getInputValue(e))}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label for={props.name} class="ml-2 block text-sm text-gray-900">
        {props.label}
      </label>
    </div>
  )
}

// Contact Array Component
function ContactsArray(props) {
  const contactDefault = { name: '', email: '' }
  const contacts = useArrayField(props.controller, 'contacts', contactDefault)

  return (
    <div>
      <h2 class="mb-2 flex items-center justify-between">
        <div class="text-xl font-semibold text-gray-900" style="margin-top: 0">
          Emergency Contacts
        </div>
        <button
          type="button"
          onClick={contacts.arrayAppend}
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Add Contact
        </button>
      </h2>
      {contacts.errors()[0] && (
        <div class="text-red-500 text-sm mb-4">
          {contacts.errors()[0]}
        </div>
      )}
      <div class="space-y-4">
        <For each={contacts.items()}>
          {(contact, index) => (
            <div class="border border-gray-200 rounded-lg p-4 space-y-4">
              <div class="flex justify-between items-center">
                <h4 class="font-medium text-gray-900">Contact {index() + 1}</h4>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick={() => contacts.arrayMoveUp(index())}
                    disabled={index() === 0}
                    class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => contacts.arrayMoveDown(index())}
                    disabled={index() === contacts.items().length - 1}
                    class="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => contacts.arrayRemove(index())}
                    class="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  controller={props.controller}
                  name={`contacts.${index()}.name`}
                  label="Name"
                  type="text"
                />
                <Field
                  controller={props.controller}
                  name={`contacts.${index()}.email`}
                  label="Email"
                  type="email"
                />
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

// Main Form Component
export default function SolidExample() {
  // Create data source and validator
  const dataSource = new PlainObjectDataSource(initialValues)
  const validator = createEncolaValidatorFromRules(validatorFactory, rules, messages)
  const formController = useForm(dataSource, validator)

  // Create form state
  const form = useFormController(formController)

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

  return (
    <div class="bg-gray-100 min-h-screen p-4">
      <div class="mb-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
          <p class="text-gray-600">Complete form with EncolaJS Validator and SolidJS signals</p>

          {/* Form State Indicators */}
          <div class="mt-4 flex gap-4 text-sm">
            <span>
              Status:{' '}
              <span class={form.state.isDirty ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                {form.state.isDirty ? 'Has Changes' : 'No Changes'}
              </span>
            </span>
            <span>
              Touched: <span class="font-medium">{form.state.isTouched ? 'Touched' : 'Untouched'}</span>
            </span>
            <span>
              Valid:{' '}
              <span class={form.state.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {form.state.isValid ? 'Valid' : 'Invalid'}
              </span>
            </span>
          </div>
        </div>

        <form class="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                controller={form.controller}
                name="name"
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
              />
              <Field
                controller={form.controller}
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
              />
              <Field
                controller={form.controller}
                name="age"
                label="Age"
                type="number"
                min={18}
                max={120}
              />
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Security</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                controller={form.controller}
                name="password"
                label="Password"
                type="password"
                placeholder="Create a secure password"
              />
              <Field
                controller={form.controller}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
              />
            </div>
          </section>

          {/* Profile Information */}
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div class="space-y-4">
              <Field
                controller={form.controller}
                name="profile.bio"
                label="Bio"
                type="textarea"
                rows={3}
                placeholder="Tell us about yourself (optional)"
              />
              <Field
                controller={form.controller}
                name="profile.website"
                label="Website"
                type="url"
                placeholder="https://yourwebsite.com (optional)"
              />
            </div>
          </section>

          {/* Preferences */}
          <section>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
            <div class="space-y-4">
              <Checkbox
                controller={form.controller}
                name="preferences.newsletter"
                label="Subscribe to newsletter"
              />
              <Checkbox
                controller={form.controller}
                name="preferences.notifications"
                label="Enable notifications"
              />
            </div>
          </section>

          {/* Contacts Array */}
          <section>
            <ContactsArray controller={form.controller} />
          </section>

          {/* Form Actions */}
          <div class="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
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
  )
}
