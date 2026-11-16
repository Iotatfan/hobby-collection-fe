# Architecture

## Application map

| Area                                                                                     | Responsibility                                                                        |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/main.tsx`, `src/App.tsx`                                                            | Providers, application shell, browser router, Suspense fallback                       |
| `src/router/`                                                                            | Typed route definitions and public/protected wrappers                                 |
| `src/layouts/hobby_showcase/`                                                            | Standard showcase shell, header, view switch                                          |
| `src/layouts/shelves/`                                                                   | Persistent shelves workspace, scene lifecycle, transitions, lazy page loaders, warmup |
| `src/pages/collection_list/`                                                             | Standard collection list, URL filters, statistics, item cards                         |
| `src/pages/collection_detail/`                                                           | Standard detail page and specifications                                               |
| `src/pages/collection_shelf/`                                                            | Shelf overview and category pages, pagination, navigation helpers                     |
| `src/pages/collection_shelf_detail/`                                                     | Shelf detail, information and image gallery                                           |
| `src/pages/collection_form/`                                                             | Create/edit form, state hook, payload helpers, image fields                           |
| `src/pages/admin_login/`, `src/pages/admin_collection_list/`, `src/pages/admin_catalog/` | Admin sign-in, record management, catalog management                                  |
| `src/components/`, `src/hooks/`, `src/utils/`                                            | Shared UI, cross-page hooks, reusable utilities                                       |
| `src/services/`, `src/libs/collection/`, `src/config/`                                   | See [Data and authentication](data-and-auth.md)                                       |
| `src/worker.ts`, `wrangler.jsonc`                                                        | Cloudflare asset serving and bot-specific collection metadata rewriting               |

## Routes and layout ownership

`src/router/index.ts` exports an `IRoute[]`. `App.tsx` recursively converts it with `toRouteObjects` and passes it to `createBrowserRouter`. Add routes through that tree rather than creating a separate route renderer.

| Path                              | Access    | Page                        |
| --------------------------------- | --------- | --------------------------- |
| `/`                               | Public    | `collection_list`           |
| `/collection/:id/:title?`         | Public    | `collection_detail`         |
| `/shelves`                        | Public    | `collection_shelf`          |
| `/shelves/category/:categorySlug` | Public    | `collection_shelf/category` |
| `/shelves/collection/:id/:title?` | Public    | `collection_shelf_detail`   |
| `/admin/login`                    | Public    | `admin_login`               |
| `/admin/collections`              | Protected | `admin_collection_list`     |
| `/admin/catalog`                  | Protected | `admin_catalog`             |
| `/collection/new`                 | Protected | `collection_form`           |
| `/collection/:id/edit`            | Protected | `collection_form`           |

`PublicRouter` wraps the route outlet in `HobbyShowcaseLayout`. It derives header visibility from matched routes' `handle.showHeader` metadata. Standard list/detail and protected management pages opt in; login and shelves do not.

Most pages are loaded with `React.lazy` in the route definitions. The shelves workspace is imported eagerly and persists across its child routes. Its page wrappers in `layouts/shelves/routes.ts` use shared dynamic import functions from `pageLoaders.ts`; preserve this separation and the lazy-module retry reset behavior.

## Shelves workspace

- The workspace owns retained scenes, active/departing state, readiness, transition generations, scroll handoff, and the current document title. Pages use the scene context's location and navigation helpers so retained scenes do not accidentally follow another scene's route.
- Keep the retained scene set bounded. Dormant scenes must not receive focus or pointer input; preserve `inert`, `aria-hidden`, visibility rules, and observer cleanup when scenes deactivate.
- Category and cover bridges coordinate shared artwork between scenes. Preserve a single visible artwork owner through image decoding, layout measurement, bridge completion, cancellation, and error fallback. Keep scene-part and artwork attributes aligned with the selectors that consume them.
- Register asynchronous motion with `MotionRegistry` through the scene helpers. Completion from an old navigation generation must not settle the current scene; release registered work on cancellation.
- Preserve reduced-motion behavior, including a preference change during navigation. Pending bridges must release and navigation must reach a settled usable scene.
- Navigation helpers capture origin, preview, scroll, horizontal position, and focus. Session entries use the `shelves:` prefix and a five-minute TTL. Keep browser Back/Forward and direct-entry fallback behavior intact; measure resting positions rather than temporary entrance transforms.
- Route warmup shares page loaders and service caches with mounted screens. Overview/category warmup fetches shelf data; detail warmup loads code only. Keep transient loading and unavailable scenes inside the workspace's loading/error boundaries.

Descriptions are plain text. Preserve whitespace and render them as inert text in both detail experiences; do not introduce HTML interpretation.

For changes to navigation, artwork handoff, or retained scenes, use the focused regression scenarios in [Validation](validation.md).
