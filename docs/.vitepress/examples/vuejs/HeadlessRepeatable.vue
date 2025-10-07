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
const field = formController.field(props.name)

const items = ref([])
const itemsErrors = ref([])

const arrayAppend = () => {
  const newItem = { ...props.defaultItem }
  formController.arrayAppend(props.name, newItem).catch(console.error)
}

const arrayRemove = (index) => {
  formController.arrayRemove(props.name, index).catch(console.error)
}

const arrayMoveUp = (index) => {
  if (index > 0) {
    formController.arrayMove(props.name, index, index - 1).catch(console.error)
  }
}

const arrayMoveDown = (index) => {
  if (index < items.value.length - 1) {
    formController.arrayMove(props.name, index, index + 1).catch(console.error)
  }
}

effect(() => {
  field.valueUpdated()
  nextTick(() => {
    items.value = [...formController.getValue(props.name)]
  })
})

effect(() => {
  formController.errorsChanged()
  itemsErrors.value = formController.getErrors()[props.name] || []
})
</script>

<template>
  <div>

    <slot
      :items="items"
      :itemsErrors="itemsErrors"
      :arrayAppend="arrayAppend"
      :arrayRemove="arrayRemove"
      :arrayMoveUp="arrayMoveUp"
      :arrayMoveDown="arrayMoveDown"
    />
  </div>
</template>
