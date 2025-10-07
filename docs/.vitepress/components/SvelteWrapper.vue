<template>
  <div ref="containerRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { mount, unmount } from 'svelte'

const props = defineProps({
  component: {
    type: Object,
    required: true
  },
  props: {
    type: Object,
    default: () => ({})
  }
})

const containerRef = ref(null)
let svelteInstance = null

const mountSvelteComponent = () => {
  if (containerRef.value && props.component) {
    // Mount Svelte 5 component using mount function
    svelteInstance = mount(props.component, {
      target: containerRef.value,
      props: props.props
    })
  }
}

const unmountSvelteComponent = () => {
  if (svelteInstance && containerRef.value) {
    // Unmount Svelte 5 component
    unmount(svelteInstance)
    svelteInstance = null
  }
}

onMounted(() => {
  mountSvelteComponent()
})

onUnmounted(() => {
  unmountSvelteComponent()
})

// Watch for component or props changes
watch(() => [props.component, props.props], () => {
  unmountSvelteComponent()
  mountSvelteComponent()
}, { deep: true })
</script>
