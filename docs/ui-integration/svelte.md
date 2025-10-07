<script setup>
import Svelte from '../.vitepress/examples/Svelte.vue'
</script>

# Svelte Integration

This example demonstrates a complete form implementation using EncolaJS Form Controller with Svelte 5. The example uses Svelte 5's new runes API (`$state`, `$derived`, `$effect`) to integrate the FormController with Svelte's reactivity system.

<ClientOnly>
    <LiveDemo :component="Svelte"></LiveDemo>
</ClientOnly>

## Svelte 5 Runes Integration

The Svelte integration uses Svelte 5's runes API to bridge between the FormController's signal-based reactivity and Svelte's reactive state. This approach provides a clean, declarative API that feels natural in Svelte applications.

::: code-group

<<< @/.vitepress/examples/svelte/SvelteExample.svelte

<<< @/.vitepress/examples/svelte/useFormController.svelte.js

<<< @/.vitepress/examples/svelte/useField.svelte.js

<<< @/.vitepress/examples/svelte/useArrayField.svelte.js

:::

## Key Concepts

### Svelte 5 Runes

Svelte 5 introduces runes - a new API for declaring reactive state and effects. The integration uses:

- **`$state`** - Creates reactive state that automatically updates the UI when changed
- **`$derived`** - Creates derived values that automatically recompute when dependencies change
- **Getters** - Used to expose reactive state from composable functions

### Reactivity with alien-signals

The integration uses `alien-signals` effects to bridge between the FormController's signal-based reactivity and Svelte's state management. When signals change, the `$state` is updated, triggering Svelte's reactivity.

**Field-specific Change Tracking**: Each field has its own `valueUpdated()` method that returns an incrementing number when the field's value changes. Field composables subscribe only to their specific field's changes using `field.valueUpdated()`, preventing unnecessary re-renders when unrelated fields change. This is much more efficient than watching a global data change signal.

### Composable Functions

The integration provides three main composable functions:

- **`useFormController()`** - Creates form-level state, subscribes to form changes, exposes form methods
- **`useField()`** - Manages individual field state, subscribes to field-specific changes, provides input handlers
- **`useArrayField()`** - Manages array fields, subscribes to array changes, exposes array manipulation methods

### Snippets for Field Isolation

Svelte 5 snippets are used to create isolated scopes for each field. This ensures that each field's `useField()` call creates its own reactive state and effects, preventing interference between fields.

```svelte
{#snippet nameField()}
  {@const field = useField(formController, 'name')}
  <input value={field.value} on:input={(e) => field.handleChange(e.target.value)} />
{/snippet}
{@render nameField()}
```

### Cleanup

All composable functions return a `cleanup()` method that should be called in Svelte's `onDestroy()` lifecycle hook to properly dispose of alien-signals effects and prevent memory leaks.

```javascript
const form = useFormController(formController)

onDestroy(() => {
  form.cleanup()
})
```

## Benefits of This Approach

1. **Modern Svelte API** - Uses Svelte 5's new runes API for cleaner, more intuitive code
2. **Optimized Reactivity** - Field-specific subscriptions prevent unnecessary updates
3. **Composable** - Functions can be composed to build complex forms
4. **Type Safety** - Works seamlessly with TypeScript for type-safe form handling
5. **Clean Syntax** - Svelte's template syntax combined with runes provides very readable code
6. **Reusable Logic** - Composables can be reused across different projects and components