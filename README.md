# BeFin

**Beginner's Financials PWA.** Show how today's choices shape tomorrow's options.

Most finance apps answer "what did I spend?" BeFin answers the questions people actually have: *Can I pay my bills? How long could I survive a layoff? Am I saving enough? Is my credit improving? Am I helping or hurting Future Me?*

## MVP (this repo)

| Screen | What it shows |
| --- | --- |
| Overview | FutureProof Score (0-1000), monthly money flow, tax reality |
| Safety | Emergency fund monitor, "What if I lost my job tomorrow?" simulator |
| Retire | Goal vs projected retirement age, contribution slider |
| Credit | FICO history, credit health factors, links to the bureaus |
| What If | Change one thing, see the effect on retirement, emergency fund, card interest and score |

Installable PWA (manifest, service worker, icons) that works offline after the first visit.
All data stays in the browser (`localStorage`). No account, no backend yet.

## Stack

Next.js (static export) · React · TypeScript · Tailwind CSS v4 · Vitest

The calculation engine is plain TypeScript in `lib/engine.ts` with tests in `lib/engine.test.ts`.
Planned later (see the project outline): ASP.NET Core API, PostgreSQL, Entra External ID login, Azure hosting.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine unit tests
npm run typecheck
npm run lint
npm run build      # static site in ./out
```

## Assumptions (estimates for learning, not tax or investment advice)

- Federal tax: 2025 brackets and standard deduction, wage income only.
- State tax: none for states without a wage income tax, otherwise a rough flat rate.
- Retirement: 5% yearly return after inflation, steady pay, target of 25x yearly spending
  (with debt paid off), employer match counted, Social Security ignored.
- Money left after expenses is assumed to go into savings.

## Design note

The palette is blue and orange rather than red and green, and every status is also shown with
words and symbols (▲ ▼ ✓), so nothing depends on color alone.
