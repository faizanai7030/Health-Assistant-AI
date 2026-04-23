# Clinic WhatsApp AI Agent

## Overview

A full-stack SaaS platform for hospitals and clinics. An AI agent (powered by GPT) attends WhatsApp messages, books appointments, checks doctor availability and slot capacity limits, and maintains a complete appointment record.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-5.4 via Replit AI Integrations

## Features

1. **WhatsApp AI Agent** — Receives messages, understands natural language, extracts patient details, checks doctor availability, and books appointments. Replies in the patient's language (Hindi, Urdu, English, etc.)
2. **Human-like AI Tone** — AI is named "Priya", speaks naturally like a WhatsApp chat, not robotic
3. **Multi-language Support** — AI detects patient language and responds in the same language
4. **Availability Checking** — Agent checks slot capacity (max patients per time slot per doctor) before booking
5. **Emergency Status** — Doctors can mark themselves "Late" or "Absent" from their portal; AI stops booking them
6. **Doctor Portal** — Each doctor has a unique mobile-friendly URL (no password needed). Shows today's schedule + big emergency buttons
7. **Patient Reminders** — Staff can generate WhatsApp reminder messages for all today's appointments
8. **Dashboard** — Real-time stats (doctors, today's appointments, weekly count, conversations)
9. **Doctor Management** — Add/edit doctors, configure working hours, slot duration, and max patients per slot. See portal link + emergency controls per card
10. **Appointment Log** — Full appointment history with filter by doctor/date/status
11. **Conversations** — WhatsApp conversation threads (full message history)
12. **Simulator** — Test the AI agent in a WhatsApp-style chat interface

## Multi-Tenant Architecture

One deployment serves all clinic clients. Each clinic has its own data, isolated by `clinicId`.

- **Auth**: Session-based login (express-session + bcrypt). Each clinic has admin email + password.
- **Session**: Stores `clinicId`, `clinicName`, `adminEmail`. All API routes filter data by clinic.
- **Super-admin**: `POST /api/auth/create-clinic` (requires `X-Admin-Key: <SUPER_ADMIN_KEY>` header) creates new tenants.
- **Demo credentials**: `admin@demo.com` / `demo1234` (clinic id=1)

## Architecture

- `artifacts/api-server` — Express 5 backend (doctors, appointments, conversations, dashboard routes)
- `artifacts/clinic-agent` — React + Vite frontend dashboard (with login page + auth context)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react` — Generated React Query hooks (custom-fetch sends `credentials: include`)
- `lib/api-zod` — Generated Zod validation schemas
- `lib/db` — Drizzle ORM schema and DB client
- `lib/integrations-openai-ai-server` — OpenAI SDK client

## DB Tables

- `clinics` — Multi-tenant clinic records (name, slug, adminEmail, passwordHash, isActive)
- `doctors` — Doctor records with schedule config (scoped by clinicId)
- `appointments` — Patient appointments (scoped by clinicId)
- `whatsapp_conversations` — Per-patient conversation records (scoped by clinicId)
- `whatsapp_messages` — Individual messages (user/assistant)
- `doctor_emergencies` — Emergency status (scoped by clinicId)
- `appointment_reminders` — Reminder log (scoped by clinicId)

## Environment Variables

- `SESSION_SECRET` — Secret for express-session cookie signing
- `SUPER_ADMIN_KEY` — Key to create new clinic tenants via API

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## WhatsApp Integration

The `/api/conversations/webhook` endpoint accepts `{ from, message }` and can be connected to WhatsApp Business API (via Twilio, Meta Cloud API, etc.). The AI agent processes messages, checks availability, and books appointments automatically.

The `/api/conversations/simulate` endpoint lets you test the agent from the built-in Simulator page.
