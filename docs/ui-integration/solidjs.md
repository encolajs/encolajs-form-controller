<script setup>
import SolidJs from '../.vitepress/examples/SolidJs.vue'
</script>

# SolidJS Integration

This example demonstrates a complete form implementation using EncolaJS Form Controller with SolidJS. The example uses SolidJS's fine-grained reactivity system with signals and effects to integrate the FormController seamlessly.

<ClientOnly>
    <LiveDemo :component="SolidJs"></LiveDemo>
</ClientOnly>

> [!WARNING] The "Contacts section is not working because I am not familiar with SolidJS. <br>
> If you know SolidJS and you are willing to help me, please <a href="https://github.com/encolajs/encolajs-form-controller/tree/main/docs/.vitepress/examples/solidjs/useArrayField.tsx">send me a PR</a>


## SolidJS Signals Integration

The SolidJS integration uses SolidJS's signals and effects to bridge between the FormController's signal-based reactivity and Solid's reactive primitives. This approach provides excellent performance with minimal overhead.

::: code-group

<<< @/.vitepress/examples/solidjs/SolidExample.tsx

<<< @/.vitepress/examples/solidjs/useFormController.tsx

<<< @/.vitepress/examples/solidjs/useField.tsx

<<< @/.vitepress/examples/solidjs/useArrayField.tsx

:::

### SolidJS Signals

SolidJS uses signals as its primitive for reactivity. The integration uses:

- **`createSignal()`** - Creates reactive state that automatically tracks dependencies
- **`createEffect()`** - Runs side effects when dependencies change
- **`onCleanup()`** - Cleans up effects when components unmount
- **Getters** - Used to expose reactive state from composable functions

### Reactivity with alien-signals

The integration uses `alien-signals` effects to bridge between the FormController's signal-based reactivity and SolidJS's signals. When the FormController's signals change, SolidJS signals are updated, triggering fine-grained DOM updates.

**Field-specific Change Tracking**: Each field has its own `valueUpdated()` method that returns an incrementing number when the field's value changes. Field composables subscribe only to their specific field's changes using `field.valueUpdated()`, preventing unnecessary re-renders when unrelated fields change. This is much more efficient than watching a global data change signal.

### Composable Functions

The integration provides three main composable functions:

- **`useFormController()`** - Creates form-level state, subscribes to form changes, exposes form methods
- **`useField()`** - Manages individual field state, subscribes to field-specific changes, provides input handlers
- **`useArrayField()`** - Manages array fields, subscribes to array changes, exposes array manipulation methods

### Fine-Grained Reactivity

SolidJS's fine-grained reactivity ensures that only the specific parts of the DOM that depend on changed signals are updated. This makes SolidJS one of the most performant reactive frameworks.

```tsx
const field = useField(formController, 'name')

// Only this specific input updates when the name field changes
<input value={field.value} />
```

### Automatic Cleanup

All composable functions use SolidJS's `onCleanup()` to properly dispose of alien-signals effects when components unmount, preventing memory leaks.

```tsx
const form = useFormController(formController)

// Cleanup happens automatically when component unmounts
onCleanup(() => {
  effects.forEach(dispose => dispose?.())
})
```

## Benefits of This Approach

1. **Fine-Grained Reactivity** - SolidJS's signal system provides optimal performance with minimal overhead
2. **Optimized Updates** - Field-specific subscriptions prevent unnecessary re-renders
3. **No Virtual DOM** - Direct DOM updates make SolidJS extremely fast
4. **Type Safety** - Full TypeScript support for type-safe form handling
5. **JSX Syntax** - Familiar syntax for React developers
6. **Composable** - Functions can be composed to build complex forms
7. **Automatic Cleanup** - `onCleanup` ensures proper resource disposal