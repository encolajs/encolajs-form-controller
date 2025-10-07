<script setup>
import ReactJs from '../.vitepress/examples/ReactJs.vue'
</script>

# React Integration

This example demonstrates a complete form implementation using EncolaJS Form Controller with React. The example uses custom React hooks to integrate the FormController with React's component lifecycle and state management.

<ClientOnly>
    <LiveDemo :component="ReactJs"></LiveDemo>
</ClientOnly>

## React Hooks Architecture

The React integration uses custom hooks that bridge between the FormController's signal-based reactivity and React's state management. This approach provides a clean, declarative API that feels natural in React applications.

::: code-group

<<< @/.vitepress/examples/reactjs/ReactExample.jsx

<<< @/.vitepress/examples/reactjs/useFormController.jsx

<<< @/.vitepress/examples/reactjs/useField.jsx

<<< @/.vitepress/examples/reactjs/useArrayField.jsx

:::

### React Hooks Pattern

The React integration uses a hooks-based pattern that encapsulates form logic into reusable hooks. Each hook manages its own state and effects, providing a clean separation of concerns.

### Reactivity with alien-signals

The integration uses `alien-signals` effects inside React's `useEffect` to bridge between the FormController's signal-based reactivity and React's state management. When signals change, React state is updated, triggering component re-renders.

**Field-specific Change Tracking**: Each field has its own `valueUpdated()` method that returns an incrementing number when the field's value changes. Field hooks subscribe only to their specific field's changes using `field.valueUpdated()`, preventing unnecessary re-renders when unrelated fields change. This is much more efficient than watching a global data change signal.

### useMemo for Controller Creation

The FormController instance should be created once and memoized using `useMemo` to prevent unnecessary re-creation on each render. This is crucial for maintaining stable references and avoiding memory leaks from effect subscriptions.

### Hook Responsibilities

- **useFormController**: Creates form state, subscribes to form-level changes, exposes form methods
- **useField**: Manages individual field state, subscribes to field-specific changes, provides input handlers
- **useArrayField**: Manages array fields, subscribes to array changes, exposes array manipulation methods

## Benefits of This Approach

1. **Declarative API**: Hooks provide a clean, declarative way to integrate with FormController
2. **Optimized Reactivity**: Field-specific subscriptions prevent unnecessary re-renders
3. **Composable**: Hooks can be composed to build complex forms
4. **Framework Integration**: Properly integrates with React's lifecycle and state management
5. **Type Safety**: Works seamlessly with TypeScript for type-safe form handling
6. **Reusable Logic**: Hooks can be reused across different projects and components