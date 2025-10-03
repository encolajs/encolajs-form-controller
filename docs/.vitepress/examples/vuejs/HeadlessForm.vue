<script setup>
import { provide, reactive, onMounted, onUnmounted } from 'vue'
import { FormController } from '../../../../src/'
import { effect } from 'alien-signals'

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
const formController = new FormController(props.dataSource, props.validator)

// Reactive form state
const formState = reactive({
  isDirty: formController.isDirty(),
  isTouched: formController.isTouched(),
  isValid: formController.isValid(),
  errors: formController.getErrors(),
  values: formController.getValues()
})

// Provide form controller and methods to child components
provide('formController', formController)
provide('formState', formState)

// Setup reactivity with alien-signals effects
let effects = []

onMounted(() => {
  // Form-level state reactivity
  effects.push(effect(() => {
    formState.isDirty = formController.isDirty()
    formState.isTouched = formController.isTouched()
    formState.isValid = formController.isValid()
  }))

  // Error reactivity
  effects.push(effect(() => {
    formController.errorsChanged()
    formState.errors = { ...formController.getErrors() }
  }))

  // Data change reactivity
  effects.push(effect(() => {
    formController.dataChanged()
    formState.values = { ...formController.getValues() }
  }))
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
    :controller="formController"
  />
</template>
