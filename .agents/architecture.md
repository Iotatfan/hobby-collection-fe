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

Most pages and the shelves workspace are loaded with `React.lazy` in the route definitions. The workspace loads only on entry to Shelves and persists across its child routes. Its page wrappers in `layouts/shelves/routes.ts` use shared dynamic import functions from `pageLoaders.ts`; preserve this separation and the lazy-module retry reset behavior.

## Shelves workspace

- The workspace owns retained scenes, active/departing state, readiness, transition generations, scroll handoff, and the current document title. Pages use the scene context's location and navigation helpers so retained scenes do not accidentally follow another scene's route.
- Location, current, and active signals use separate contexts so bridge bookkeeping does not rerender memoized shelves, items, and filter controls. Keep category row records stable across motion-only updates; motion parts continue to consume the full transition context.
- Keep the retained scene set bounded. Dormant scenes must not receive focus or pointer input; preserve `inert`, `aria-hidden`, visibility rules, and observer cleanup when scenes deactivate.
- Overview previews contain at most six completed items per category; Backlog remains separate and noninteractive. Shelf rows use two/three/four/six columns at the base/md/lg/xl breakpoints, with persistent captions below each wooden ledge. The category controller, shared shelf rows, and loading skeletons share these breakpoints.
- Shelf artwork rows size to the tallest rendered card using shared grid rows and CSS subgrid through item/filter wrappers. Keep captions in a shared 104px row, ledges at the artwork/caption boundary, and image size caps independent of row height. Category rows use 16px gaps after the first row; wrapped overview rows use 12px, and overview category sections use 20/24px base/md gaps. Loading skeletons use their placeholder artwork heights and the same caption/row spacing, including 16px when appended after existing category rows.
- Only the visible artwork card is linked; captions and unused row space are not click targets. The link owns hover transforms and the artwork focus outline. Capture resting navigation offsets from its untransformed artwork slot so hover cannot shift Back scroll restoration.
- Shelf detail keeps box art first and initially selects the first collection photograph once full data is available. Manual gallery selections persist per item through five-minute `shelves:` session entries, restoring by image identity when details remount and clamping removed selections. Every shelf-to-detail entry zooms an independent box-art overlay into the gallery frame, including cached visits with a restored photograph. After the zoom, an 80ms handoff reveals the selected photograph or the gallery background while it loads; gallery selection never resets for entry motion.
- Category filter selections are retained per category for the browser-tab session; paginated results remain keyed by the full filter selection with the existing five-minute freshness policy. The lazy category controller reports filters and data to the retained visual shell. Category options come from `/collection/filter?category=...`; matching items and pagination come from `/collection/shelves`.
- `FilterShelfMotion` captures artwork before React changes rows, clones only departing artwork using the next item IDs, batches destination measurements before transform writes, and skips stationary survivors. It reserves shelf grid geometry through exits/regrouping and releases all registered work and decorative exit layers on interruption, deactivation, or reduced motion. Its transforms remain separate from scene navigation transforms.
- Shelf captions show grade and scale only for Gunpla, including Gunpla backlog items. Shelves details omit blank or case-insensitive `Unknown Scale` values from specifications and scale-fallback badges; explicit `Non-scale` values remain meaningful.
- `ShelfPageContainer` owns the shared 90rem outer width including 16/24/32px base/md/lg gutters for Shelves routes and loading states. Keep page-specific maximum widths and padding inside that common boundary.
- Category transitions use separate morph/content timings in `motion.ts`. Headings, controls, and captions spread with transform/opacity without text scaling; only bridge-owned artwork and the first ledge are masked. Scene parts use DOM animation through Framer Motion, with one registry entry per generation/scene/role group. Additional wrapped ledges fade with the scene. Resizing invalidates the fixed bridge geometry and settles the responsive destination.
- Gallery selection updates immediately and slides keyed image layers without waiting for loading or decoding. A pending image shows the gallery background; its load event reveals it without restarting the slide. Keep at most two layers, mark only the loaded current image for artwork handoff, and discard outgoing layers immediately for reduced motion. Main-image arrows are the only directional button pair; thumbnail overflow uses visible scrolling and dragging.
- Category and cover bridges coordinate shared artwork between scenes. Preserve a single visible artwork owner through image decoding, layout measurement, bridge completion, cancellation, and error fallback. Keep scene-part and artwork attributes aligned with the selectors that consume them.
- Register asynchronous motion with `MotionRegistry` through the scene helpers. Completion from an old navigation generation must not settle the current scene; release registered work on cancellation.
- `SceneMotionBatch` groups part preparation into reset, measurement, and transform-write passes before the workspace advances to animation. Anchor geometry is shared only within each read pass; do not retain it across navigation, restoration, or hydration. First-frame visibility checks are batched after scroll restoration, and scheduled work must be cancelled when a part deactivates. Keep timings in `motion.ts` and animate category clipping only when its endpoints differ.
- Preserve reduced-motion behavior, including a preference change during navigation. Pending bridges must release and navigation must reach a settled usable scene.
- Navigation helpers capture origin, preview, scroll, horizontal position, and focus. Session entries use the `shelves:` prefix and a five-minute TTL. Keep browser Back/Forward and direct-entry fallback behavior intact; measure resting positions rather than temporary entrance transforms.
- Route warmup shares page loaders and service caches with mounted screens. Overview/category warmup fetches shelf data; detail warmup loads code only. Keep transient loading and unavailable scenes inside the workspace's loading/error boundaries.

Descriptions are plain text. Preserve whitespace and render them as inert text in both detail experiences; do not introduce HTML interpretation.

For changes to navigation, artwork handoff, or retained scenes, use the focused regression scenarios in [Validation](validation.md).
