# Hobby Collection - Frontend

## Stack

- Language: TypeScript
- Framework: React 19 + Vite 7
- UI Library: Chakra UI v3 (`@chakra-ui/react`)
- Animation: Framer Motion
- Icons: Lucide React
- HTTP Client: Axios
- Routing: React Router v6
- Testing: Playwright (E2E)
- Linting: ESLint + Prettier

## Project Structure

```
src/
├── App.tsx              — Root component, renders route tree
├── main.tsx             — Entry point, wraps App with ChakraProvider
├── config/
│   └── env.ts           — Runtime/env config (API base URL, Cloudinary)
├── libs/
│   └── collection/
│       └── collection.d.ts  — All shared TypeScript interfaces & types
├── router/
│   ├── index.ts             — Route definitions (IRoute[])
│   └── middleware/
│       ├── publicRouter.tsx     — Outlet wrapper for public routes
│       ├── protectedRoute.tsx   — Guards routes behind JWT check
│       └── privateRouter.tsx    — Private route wrapper
├── layouts/
│   └── hobby_showcase/
│       ├── index.tsx        — Showcase layout shell
│       └── header/          — Header component
├── pages/
│   ├── hobby_showcase/      — Collection listing page (/)
│   │   ├── index.tsx
│   │   ├── parts/           — CollectionFilters, ItemCard, ReleaseBadge, StatisticsSection
│   │   ├── hooks/           — Page-local hooks
│   │   └── helpers/         — Page-local helper functions
│   ├── collection_detail/   — Collection detail page (/collection/:id)
│   │   ├── index.tsx
│   │   └── parts/           — KitSpecifications
│   └── collection_form/     — Create/Edit form (/collection/new, /collection/:id/edit)
│       ├── index.tsx
│   │   ├── hooks/           — Page-local hooks
│   │   └── helpers/         — Page-local helper functions
│       └── parts/           — CoverImageField, PicturesField, FormSelectDrawer, FormSelectDrawers
├── hooks/
│   └── collections/
│       ├── useCollections.ts       — Fetches collection list
│       └── useCollectionDetail.ts  — Fetches single collection by ID
├── services/
│   ├── http.ts              — Axios instance, JWT utils (getAuthToken, isValidJwtToken, canManageCollection)
│   └── content/
│       └── collectionServices.ts  — All API calls for collections
├── utils/
│   ├── collectionCaches.ts  — localStorage cache layer (get/set/invalidate)
│   ├── cloudinary.ts        — Cloudinary URL helpers
│   ├── date.ts              — Date formatting utilities
│   └── delay.ts             — Promise-based delay helper
└── theme/
    └── index.ts             — Chakra UI custom theme tokens
```

## Routes

| Name                | Path                   | Guard     | Page Component      |
| ------------------- | ---------------------- | --------- | ------------------- |
| `collection-list`   | `/`                    | Public    | `hobby_showcase`    |
| `collection-detail` | `/collection/:id`      | Public    | `collection_detail` |
| `collection-create` | `/collection/new`      | Protected | `collection_form`   |
| `collection-edit`   | `/collection/:id/edit` | Protected | `collection_form`   |

- Routes are defined in `src/router/index.ts` as a typed `IRoute[]` array.
- `App.tsx` renders the tree recursively — do NOT hardcode `<Route>` outside of `renderRoutes`.
- `ProtectedRoute` uses `canManageCollection()` (JWT validity check) to guard write routes.

## Auth / JWT

- JWT is stored in `localStorage` under the key `jwt`.
- Use `getAuthToken()` to read it; use `isValidJwtToken()` to check expiry.
- `canManageCollection()` is the single source of truth for whether a user can create/edit.
- Protected API calls (create, update) attach `Authorization: Bearer <token>` automatically in the service layer — do not add auth headers manually in components.

## API Service Layer (`src/services/`)

- `src/services/http.ts` exports a single Axios instance (`http`) pointed at `env.apiBaseUrl`.
- All API functions live in `src/services/content/collectionServices.ts` and are exported as the default `collectionServices` object.
- Available methods:
  - `getAllCollections(query?)` — GET `/collection`
  - `getCollection(id)` — GET `/collection/:id`
  - `getDrawerContent()` — GET `/collection/drawer`
  - `getCollectionTypeFilters()` — GET `/collection/filter`
  - `createCollection(payload)` — POST `/create_collection`
  - `updateCollection(id, payload)` — PATCH `/collection/:id`
- Mutation payloads can be `ICollectionUpsertPayload`, `ICollectionUploadPayload`, or `FormData`.
- Use `FormData` when sending image files; the service sets `Content-Type: multipart/form-data` automatically.
- Errors are logged (dev only) and re-thrown — handle them in the calling hook/component.

## Caching (`src/utils/collectionCaches.ts`)

- All API responses are cached in `localStorage` with a **24-hour TTL**.
- Cache keys:
  - `collection_<id>` — single collection detail
  - `collection_list` / `collection_list_ct..._g..._sc..._rt..._l..._o..._s...` — filtered list
  - `collection_drawer` — drawer/form dropdown content
  - `collection_filters` — filter panel options
- Always call `invalidateCollectionCache(id?)` after create/update to clear stale data.
- Do NOT bypass the cache layer by calling `http` directly; go through `collectionServices`.

## Type Definitions (`src/libs/collection/collection.d.ts`)

- All shared types are declared here as ambient `.d.ts` — do not import them with a path alias, use `@/libs/collection/collection`.
- Key types:
  - `ICollection` — full collection entity (read)
  - `ICollectionUpsertPayload` — create/update body (JSON)
  - `ICollectionUploadPayload` — create/update body with `File` objects
  - `ICollectionFilterQuery` — query params for list endpoint
  - `ICollectionStatus` — `0 | 1 | 2 | 3` (numeric enum)
  - `ICollectionDrawerContent` — form dropdown options
  - `ICollectionFilterOptions` — filter panel options

## Conventions

- **Path alias**: Use `@/` for all `src/` imports (configured in `vite.config.js` and `tsconfig`).
- **Lazy loading**: All page components are `React.lazy()`-loaded in `router/index.ts`. Keep page-level imports lazy.
- **Co-location**: Page-specific hooks, helpers, and sub-components live inside their page folder under `hooks/`, `helpers/`, and `parts/` respectively.
- **Global hooks**: Cross-page hooks live in `src/hooks/<domain>/`.
- **Form logic**: Keep all form state and submission logic inside a dedicated `useCollectionForm.ts`-style hook. Do not put business logic directly in the page component.
- **No inline styles**: Use Chakra UI props or the custom theme tokens. Avoid `style={{}}` except for dynamic values that Chakra cannot handle.
- **Framer Motion**: Use for carousels, transitions, and drag interactions. Import directly from `framer-motion`.
- **Icons**: Use `lucide-react` exclusively. Do not add another icon library.

## Environment Variables

| Variable                     | Source                            | Purpose               |
| ---------------------------- | --------------------------------- | --------------------- |
| `VITE_API_BASE_URL`          | `.env` or `window.__APP_CONFIG__` | Backend API base URL  |
| `VITE_CLOUDINARY_CLOUD_NAME` | `.env` or `window.__APP_CONFIG__` | Cloudinary cloud name |

- Always read env values through `src/config/env.ts`, never from `import.meta.env` directly.
- Runtime injection via `window.__APP_CONFIG__` takes priority over `.env` values.

## Dev Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Type-check + production build
npm run lint         # Run ESLint
npm run format       # Run Prettier (write)
npm run format:check # Run Prettier (check only)
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Playwright with UI
```
