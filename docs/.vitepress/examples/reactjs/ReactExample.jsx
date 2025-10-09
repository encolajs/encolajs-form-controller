import React, { useMemo } from 'react'
import useForm, { FormController, PlainObjectDataSource } from '../../../../src/'
import { createEncolaValidatorFromRules } from '../../../../encola'
import { ValidatorFactory } from '@encolajs/validator'
import { useFormController } from './useFormController.jsx'
import { useField } from './useField.jsx'
import { useArrayField } from './useArrayField.jsx'

// Input helper
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
function Field({ controller, name, label, type = 'text', placeholder, rows, min, max }) {
  const { value, errors, hasErrors, handleInput, handleChange } = useField(controller, name)

  const InputComponent = type === 'textarea' ? 'textarea' : 'input'

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <InputComponent
        type={type !== 'textarea' ? type : undefined}
        id={name}
        value={value || ''}
        checked={type === 'checkbox' ? value : undefined}
        onChange={(e) => {
          const val = getInputValue(e)
          handleInput(val)
          handleChange(val)
        }}
        rows={rows}
        min={min}
        max={max}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
      {hasErrors && (
        <div className="text-red-500 text-sm mt-1">
          {errors[0]}
        </div>
      )}
    </div>
  )
}

// Checkbox Component
function Checkbox({ controller, name, label }) {
  const { value, handleChange } = useField(controller, name)

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={name}
        checked={value || false}
        onChange={(e) => handleChange(getInputValue(e))}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
        {label}
      </label>
    </div>
  )
}

// Contact Array Component
function ContactsArray({ controller }) {
  const contactDefault = { name: '', email: '' }
  const { items, errors, arrayAppend, arrayRemove, arrayMoveUp, arrayMoveDown } = useArrayField(
    controller,
    'contacts',
    contactDefault
  )

  return (
    <div>
      <h2 className="mb-2 flex items-center justify-between">
        <div className="text-xl font-semibold text-gray-900" style={{ marginTop: 0 }}>
          Emergency Contacts
        </div>
        <button
          type="button"
          onClick={arrayAppend}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Add Contact
        </button>
      </h2>
      {errors.length > 0 && (
        <div className="text-red-500 text-sm mb-4">
          {errors[0]}
        </div>
      )}
      <div className="space-y-4">
        {items.map((contact, index) => (
          <div
            key={`contact-${index}`}
            className="border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Contact {index + 1}</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => arrayMoveUp(index)}
                  disabled={index === 0}
                  className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => arrayMoveDown(index)}
                  disabled={index === items.length - 1}
                  className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => arrayRemove(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                controller={controller}
                name={`contacts.${index}.name`}
                label="Name"
                type="text"
              />
              <Field
                controller={controller}
                name={`contacts.${index}.email`}
                label="Email"
                type="email"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Form Component
export default function ReactExample() {
  // Create form controller with memoization
  const { dataSource, validator } = useMemo(() => {
    const validatorFactory = new ValidatorFactory()

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

    const messages = {
      'password:matches': 'Password must contain at least one digit, one small letter and one capital letter',
      'contacts.*.name:required': 'Contact name is required',
      'contacts.*.email:required': 'Contact email is required',
    }

    return {
      dataSource: new PlainObjectDataSource(initialValues),
      validator: createEncolaValidatorFromRules(validatorFactory, rules, messages)
    }
  }, [])

  const formController = useMemo(() => {
    return useForm(dataSource, validator)
  }, [dataSource, validator])

  const { state, methods, controller } = useFormController(formController)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await methods.submit()
    if (success) {
      alert('Form submitted successfully!')
      console.log('Form data:', methods.getValue())
    } else {
      alert('Please fix the errors before submitting')
    }
  }

  const handleReset = () => {
    methods.reset()
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="mb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
          <p className="text-gray-600">Complete form with EncolaJS Validator and React hooks</p>

          {/* Form State Indicators */}
          <div className="mt-4 flex gap-4 text-sm">
            <span>
              Status:{' '}
              <span className={state.isDirty ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                {state.isDirty ? 'Has Changes' : 'No Changes'}
              </span>
            </span>
            <span>
              Touched: <span className="font-medium">{state.isTouched ? 'Touched' : 'Untouched'}</span>
            </span>
            <span>
              Valid:{' '}
              <span className={state.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {state.isValid ? 'Valid' : 'Invalid'}
              </span>
            </span>
          </div>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                controller={controller}
                name="name"
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
              />
              <Field
                controller={controller}
                name="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
              />
              <Field
                controller={controller}
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                controller={controller}
                name="password"
                label="Password"
                type="password"
                placeholder="Create a secure password"
              />
              <Field
                controller={controller}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
              />
            </div>
          </section>

          {/* Profile Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="space-y-4">
              <Field
                controller={controller}
                name="profile.bio"
                label="Bio"
                type="textarea"
                rows={3}
                placeholder="Tell us about yourself (optional)"
              />
              <Field
                controller={controller}
                name="profile.website"
                label="Website"
                type="url"
                placeholder="https://yourwebsite.com (optional)"
              />
            </div>
          </section>

          {/* Preferences */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
            <div className="space-y-4">
              <Checkbox
                controller={controller}
                name="preferences.newsletter"
                label="Subscribe to newsletter"
              />
              <Checkbox
                controller={controller}
                name="preferences.notifications"
                label="Enable notifications"
              />
            </div>
          </section>

          {/* Contacts Array */}
          <section>
            <ContactsArray controller={controller} />
          </section>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
            >
              Reset Form
            </button>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
