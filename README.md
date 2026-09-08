# Insurance Claims Intelligence Platform

Phase 1 frontend for an insurance claims management platform.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- React Router, TanStack Query, React Hook Form, Zod, Lucide React

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Available Routes (Scaffolded)

| Route | Description |
|-------|-------------|
| `/login` | Login page |
| `/customer` | Customer dashboard |
| `/customer/claims` | My claims |
| `/customer/claims/submit` | Submit claim |
| `/customer/policies` | My policies |
| `/agent` | Agent dashboard |
| `/agent/claims` | Claims management |
| `/agent/customers` | Customer management |
| `/agent/policies` | Policy management |

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/       # App shell, sidebar, header
│   ├── claims/       # (future) claim-specific components
│   ├── policies/
│   ├── customers/
│   └── dashboard/
├── pages/
│   ├── auth/
│   ├── customer/
│   ├── agent/
│   └── admin/
├── services/         # API layer (mock → FastAPI later)
├── mock/             # Mock data
├── types/            # Shared TypeScript types
├── constants/        # Status enums, labels
├── hooks/
├── utils/
├── routes/
└── providers/
```

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build
