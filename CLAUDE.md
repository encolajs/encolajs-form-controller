# CLAUDE.md

## Project Overview
Framework-agnostic form state management library using `alien-signals` for reactivity. Provides reactive form controllers that work with Vue, React, Alpine.js, or vanilla JavaScript through a unified API.

## Architecture
- **Core**: FormController class with alien-signals reactivity
- **Data Sources**: Pluggable data storage (PlainObjectDataSource, etc.)
- **Validators**: Pluggable validation systems (Zod, Yup, Valibot adapters)
- **Framework Agnostic**: Pure TypeScript with signal-based reactivity

## Development Principles
- Framework-agnostic design with pluggable interfaces
- Single source of truth through DataSource abstraction
- Signal-based reactivity for efficient change detection
- Type-safe APIs with comprehensive TypeScript interfaces
- Minimal dependencies (only alien-signals)

## Commands
**Test:** `npm test` | `npm run test:watch` | `npm run test:coverage`
**Build:** `npm run build` | `npm run build:main` | `npm run build:adapters`
**Lint:** `npm run lint` | `npm run lint:fix`
**Type Check:** `npm run type-check`
**Dev:** `npm run dev` (watch mode build)

## Code Style
- TypeScript with explicit return types and strict typing
- Single quotes, no semicolons, 2-space indentation
- camelCase for variables/functions, PascalCase for classes/interfaces
- Prefix interfaces with 'I' when needed for distinction
- Group imports: alien-signals, internal modules, types
- Signal-based reactive patterns using alien-signals API

## Project Structure
```
src/
├── types.ts              # Core interfaces and types
├── form-controller/       # Main FormController implementation
├── data-sources/          # DataSource implementations
├── validators/            # Validator adapters (Zod, Yup, etc.)
├── utils/                 # Path utilities and helpers
└── index.ts              # Main exports

tests/
├── form-controller/       # FormController tests
├── data-sources/          # DataSource tests
├── integration/           # Integration tests
├── mocks/                # Test mocks and utilities
└── utils/                # Utility tests
```

## Key Concepts
- **DataSource**: Abstraction for data storage (plain objects, reactive stores, etc.)
- **FormValidator**: Pluggable validation interface with async support
- **FieldState**: Reactive field state (value, isDirty, isTouched, errors, etc.)
- **Signal-based**: Uses alien-signals for framework-agnostic reactivity
- **Path-based Access**: String paths for deep object access ("user.address.street")

## Testing Strategy
- Unit tests for all core components using Vitest
- Integration tests for framework adapters
- Mock implementations for testing interfaces
- Coverage reporting with v8 provider
- JSDoc environment for DOM-related tests

## Build System
- Vite for building UMD and ES modules
- Separate build for validation adapters (Zod, Yup, Valibot)
- TypeScript declaration generation
- Multiple export formats for different use cases