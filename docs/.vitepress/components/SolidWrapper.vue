<template>
  <div ref="containerRef"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  component: {
    type: Function,
    required: true
  },
  props: {
    type: Object,
    default: () => ({})
  }
})

const containerRef = ref(null)
let dispose = null

const mountSolidComponent = async () => {
  if (containerRef.value && props.component) {
    // Dynamically import Solid's render function
    const { render } = await import('solid-js/web')

    // Render Solid component
    dispose = render(
      () => props.component(props.props),
      containerRef.value
    )
  }
}

const unmountSolidComponent = () => {
  if (dispose) {
    dispose()
    dispose = null
  }
}

onMounted(() => {
  mountSolidComponent()
})

onUnmounted(() => {
  unmountSolidComponent()
})

// Watch for component or props changes
watch(() => [props.component, props.props], () => {
  unmountSolidComponent()
  mountSolidComponent()
}, { deep: true })
</script>
