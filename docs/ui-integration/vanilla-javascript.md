<script setup>
import VanillaJs from '../.vitepress/examples/VanillaJs.vue'
</script>

# Vanilla JavaScript Integration

This example demonstrates a complete form implementation using EncolaJS Form Controller with vanilla JavaScript and EncolaJS Validator. The example uses a scalable, path-based approach for handling form fields and error display.

<ClientOnly>
    <LiveDemo :component="VanillaJs"></LiveDemo>
</ClientOnly>

> [!WARNING]
> The code below is for demo purposes only to showcase how you can implement responding to reactivity of the `formController`
> You should create an abstraction that is reusable based on project specifics.
> For example instead of binding events to the body you would bind them to the form, repeatable fields would be manipulated instead of being re-rendered etc.

> [!INFO]
> The code contains comments that explain the logic behind various decisions.

:::code-group

```js [Javascript]
// Import dependencies (replace with actual CDN URLs or local files)
import { FormController, PlainObjectDataSource, effect /* exported from alien-signals */ } from '@encolajs/form-controller'
import { createEncolaAdapterFromRules } from '@encolajs/form-controller/encola'
import { ValidatorFactory } from '@encolajs/validator'

// Create validator factory
const validatorFactory = new ValidatorFactory()

const userRules = {
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

// Define custom error messages
const customMessages = {
  'password:matches': 'Password must contain at least one digit, one small letter and on capital letter',
  'contacts.*.name:required': 'Contact name is required',
  'contacts.*.email:required': 'Contact email is required',
}

const validator = createEncolaAdapterFromRules(validatorFactory, userRules, customMessages)

// We assume the form is pre-populated by the server
// so we don't need to populate the datasource
// However this means that the datasource would be empty
// so we would need to retrieve the values from the DOM
// which is beyond the scope of this example
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
  },
  contacts: []
})

// initialize the controller
const form = new FormController(dataSource, validator)

// Make form globally available for debugging
window.form = form

// DOM utility functions
function getErrorContainer(fieldPath) {
    return document.querySelector(`[data-error="${fieldPath}"]`)
}

function updateFieldValue(fieldPath, value, options = {}) {
    form.setValue(fieldPath, value, options).catch(console.error)
}

function updateErrorDisplay(fieldPath, errors) {
    const container = getErrorContainer(fieldPath)
    if (!container) return

    container.innerHTML = errors.length > 0
        ? `<div class="text-red-500 text-sm">${errors[0]}</div>`
        : ''
}

function updateFormState() {
    // Update form-level state indicators
    const isDirtyElement = document.querySelector('[data-form-dirty]')
    const isTouchedElement = document.querySelector('[data-form-touched]')
    const isValidElement = document.querySelector('[data-form-valid]')

    if (isDirtyElement) {
        isDirtyElement.textContent = form.isDirty() ? 'Has Changes' : 'No Changes'
        isDirtyElement.className = form.isDirty()
            ? 'text-orange-600 font-medium'
            : 'text-gray-500'
    }

    if (isTouchedElement) {
        isTouchedElement.textContent = form.isTouched() ? 'Touched' : 'Untouched'
    }

    if (isValidElement) {
        isValidElement.textContent = form.isValid() ? 'Valid' : 'Invalid'
        isValidElement.className = form.isValid()
            ? 'text-green-600 font-medium'
            : 'text-red-600 font-medium'
    }
}

function handleFieldChange(event) {
    const element = event.target
    const fieldPath = event.target.getAttribute('name')

    if (!fieldPath) return

    let value = element.value

    // Handle different input types
    if (element.type === 'checkbox') {
        value = element.checked
    } else if (element.type === 'number') {
        value = element.value === '' ? undefined : Number(element.value)
    }

    // handle `input` and `change` events differently to improve the UX
    updateFieldValue(fieldPath, value, {
        touched: event.type === 'input',
        dirty: event.type === 'change',
    })
}

function handleArrayAction(event) {
    const action = event.target.dataset.arrayAction
    const arrayPath = event.target.dataset.arrayPath
    const index = event.target.dataset.arrayIndex

    if (!action || !arrayPath) return

    switch (action) {
        case 'add':
            const newItem = getDefaultArrayItem(arrayPath)
            form.arrayAdd(arrayPath, newItem).catch(console.error)
            break

        case 'remove':
            if (index !== undefined) {
                form.arrayRemove(arrayPath, parseInt(index)).catch(console.error)
            }
            break

        case 'move-up':
            if (index !== undefined && index > 0) {
                form.arrayMove(arrayPath, parseInt(index), parseInt(index) - 1).catch(console.error)
            }
            break

        case 'move-down':
            if (index !== undefined) {
                const array = form.getValue(arrayPath)
                if (Array.isArray(array) && index < array.length - 1) {
                    form.arrayMove(arrayPath, parseInt(index), parseInt(index) + 1).catch(console.error)
                }
            }
            break
    }
}

function getDefaultArrayItem(arrayPath) {
    // Return default items based on array path
    switch (arrayPath) {
        case 'contacts':
            return { name: '', email: '' }
        default:
            return {}
    }
}

function handleFormSubmit(event) {
    event.preventDefault()

    form.submit().then(success => {
        if (success) {
            alert('Form submitted successfully!')
            console.log('Form data:', form.getValues())
        } else {
            alert('Please fix the errors before submitting')
        }
    }).catch(console.error)
}

function handleFormReset(event) {
    event.preventDefault()
    form.reset()
    // Manually trigger re-render of dynamic content
    renderContactsList()
}

// Dynamic content rendering
function renderContactsList() {
    const container = document.querySelector('[data-contacts-list]')
    if (!container) return

    const contacts = form.getValue('contacts') || []

    container.innerHTML = contacts.map((contact, index) => `
        <div class="border border-gray-200 rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="font-medium text-gray-900">Contact ${index + 1}</h4>
                <div class="flex gap-2">
                    <button type="button"
                            data-array-action="move-up"
                            data-array-path="contacts"
                            data-array-index="${index}"
                            class="text-blue-600 hover:text-blue-800 text-sm"
                            ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button"
                            data-array-action="move-down"
                            data-array-path="contacts"
                            data-array-index="${index}"
                            class="text-blue-600 hover:text-blue-800 text-sm"
                            ${index === contacts.length - 1 ? 'disabled' : ''}>↓</button>
                    <button type="button"
                            data-array-action="remove"
                            data-array-path="contacts"
                            data-array-index="${index}"
                            class="text-red-600 hover:text-red-800 text-sm">Remove</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text"
                           name="contacts.${index}.name"
                           value="${contact.name || ''}"
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <div data-error="contacts.${index}.name"></div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email"
                           name="contacts.${index}.email"
                           value="${contact.email || ''}"
                           class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <div data-error="contacts.${index}.email"></div>
                </div>
            </div>
        </div>
    `).join('')
}

// Scalable solution - automatically handles any field without manual setup
function setupAutoReactivity() {
    // Form-level state reactivity
    effect(() => {
        updateFormState()
    })

    // Automatic error display for ALL error containers in the DOM
    effect(() => {
        // Subscribe to any error changes
        form.errorsChanged()

        // Find all error containers and update them
        const errorContainers = document.querySelectorAll('[data-error]')
        errorContainers.forEach(container => {
            const fieldPath = container.getAttribute('data-error')
            if (fieldPath) {
                const field = form.field(fieldPath)
                const errors = field.errors()
                updateErrorDisplay(fieldPath, errors)
            }
        })
    })

    // Data change reactivity for dynamic content (arrays, etc.)
    effect(() => {
        form.dataChanged() // Subscribe to data changes
        renderContactsList()
    })
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Setup event delegation
    document.addEventListener('input', handleFieldChange)
    document.addEventListener('change', handleFieldChange)
    document.addEventListener('click', handleArrayAction)

    // Setup form handlers
    document.querySelector('form').addEventListener('submit', handleFormSubmit)
    document.querySelector('[data-reset]').addEventListener('click', handleFormReset)

    // Setup automatic reactivity
    setupAutoReactivity()

    // Initial render
    renderContactsList()
    updateFormState()
})
```

```html [HTML]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EncolaJS Form Controller - Vanilla JS Example</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
        // check the script tab
    </script>
</head>
<body class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-lg shadow-lg p-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">User Registration Form</h1>
                <p class="text-gray-600">Complete form with Zod validation and reactive state management</p>

                <!-- Form State Indicators -->
                <div class="mt-4 flex gap-4 text-sm">
                    <span>Status: <span data-form-dirty class="font-medium">No Changes</span></span>
                    <span>Touched: <span data-form-touched class="font-medium">Untouched</span></span>
                    <span>Valid: <span data-form-valid class="font-medium">Invalid</span></span>
                </div>
            </div>

            <form class="space-y-8">
                <!-- Basic Information -->
                <section>
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text"
                                   id="name"
                                   name="name"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter your full name">
                            <div data-error="name"></div>
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email"
                                   id="email"
                                   name="email"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Enter your email">
                            <div data-error="email"></div>
                        </div>

                        <div>
                            <label for="age" class="block text-sm font-medium text-gray-700">Age</label>
                            <input type="number"
                                   id="age"
                                   name="age"
                                   min="18"
                                   max="120"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <div data-error="age"></div>
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
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Create a secure password">
                            <div data-error="password"></div>
                        </div>

                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                            <input type="password"
                                   id="confirmPassword"
                                   name="confirmPassword"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="Confirm your password">
                            <div data-error="confirmPassword"></div>
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
                                      rows="3"
                                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Tell us about yourself (optional)"></textarea>
                            <div data-error="profile.bio"></div>
                        </div>

                        <div>
                            <label for="website" class="block text-sm font-medium text-gray-700">Website</label>
                            <input type="url"
                                   id="website"
                                   name="profile.website"
                                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                   placeholder="https://yourwebsite.com (optional)">
                            <div data-error="profile.website"></div>
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
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label for="newsletter" class="ml-2 block text-sm text-gray-900">
                                Subscribe to newsletter
                            </label>
                        </div>

                        <div class="flex items-center">
                            <input type="checkbox"
                                   id="notifications"
                                   name="preferences.notifications"
                                   checked
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
                                data-array-action="add"
                                data-array-path="contacts"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm">
                            Add Contact
                        </button>
                    </div>

                    <div data-contacts-list class="space-y-4">
                        <!-- Dynamic contact list will be rendered here -->
                    </div>
                </section>

                <!-- Form Actions -->
                <div class="flex justify-between pt-6 border-t border-gray-200">
                    <button type="button"
                            data-reset
                            class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md">
                        Reset Form
                    </button>

                    <button type="submit"
                            data-submit
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