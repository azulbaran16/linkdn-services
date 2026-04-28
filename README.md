# LinkDN Services

Marketplace for professional services (mobile + backend), targeting independent providers and small businesses in Colombia. iOS / Android app with a Next.js backend.

## Architecture

```
linkdn-services/
  apps/
    backend/        # Next.js 14 (App Router) - REST API
    mobile/         # Expo + React Native - mobile app
  packages/
    shared/         # Shared Zod schemas and types
  docker-compose.yml
```

## Stack

- **Mobile:** React Native + Expo + TypeScript, React Navigation, TanStack Query, React Hook Form + Zod
- **Backend:** Next.js 14 (App Router, Route Handlers), Prisma, PostgreSQL
- **Auth:** Custom JWT (bcrypt + jsonwebtoken)
- **Email:** Nodemailer + Mailhog (dev)
- **Validation:** Zod schemas shared between mobile and backend

## Requirements

- Node.js 20+
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Expo Go on a phone, or an iOS / Android emulator

## Quick start

```bash
git clone <repo-url>
cd linkdn-services
npm install

# Postgres + Mailhog
docker compose up -d

# Env files (templates committed, real values are not)
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# DB
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Run
cd ../..
npm run dev:backend   # http://localhost:3000
npm run dev:mobile    # scan QR with Expo Go
```

For physical devices, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP.

## Email testing

Mailhog runs from Docker Compose:

- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

Every email the app sends shows up there. Booking confirmation, cancellation and reschedule emails are wired in.

## Environment variables

| Variable | Purpose | Default (dev) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/linkdn_services` |
| `JWT_SECRET` | JWT signing secret | `dev-secret-change-in-production-...` |
| `SMTP_HOST` / `SMTP_PORT` | Outbound SMTP | `localhost` / `1025` |
| `SMTP_FROM` | From address | `noreply@linkdn-services.co` |
| `APP_URL` | Backend base URL | `http://localhost:3000` |
| `MOBILE_SCHEME` | Deep-link scheme | `linkdn-services` |
| `EXPO_PUBLIC_API_URL` | API URL for the mobile app | `http://10.0.2.2:3000` |

## Deep links and fallback URL

The app registers the `linkdn-services://` scheme. The booking-management deep link is:

```
linkdn-services://booking/manage/<token>
```

Confirmation emails point to an HTTPS fallback page that:

1. Renders the booking details.
2. Tries to open the app via deep link.
3. Falls back to a plain web cancel flow if the app is not installed.

## API surface (selected)

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Sign in |
| GET  | `/api/auth/me` | Current user |

### Provider (auth required)
| Method | Path | Description |
|---|---|---|
| POST/GET/PUT | `/api/workspaces*` | Workspace CRUD |
| GET/PUT | `/api/profile` | Public provider profile |
| GET/POST/PUT/DELETE | `/api/services*` | Service catalog |
| GET/PUT | `/api/availability` | Weekly availability |

### Marketplace (public)
| Method | Path | Description |
|---|---|---|
| GET | `/api/categories` | List categories |
| GET | `/api/marketplace/search` | Search providers |
| GET | `/api/marketplace/:slug` | Public provider page |

### Booking (public)
| Method | Path | Description |
|---|---|---|
| GET  | `/api/slots` | Available time slots |
| POST | `/api/bookings` | Create booking |
| GET  | `/api/bookings/:token` | Read booking by token |
| POST | `/api/bookings/:token/cancel` | Cancel |
| POST | `/api/bookings/:token/reschedule` | Reschedule |

## Business rules

- **Slug** — unique, lowercase letters, digits and dashes.
- **Double-booking prevention** — enforced inside a database transaction.
- **Slots** — 30-minute increments; existing bookings and configured buffers are subtracted.
- **Timezone** — all server-side calculations in `America/Bogota`.
- **Cancel / reschedule** — disallowed less than 6 hours before start.
- **Management token** — UUID per booking, invalidated when the booking starts.

## MVP checklist

- [x] Registration + sign-in (custom JWT).
- [x] Workspace creation (PERSON / COMPANY).
- [x] Public provider profile (slug, city, categories, description).
- [x] Service CRUD (name, duration, buffers, price).
- [x] Weekly availability configuration.
- [x] Marketplace search (city + category + free text).
- [x] Available-slot calculation (30 min, Bogota timezone, buffers).
- [x] Booking creation with double-booking prevention.
- [x] Secure token for booking management.
- [x] Cancellation with 6-hour policy.
- [x] Rescheduling with 6-hour policy.
- [x] Confirmation, cancellation and reschedule emails.
- [x] HTTPS fallback page for booking management.
- [x] Deep link for booking management in the app.
- [x] Demo seed (categories, providers, services).
- [x] Docker Compose for Postgres + Mailhog.
- [x] Zod schemas shared between mobile and backend.
- [x] JWT stored on device with SecureStore.
