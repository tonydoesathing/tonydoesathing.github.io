# Personal Site

This is a landing page for my GitHub.

## Setup/Development

Install Node 22.13 or later (see `.nvmrc`), then run `npm install`. For the e2e tests, run `npx playwright install`.

Or, use the dev container, which also includes everything for you.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm run check` | Type-check JS and Svelte with `svelte-check`. |
| `npm run lint` | ESLint, then Prettier in check mode. |
| `npm run format` | Rewrite files with Prettier. |
| `npm test` | Unit tests, then end-to-end tests. |

## Testing

`npm test` runs both suites; `npm run test:unit` and `npm run test:e2e` run one each.

- **Unit** (`tests/unit`, Vitest): the pure helpers.
- **End to end** (`tests/e2e`, Playwright): Chromium, Firefox and WebKit, against a Vite server it starts on port 5174.

## Deployment

Every push to `master` runs `.github/workflows/deploy.yml`, which builds the site and deploys `dist/` to GitHub Pages. It runs no checks or tests, so run `npm run check`, `npm run lint` and `npm test` before pushing. In the repository’s Pages settings, set **Source** to **GitHub Actions**.
