<script setup>
import { ref, onMounted } from 'vue'
import SvelteWrapper from '../components/SvelteWrapper.vue'

const SvelteExample = ref(null)
const error = ref(null)

onMounted(async () => {
  try {
    // Dynamically import Svelte component (client-side only)
    const module = await import('./svelte/SvelteExample.svelte')
    SvelteExample.value = module.default
  } catch (e) {
    console.error('Failed to load Svelte component:', e)
    error.value = e.message
  }
})
</script>

<template>
  <ClientOnly>
    <div v-if="error" class="error">
      Failed to load Svelte example: {{ error }}
    </div>
    <SvelteWrapper v-else-if="SvelteExample" :component="SvelteExample" />
    <div v-else>Loading Svelte example...</div>
  </ClientOnly>
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
