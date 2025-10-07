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
let root = null
let React = null
let ReactDOM = null

const mountReactComponent = async () => {
  if (containerRef.value && props.component) {
    // Dynamically import React and ReactDOM to avoid bundling issues
    if (!React || !ReactDOM) {
      React = await import('react')
      ReactDOM = await import('react-dom/client')
    }

    // Create React element using createElement
    const element = React.createElement(props.component, props.props)

    // Create root and render
    root = ReactDOM.createRoot(containerRef.value)
    root.render(element)
  }
}

const unmountReactComponent = () => {
  if (root) {
    root.unmount()
    root = null
  }
}

onMounted(() => {
  mountReactComponent()
})

onUnmounted(() => {
  unmountReactComponent()
})

// Watch for component or props changes
watch(() => [props.component, props.props], () => {
  unmountReactComponent()
  mountReactComponent()
}, { deep: true })
</script>
