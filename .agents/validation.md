# Commands and validation

## Available scripts

`package.json` is the source of truth for commands.

| Command                   | Behavior                                                   |
| ------------------------- | ---------------------------------------------------------- |
| `npm run dev`             | Start the Vite development server                          |
| `npm run build`           | TypeScript project build followed by Vite production build |
| `npm run lint`            | Run ESLint across the repository                           |
| `npm run format:check`    | Check repository formatting with Prettier                  |
| `npm run format`          | Rewrite repository formatting; avoid for unrelated changes |
| `npm run preview`         | Build, then start local Wrangler development serving       |
| `npm run test:e2e`        | Run Playwright tests                                       |
| `npm run test:e2e:ui`     | Open Playwright UI                                         |
| `npm run test:e2e:debug`  | Run Playwright in debug mode                               |
| `npm run test:e2e:report` | Open the HTML test report                                  |
| `npm run deploy`          | Build and deploy the Worker; changes external state        |

The Vite configuration includes React and Cloudflare plugins. Wrangler's source configuration points assets at `dist/client`, enables SPA fallback, and runs the Worker first for `/collection/*` and `/shelves/collection/*`. Preview is a local Worker preview, rather than Vite's static preview command. Do not deploy merely to validate a local change.

## Choose checks by impact

- For application TypeScript/UI changes, run `npm run build`, lint, and formatting checks relevant to the edit. Run the affected Playwright suites when behavior changes.
- For documentation-only edits, inspect referenced source facts and relative links, then run `npx prettier AGENTS.md .agents/architecture.md .agents/data-and-auth.md .agents/validation.md --check` for these guides. Application builds and browser tests are unnecessary for Markdown-only changes.
- Avoid broad formatting rewrites. Run Prettier against explicit changed paths when formatting a focused edit.
- Report the checks run, their results, and any environmental blockers. Distinguish existing failures from regressions without silently changing unrelated configuration.

## Secrets and sensitive data

- Before sharing a patch or publishing a build, check changed and newly added files for credentials and sensitive data. Include documentation, fixtures, workflow configuration, public assets, runtime configuration, generated browser bundles/source maps, and test reports or traces intended for sharing.
- Check for private keys, provider API tokens, real JWTs, passwords, credential-bearing URLs, and personal information. Review suspicious matches in context; report file locations and categories without copying values into logs, comments, documentation, or chat.
- Treat every `VITE_*` value, `window.__APP_CONFIG__` setting, and public asset as browser-visible. API base URLs and Cloudinary cloud names are public identifiers; private API keys, signing secrets, admin passwords, and deployment tokens must never go there. Keep deployment credentials in the CI/platform secret store and server-side bindings that are not copied into browser assets.
- Keep local `.env` and `.dev.vars` files ignored; example files must contain placeholders or public configuration only. Check tracked files as well as ignore rules: ignoring a file does not remove it from Git history. Also inspect untracked files that will be included in the change or deployment.
- Use synthetic test tokens and fabricated personal data. Never share live auth cookies, storage dumps, or unsanitized Playwright traces, screenshots, and reports.
- Redact request headers, cookies, passwords, and sensitive payload fields before logging. Avoid logging complete Axios errors: their request configuration can contain an Authorization header, including in development.
- When checking for an existing leak, scan reachable Git history as well as current files with a redacting secret scanner when available. Pattern scans can miss custom credentials and personal data; a clean scan is not proof that the repository contains no secrets. Record scan scope, exclusions, and unresolved candidates.
- If a real credential has been committed or published, report its location without the value and arrange revocation/rotation. Removing the current literal alone does not invalidate it or erase historical copies; coordinate history cleanup separately.

## Playwright setup

`playwright.config.ts` runs specs from `e2e/specs` using Chromium (Desktop Chrome). It enables parallel execution, two retries and two workers in CI, and retains failure screenshots/videos plus first-retry traces.

Install the Chromium browser with `npx playwright install chromium` when the environment lacks it. Run a focused suite with, for example:

```sh
npm run test:e2e -- e2e/specs/collection-list.spec.ts
npm run test:e2e -- e2e/specs/collection-shelves.spec.ts
npm run test:e2e -- e2e/specs/shelf-motion.spec.ts
```

The default base URL is `http://127.0.0.1:4173`. Without `PLAYWRIGHT_BASE_URL`, Playwright launches `npm run build && npm run preview -- --host 127.0.0.1 --port 4173` and waits for that URL, reusing a server outside CI.

There is a command mismatch to account for: `preview` now executes `wrangler dev`, while the configured Playwright command still passes Vite's `--host` flag; Wrangler uses `--ip`. The command also builds twice because `preview` already builds. Do not assume this automatic startup path works unchanged. To run tests against a separately started local server in PowerShell:

```powershell
# Terminal 1
npm run dev -- --host 127.0.0.1 --port 4173

# Terminal 2
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173'
npm run test:e2e -- e2e/specs/collection-shelves.spec.ts
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

An explicit `PLAYWRIGHT_BASE_URL` disables Playwright-managed server startup. Use a local server under your control; existing tests mock API requests and image responses rather than requiring production data. This development-server workflow validates browser behavior, not production Worker metadata rewriting.

## Existing suites and regression scenarios

| Suite                        | Responsibilities                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `collection-list.spec.ts`    | List pagination fallback and URL filter persistence                                                                          |
| `collection-form.spec.ts`    | Create/edit submission locking, failure recovery, description preservation                                                   |
| `collection-shelves.spec.ts` | Shelf/category/detail behavior, loading, caching, pagination, navigation, motion, gallery, accessibility                     |
| `shelf-motion.spec.ts`       | MotionRegistry cancellation, replacement work, generation isolation                                                          |
| `shelf-filters.spec.ts`      | Category filters, full-dataset matching, restoration, mobile controls, late responses, cross-row regrouping, anchored ledges |

Use existing request mocking patterns (`page.route`) and initialize runtime config/auth cookies before navigation when needed. Synthetic JWTs are for browser tests only. Model API envelopes, pagination, images, and timing explicitly so a test exercises the intended state.

For shelves changes, select relevant existing cases covering direct entry, UI Back and browser Back/Forward, repeated cached visits, scroll/focus restoration, inactive observers, delayed or failed image decoding, lazy loading, retry/unavailable states, and interrupted transitions. Check desktop/mobile widths and reduced motion when layout or motion changes. Shared artwork must remain painted with one visible owner, old generations must not settle new work, and inactive scenes must remain inaccessible.

Add a focused regression test for new correctness behavior when existing coverage does not establish it. Prefer observable outcomes and controlled request completion to fixed sleeps or assertions that merely mirror implementation details.

For the shelves redesign, also verify overview completed-category counts of 0, 1, 6, and 7; six-item preview limits independent of viewport width; separate backlog counts and captions; captions below each ledge; and no page-level horizontal overflow at phone, tablet, and desktop widths. Gallery regressions cover delayed and cached data, first-photo initialization with box art still first, cover-only and missing-cover cases, and manual selection surviving resize and retained-scene reactivation. Search and sorting remain a separate backend/frontend requirement.

When changing category morphs, observe complete transitions in both directions: check independent caption fades without scaling, one visible artwork owner during decode/movement/reveal, additional wrapped ledges, and resize cancellation while decoding or moving. Verify non-Gunpla shelf/category/backlog captions omit grade and scale while Gunpla captions retain them. Unknown scale details must disappear from both specifications and fallback badges; known scales and explicit `Non-scale` remain visible.

For shared-container/gallery changes, compare route and loading-state container bounds at 390, 820, 1100, and 1700px. Verify only main-image arrows remain, thumbnail overflow is keyboard/touch accessible, pending images leave the gallery background visible, rapid selections retain at most two layers, and late loading cannot replace the current selection. Include reduced motion, image failure, and navigation while pending. Motion-group tests must establish that cancellation releases members without settling while another member is active. Compare production-build transition scripting/frame gaps with identical synthetic fixtures; development-server numbers are not production performance measurements.
Repeated-entry regressions must use multi-image details: verify box-art movement on first, second, and third visits from overview and category at desktop and phone widths, while preserving the manually selected photograph and using both UI and browser Back. Pending photographs must not delay entry completion; interrupted entry and reduced motion must release overlays.

For artwork-only navigation, test wide and tall cards on overview/category at phone and desktop widths. Link bounds must match the rendered card, while empty row space, captions, and ledge gaps do not navigate. Verify keyboard activation, visible artwork focus, and hovered-entry Back scroll restoration. Content-sized rows must fit their tallest card, align every card to the ledge, and leave two-line captions plus Gunpla metadata unclipped. Check wrapped rows, loading skeletons, and filtering after row heights change.
