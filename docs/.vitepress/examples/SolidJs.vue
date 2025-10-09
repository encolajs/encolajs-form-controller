<script setup>
import { ref, onMounted } from 'vue'
import SolidWrapper from '../components/SolidWrapper.vue'

const SolidExample = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    // Dynamically import SolidJS component (client-side only)
    const module = await import('./solidjs/SolidExample.tsx')
    SolidExample.value = module.default
  } catch (e) {
    console.error('Failed to load SolidJS component:', e)
    error.value = e.message
  }
})
</script>

<template>
  <SolidWrapper :component="SolidExample" />
</template>

<style scoped>
.error {
  color: red;
  padding: 1rem;
  border: 1px solid red;
  border-radius: 4px;
  margin: 1rem 0;
}
</style>
