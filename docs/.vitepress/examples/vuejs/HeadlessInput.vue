<script setup>
import { inject, ref, computed } from 'vue'
import {effect} from "alien-signals";

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const formController = inject('formController')

// Computed properties for this specific field
const value = ref(formController.getValue(props.name))

const errors = computed(() => {
  return formController.getErrors(props.name)
})

const hasErrors = computed(() => {
  return formController.getErrors()[props.name]?.length
})

effect(() => {
  formController.dataChanged()
  console.log('dataChanged effect', props.name);
  value.value = formController.getValue(props.name)
})

// Handle input for touched state
const handleInput = (inputValue) => {
  formController.setValue(props.name, inputValue, {
    touched: true,
    dirty: false
  })
}

// Handle change for dirty state
const handleChange = (inputValue) => {
  formController.setValue(props.name, inputValue, {
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
