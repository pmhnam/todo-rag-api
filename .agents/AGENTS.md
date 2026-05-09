# OpenCode notes (repo-specific)

## Quick start
- Use pnpm (see `package.json` `packageManager`); Node >= 20.10 per `docs/development.md`.
- Create `.env` from `.env.example` before running the app.
- Dev server: `pnpm start:dev` (watch) or `pnpm start`.

## Modules / entrypoints
- App entrypoint is `src/main.ts`; global prefix excludes `/` and `/health`.
- `MODULES_SET` controls which module set is loaded (`monolith`/`api`/`background`) in `src/utils/modules-set.ts`.

## Tests
- Unit tests: `pnpm test` (Jest root is `src`, matches `*.spec.ts`).
- Single test file: `pnpm test path/to/file` (see `docs/testing.md`).
- E2E tests: `pnpm test:e2e` (config `test/jest-e2e.json`).
- Jest sets required env vars in `setup-jest.mjs` (no `.env` needed for unit tests).

## Lint / format
- `pnpm lint` uses ESLint with TS project config and ignores `src/generated/i18n.generated.ts`.
- `pnpm format` runs Prettier on `src/**/*.ts` and `test/**/*.ts`.
- `lint-staged` runs `pnpm lint` and `pnpm format` on staged `*.ts`.

## Git hooks / conventions
- Pre-commit enforces branch name regex: `^(feature|feat|chore|fix|bugfix|hotfix|docs|refactor|test|build|perf|style|ci|release|merge)\.` (see `.husky/pre-commit`).
- Pre-push runs `pnpm test` if any `*.ts`/`*.js` changed since last commit.
- PR titles are checked for Conventional Commits by `.github/workflows/check-semantic-prs.yml`.

## CI expectations
- CI order is `pnpm lint` -> `pnpm build` -> `pnpm docs:build` -> `pnpm test` (see `.github/workflows/ci.yml`).

## Docker dev services
- Local dev stack: `docker compose -f docker-compose.local.yml up --build -d`.
- Extra services only: `docker compose up -d db maildev pgadmin`.
