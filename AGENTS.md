# Hobby Collection - Frontend

Agent entry point for this React application for browsing hobby collections and managing collection records and catalog data.

## Read before changing code

Read the relevant guides before working in their areas. These linked files contain repository guidance; they are not automatically scoped instructions for the source directories they describe.

| Task                                                                                 | Guide                                               |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Pages, routes, layouts, shelves, animation, accessibility                            | [Architecture](.agents/architecture.md)             |
| API calls, authentication, shared types, uploads, caching, environment configuration | [Data and authentication](.agents/data-and-auth.md) |
| Commands, checks, secrets, Playwright, preview and deployment                        | [Validation](.agents/validation.md)                 |

Keep these guides aligned with source changes. Source files and configuration establish current behavior; investigate discrepancies before carrying outdated documentation into new code.

## Stack and essential conventions

- TypeScript, React 19, Vite 7, and React Router v6.
- Chakra UI v3 with custom tokens in `src/theme/index.ts`. Use Chakra props and tokens; reserve inline styles for dynamic values Chakra cannot handle.
- Framer Motion for transitions, carousels, and drag interactions. Import from `framer-motion`.
- Lucide React for icons. Do not introduce another icon library.
- Axios through the existing service layer; Playwright for automated tests; ESLint and Prettier for code quality.
- Use the `@/` alias for `src/` imports. Import exported shared collection types from `@/libs/collection/collection`.
- Co-locate page-specific components, hooks, and helpers in the page's `parts/`, `hooks/`, and `helpers/` directories. Shared hooks belong under `src/hooks/<domain>/`.
- Keep form state and submission logic in a dedicated hook, such as `useCollectionForm`, rather than in the page component.
- Define routes in `src/router/index.ts`; preserve recursive route-object conversion in `App.tsx` and the shelves workspace's lazy page boundaries.
- Use service-owned authentication, request handling, and cache invalidation. Read application environment values through `src/config/env.ts`.
- Run checks appropriate to the change and report failures or checks not run. For documentation-only changes, check the changed Markdown and its links rather than running application suites.
