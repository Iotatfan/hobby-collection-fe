# Data and authentication

## Service boundaries and shared types

`src/services/http.ts` default-exports the shared Axios instance, configured with `env.apiBaseUrl`. Collection API operations belong in the default `collectionServices` object from `src/services/content/collectionServices.ts`; login belongs in `src/services/authServices.ts`. Components and hooks should use these services rather than bypassing their auth/cache behavior with direct HTTP calls.

| Method                                  | Endpoint                              | Result or purpose                                           |
| --------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `getAllCollections(query?, signal?)`    | GET `/collection`                     | List response with `collections` and optional `total_count` |
| `getCollection(id, signal?)`            | GET `/collection/:id`                 | `{ data, fromCache }`                                       |
| `getDrawerContent()`                    | GET `/collection/drawer`              | Form option data                                            |
| `getCollectionTypeFilters()`            | GET `/collection/filter`              | Classic View filter options                                 |
| `getCategoryFilters(category, signal?)` | GET `/collection/filter?category=...` | Category-used options and unfiltered total                  |
| `getCollectionStatistics(signal?)`      | GET `/collection/statistics`          | Collection statistics                                       |
| `getCollectionShelves(query?, signal?)` | GET `/collection/shelves`             | Overview or category shelf data                             |
| `createCollection(payload)`             | POST `/create_collection`             | Created collection                                          |
| `updateCollection(id, payload)`         | PATCH `/collection/:id`               | Updated collection                                          |

Catalog creation methods use POST: `createCollectionType` at `/collection/types`, `createGrade` at `/collection/grades`, `createScale` at `/collection/scales`, `createReleaseType` at `/collection/release-types`, `createSeries` at `/collection/series`, `createManufacturer` at `/collection/manufacturers`, and `createMetadataTag` at `/collection/metadata-tags`. Request interfaces for these helpers are exported from the service module.

Shared collection interfaces/types are exported module declarations in `src/libs/collection/collection.d.ts`, not ambient globals. Import them through `@/libs/collection/collection`. They include read/mutation payloads, list/filter responses, statistics, shelf entities and queries. `ICollectionStatus` is `0 | 1 | 2 | 3`; use the existing types rather than inventing parallel shapes.

Mutations accept `ICollectionUpsertPayload`, `ICollectionUploadPayload`, or `FormData`. Use `FormData` for file uploads and existing form helpers for serialization; the service handles multipart headers. Reuse `src/utils/imageValidation.ts` for supported MIME types, the 10 MB file limit, and the 20-image gallery limit. Handle request failures in the calling hook/page and preserve retryable UI state.

Detail, statistics, and shelves requests use `collectionRequest` to share same-key in-flight requests. Preserve consumer-aware cancellation: releasing one consumer must not abort work another consumer still needs. The list also accepts an `AbortSignal` but does not use this request-sharing helper.

## Authentication

- JWT is stored in the browser cookie named `jwt`, not localStorage. Use `getAuthToken`, `setAuthToken`, and `clearAuthToken` from `services/http.ts`.
- `authServices.login(password)` posts to `/admin/token` and returns a token and optional expiry; the login page stores it through `setAuthToken`.
- `setAuthToken` uses `Path=/`, `SameSite=Lax`, and `Secure` on HTTPS. When expiry information is available, it uses the earliest valid JWT/response expiry for cookie lifetime.
- `isValidJwtToken` checks payload decoding and numeric expiry; it does not verify a signature. `canManageCollection()` is the shared UI permission helper. Authorization remains the backend's responsibility.
- `ProtectedRoute` redirects an unauthenticated visitor to `/admin/login`. Separately, the shared Axios interceptor clears the cookie and redirects HTTP 401 responses to `/admin/login?returnTo=...`, unless already on the login page.
- Collection and catalog mutation services validate the token and attach Bearer headers. Do not duplicate these headers in components or assume all public GETs attach auth.

## Caching and mutation consistency

`src/utils/collectionCaches.ts` owns optional localStorage response caches. Physical keys use the `v2:` prefix; use the helpers rather than constructing storage keys in new callers.

| Cached data       | TTL       | Logical key family                                     |
| ----------------- | --------- | ------------------------------------------------------ |
| Collection detail | 5 minutes | `collection_<id>`                                      |
| Collection lists  | 5 minutes | `collection_list` plus filter/pagination/sort suffixes |
| Statistics        | 5 minutes | `collection_statistics`                                |
| Shelves           | 5 minutes | `collection_shelves` plus category/pagination suffixes |
| Drawer options    | 24 hours  | `collection_drawer`                                    |
| Filter options    | 24 hours  | `collection_filters`                                   |

List keys account for collection types, grades, scales, release types, sort, limit, and offset. Shelf keys distinguish overview, category, pagination, and every active filter ID. Category metadata is cached for five minutes separately from the 24-hour Classic View filter cache. Release-type query arrays use repeated keys. Brand filters use `manufacturer_id`; category shelf `count` is the full matching count and scoped filter metadata supplies the unfiltered total. Preserve those distinctions when changing query behavior.

Collection create/update already call `invalidateCollectionCache(id)` and seed the returned detail record. Do not add redundant invalidation in their callers. Invalidation clears statistics, list/shelf caches, drawer/filter options, the specified detail, and `shelves:` session entries when storage is available. Preserve the statistics generation check that prevents a pre-mutation request from restoring stale cached statistics. Catalog creation helpers do not automatically perform this collection invalidation; inspect the caller's option refresh flow when changing catalog behavior.

Shelf navigation/session state and retained category data are separate from service response caches. Consult the page helpers when changing restoration or freshness behavior.

## Runtime and deployment configuration

Application code reads configuration through `src/config/env.ts`.

| Application field         | Runtime setting                               | Build-time fallback          |
| ------------------------- | --------------------------------------------- | ---------------------------- |
| `env.apiBaseUrl`          | `window.__APP_CONFIG__.API_BASE_URL`          | `VITE_API_BASE_URL`          |
| `env.cloudinaryCloudName` | `window.__APP_CONFIG__.CLOUDINARY_CLOUD_NAME` | `VITE_CLOUDINARY_CLOUD_NAME` |

Each nonempty runtime setting takes precedence over its build-time fallback. `index.html` loads `/app-config.js`; the source default is `public/app-config.js`. Keep public configuration free of credentials. Use existing Cloudinary URL helpers rather than rebuilding image URLs in components.

Worker bindings are separate from browser runtime configuration. `src/worker.ts` reads `API_BASE_URL` with `VITE_API_BASE_URL` fallback, and `CLOUDINARY_CLOUD_NAME`, for bot metadata requests. It serves normal requests through `ASSETS` and rewrites HTML for bots visiting numeric `/collection/:id/...` paths. Setting Worker bindings alone does not populate `window.__APP_CONFIG__`.
