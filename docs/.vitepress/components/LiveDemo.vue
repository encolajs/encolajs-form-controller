<template>
  <div class="live-demo" ref="el">
    <div :is="component" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createApp, h } from 'vue'

const props = defineProps({
  component: String | Object,
})

const el = ref()

onMounted(() => {
  const app = createApp({
    render: () => h(props.component)
  })

  app.mount(el.value)

  onUnmounted(app.unmount)
})
</script>

<style>
.live-demo {
  all: revert !important;
}
</style>