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
const field = formController.field(props.name)

// Computed properties for this specific field
const value = ref(null)

const errors = ref([])

const hasErrors = computed(() => {
  return errors.value.length
})

effect(() => {
  field.valueUpdated()
  value.value = formController.getValue(props.name)
  errors.value = formController.getErrors()[props.name] || []
})

effect(() => {
  formController.errorsChanged()
  errors.value = formController.getErrors()[props.name] || []
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
