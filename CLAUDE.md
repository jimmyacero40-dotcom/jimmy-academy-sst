# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server on port 3000
npm run build    # Production build
npm start        # Run production build
npm run lint     # ESLint via next lint
```

No test framework is configured — there are no unit or integration tests.

## Architecture

**Jimmy Academy** is a Next.js 14 App Router application for managing occupational health and safety (SG-SST) in Colombia. It is a monolithic frontend-first project with a dark-themed dashboard.

- **Framework**: Next.js 14.2.0 with App Router (not Pages Router)
- **Language**: TypeScript 5.5.0
- **Styling**: Tailwind CSS 3.4.0 with a custom design system in `app/globals.css`
- **Animations**: Framer Motion 11.3.0
- **Icons**: Lucide React
- **Fonts**: Sora (UI) + JetBrains Mono (code/data)

### Path Aliases (tsconfig.json)

```
@/*          → root
@/components → components/
@/lib        → lib/
@/app        → app/
```

### Key Files

| File | Purpose |
|------|---------|
| `app/globals.css` | Master design system: CSS variables, glass morphism, animations, gradients |
| `app/layout.tsx` | Root layout with SEO metadata |
| `app/page.tsx` | Public landing page |
| `app/login/page.tsx` | Login form |
| `app/dashboard/layout.tsx` | Dashboard shell: collapsible sidebar (60px/240px), top header, mobile nav |
| `app/dashboard/page.tsx` | Dashboard home: stats cards, activity feed, compliance tracking |
| `lib/utils.ts` | Shared utilities (see below) |
| `tailwind.config.ts` | Extended theme: custom colors, animations, shadows |
| `next.config.js` | Security headers, CSS optimization, image formats |

### Utilities (`lib/utils.ts`)

- `cn()` — Tailwind class merging (clsx + tailwind-merge)
- `formatNumber()`, `formatPercent()` — Colombian locale (es-CO) formatting
- `timeAgo()` — Relative time strings in Spanish
- `isValidNIT()` — Colombian NIT (tax ID) validation
- `getInitials()` — Avatar initials from name
- `truncate()` — Text truncation

### Design System

**Colors** (enforced dark mode):
- `primary`: Blue (#3B82F6)
- `sst`: Emerald Green (#10B981)
- Dark surfaces: `#0A0F1E`, `#0D1629`, `#111827`

**Reusable CSS classes** (defined in `globals.css`):
- `.glass` / `.glass-card` — frosted glass effect / interactive hover card
- `.gradient-primary`, `.gradient-sst` — brand gradients
- `.stat-card` — dashboard metric card template
- `.skeleton` — loading shimmer animation
- Stagger delay classes: `.delay-100` through `.delay-800`

### Dashboard Navigation (11 items)

Dashboard → Usuarios → Capacitaciones → Firmas → Certificados → Evaluaciones → Reportes → Auditoría → IA SST → Notificaciones → Configuración

Routes follow the pattern `/dashboard/<module>`. Most module pages are planned but not yet implemented — the sidebar links exist but the pages may be stubs.

### Backend / Auth Status

The app is **frontend-only** — all dashboard data is mocked. The README references these integrations as planned:
- **Auth**: NextAuth.js (`NEXTAUTH_SECRET`, `NEXTAUTH_URL` env vars required)
- **Database**: PostgreSQL (`DATABASE_URL` env var required)

Neither is wired up in the current codebase. There is no database layer, API routes, or server actions implemented yet.
