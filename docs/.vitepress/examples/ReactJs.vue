<script setup>
import { ref, onMounted } from 'vue'
import ReactWrapper from '../components/ReactWrapper.vue'

const ReactExample = ref(null)

onMounted(async () => {
  // Dynamically import React component
  const module = await import('./reactjs/ReactExample.jsx')
  ReactExample.value = module.default
})
</script>

<template>
  <ReactWrapper v-if="ReactExample" :component="ReactExample" />
</template>
