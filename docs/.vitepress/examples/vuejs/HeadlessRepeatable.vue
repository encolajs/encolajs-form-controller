<script setup>
import { inject, ref, nextTick } from 'vue'
import {effect} from "alien-signals";

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  defaultItem: {
    type: Object,
    default: () => ({})
  }
})

const formController = inject('formController')

// Get array items
const items = ref([])

// Array manipulation methods
const arrayAdd = () => {
  const newItem = { ...props.defaultItem }
  formController.arrayAdd(props.name, newItem).catch(console.error)
  formController.dataChanged()
}

const arrayRemove = (index) => {
  formController.arrayRemove(props.name, index).catch(console.error)
  formController.dataChanged()
}

const arrayMoveUp = (index) => {
  if (index > 0) {
    formController.arrayMove(props.name, index, index - 1).catch(console.error)
    formController.dataChanged()
  }
}

const arrayMoveDown = (index) => {
  if (index < items.value.length - 1) {
    formController.arrayMove(props.name, index, index + 1).catch(console.error)
    formController.dataChanged()
  }
}

effect(() => {
  formController.dataChanged()
  nextTick(() => {
    items.value = [...formController.getValue(props.name)]
  })
})
</script>

<template>
  <div>
    sss
  {{items}}
  <slot
    :items="items"
    :arrayAdd="arrayAdd"
    :arrayRemove="arrayRemove"
    :arrayMoveUp="arrayMoveUp"
    :arrayMoveDown="arrayMoveDown"
  />
  </div>
</template>
