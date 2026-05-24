# Repository Instructions

## Setup
- Use pnpm from `package.json` (`pnpm@9.12.3`); Node must be >=20, with `.nvmrc` currently `20.18.0` and `.npmrc` `20.16.0`.
- Create `.env` from `.env.example` before running the app or TypeORM commands; local services use Postgres and Redis.
- The README/docs still contain boilerplate/stale CI references. Prefer executable sources (`package.json`, configs, compose files, source) when they conflict.

## Run And Verify
- Dev server: `pnpm start:dev`; plain start: `pnpm start`; production entry after build: `pnpm start:prod`.
- Build/typecheck: `pnpm build` (`nest-cli.json` uses SWC with `typeCheck: true`).
- Lint: `pnpm lint` runs ESLint with `--fix`; format: `pnpm format` runs Prettier on `src/**/*.ts` and `test/**/*.ts`.
- Unit tests: `pnpm test`; focused test file: `pnpm test src/path/file.spec.ts`; e2e tests: `pnpm test:e2e`.
- Jest unit root is `src` and matches `*.spec.ts`; e2e tests live under `test/` and match `.e2e-spec.ts`.
- Jest loads `setup-jest.mjs`, so unit/e2e tests get required env vars without `.env`; they may still need reachable services if the tested path opens DB/Redis connections.

## Local Services And Database
- Local dependencies only: `docker compose -f docker-compose.local.yml up -d db redis` (Postgres on `5432`, Redis on `6379`, Redis UI on `8001`).
- Full production compose is `docker-compose.yml`; it targets `linux/arm64`, uses external `proxy`, and deploys `todo-rag-api` plus `migrate`.
- TypeORM CLI uses `env-cmd` and `src/database/data-source.ts`; run migrations with `pnpm migration:up`, `pnpm migration:down`, `pnpm migration:show`.
- Generate migrations with an explicit output path, e.g. `pnpm migration:generate src/database/migrations/name`; entities are discovered via `src/**/*.entity{.ts,.js}`.
- Seeds use `typeorm-extension`: `pnpm seed:run`; AI intent seed is `pnpm intent:seed`.
- Local DB images are `pgvector/pgvector:pg18`; production compose mounts `./init-db` to enable extensions.

## Architecture Notes
- App entrypoint is `src/main.ts`; it sets global prefix from `API_PREFIX`, excludes `/` and `/health`, enables URI versioning, global auth guard, validation pipe, exception filter, and Swagger only when `NODE_ENV=development`.
- `src/app.module.ts` imports the dynamic module list from `src/utils/modules-set.ts`; `MODULES_SET` controls `monolith`, `api`, or `background`.
- `monolith` loads API, BullMQ, background queues, cache, TypeORM, i18n, logger, and mail; `api` omits background queues; `background` omits API and mail.
- Main API composition is `src/api/api.module.ts`; current domain modules include auth/user, project/todo, Jira integration, RAG, health/home/post.
- RAG is split under `src/api/rag/` into core, search, intent, agent, conversation, and indexing modules; background queues include email and embedding queues.
- Path aliases use `@/...` mappings in `tsconfig.json` and Jest configs; keep aliases in sync if adding a new top-level source area.
- `nestjs-i18n` writes generated types to `src/generated/i18n.generated.ts`; ESLint ignores that generated file.
- Nest assets include `src/i18n/**/*` and `**/*.hbs` templates; do not move mail templates without updating `nest-cli.json`.

## Git Hooks
- `lint-staged` runs `pnpm lint` and `pnpm format` for staged `*.ts` files.
- Pre-commit rejects branches that do not match `^(feature|feat|chore|fix|bugfix|hotfix|docs|refactor|test|build|perf|style|ci|release|merge)\.`.
- Pre-push runs `pnpm test` only when `*.ts` or `*.js` changed in `git diff --name-only HEAD HEAD~`.
- Commit messages use Conventional Commits via `commitlint.config.mjs`.

## Deployment
- The only current workflow is `.github/workflows/deploy.yml`: pushes to `main` SSH to the server, `git pull origin main`, then rebuild `todo-rag-api` and `migrate` with Docker Compose.
- `.releaserc` only declares `main` as the release branch; no release plugins are configured.
