# PSC CRM Frontend

Next.js frontend for the PSC CRM dashboard.

## Tech stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for API state

## Quick start

```bash
cd crm_frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Use `.env.local` for local development.

Required:

- `NEXT_PUBLIC_API_URL` (example: `http://localhost:8000`)

## Handoff health checks

```bash
npm run lint
npm run build
```

Both checks should pass before release/handoff.

## Runtime expectations

- Backend API must be running and reachable at `NEXT_PUBLIC_API_URL`.
- Auth/session flow expects backend routes under `/api/*`.

## Progression roadmap

Future work is tracked in `ProgressionPlan.md` with these phases:

1. Admin override + read-only admin chat
2. Team activity analytics wiring
3. Stripe live payment flow
4. Scaling work (pagination/infinite scroll/routing/indexes)
5. Reliability and CI test coverage
