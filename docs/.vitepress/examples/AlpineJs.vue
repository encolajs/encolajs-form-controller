<script setup>
import createForm, { FormController, PlainObjectDataSource, effect } from '../../../src/'
import { createEncolaValidatorFromRules } from '../../../encola'
import { ValidatorFactory } from '@encolajs/validator'
import {onMounted} from 'vue'
import contents from './alpinejs.html?raw'

let Alpine = {}

// Create global validator factory
const validatorFactory = new ValidatorFactory()

onMounted(async () => {
  // Dynamically import Alpine.js only in the browser
  const alpineModule = await import('alpinejs')
  Alpine = alpineModule.Alpine

  // Register Alpine.js component for form handling
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
      errors: formController.getErrors(),

      // Form data (reactive)
      formValues: formController.getValues(),

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

      // Get errors for a specific field
      getValue(fieldPath, defaultValue) {
        return this.formValues[fieldPath] || defaultValue
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
        formController.arrayAppend(arrayPath, {...newItem}).catch(console.error)
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

  // we have to do it this way because the Alpine's syntax
  // is not compatible with Vue's template parsing engine
  document.getElementById('alpine-example').innerHTML = contents
  window.setTimeout(() => {
    Alpine.start()
  }, 500)
})
</script>

<template>
  <div id="alpine-example" />
</template>