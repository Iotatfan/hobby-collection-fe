# React + TypeScript + Vite

## TODO

- [ ] Receive signed upload from BE
- [ ] Upload flow on FE

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Getting started

```bash
npm install
npm run dev
```

## E2E Testing (Playwright)

This repo includes a Playwright E2E architecture with:
- `e2e/specs`: user journey tests (route protection, list, create flow)
- `e2e/fixtures`: reusable auth + API mocking helpers
- `e2e/data`: fixture builders and seeded test data

Useful commands:

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:report
```

Run only smoke tests:

```bash
npm run test:e2e -- --grep @smoke
```

## Configuration

This app supports both runtime config and build-time env vars.

Priority order:

1. `window.__APP_CONFIG__` from `/public/app-config.js` (runtime; can change without rebuild)
2. `VITE_*` env vars (build-time fallback)

### Runtime config (recommended for production)

`index.html` loads `/app-config.js` before the app bundle. Default file:

```js
window.__APP_CONFIG__ = {
  API_BASE_URL: "",
  API_JWT: "",
}
```

In production, generate/overwrite `dist/app-config.js` during deploy/startup using platform env vars.

Example (Linux shell):

```bash
cat > dist/app-config.js <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${API_BASE_URL}",
  API_JWT: "${API_JWT}",
}
EOF
```

### Build-time env (fallback)

Create a `.env` file in project root (you can copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_JWT=
```

- `VITE_API_BASE_URL` is required if runtime `API_BASE_URL` is not set.
- `VITE_API_JWT` is optional. If empty, the app will try `localStorage.getItem("jwt")`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
