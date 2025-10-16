<script setup>
import { provide, reactive, onMounted, onUnmounted } from 'vue'
import createForm, { FormController } from '../../../../src/'
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
const formController = createForm(props.dataSource, props.validator)

// Reactive form state
const formState = reactive({
  isDirty: formController.isDirty(),
  isTouched: formController.isTouched(),
  isValid: formController.isValid()
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
