# LinkDN Services — Full Redesign

## Visual Identity

### Brand Colors
```
Primary:        #FF6B35  (coral/orange — CTAs, active states)
Primary Dark:   #E5552A  (pressed states, headers)
Primary Light:  #FFF0EB  (light tint backgrounds, tags)

Neutral 900:    #1A1A1A  (main text)
Neutral 700:    #4A4A4A  (secondary text)
Neutral 500:    #8E8E8E  (muted text, placeholders)
Neutral 200:    #E8E8E8  (borders, dividers)
Neutral 100:    #F5F5F5  (screen backgrounds)
Neutral 50:     #FAFAFA  (card backgrounds)
White:          #FFFFFF  (elevated surfaces)

Success:        #22C55E
Danger:         #EF4444
Warning:        #F59E0B
Info:           #3B82F6
```

### Typography
- Headings: Inter bold 700 (system font bold fallback)
- Body: Inter regular 400, medium 500
- Scale: 12 / 14 / 16 / 18 / 24 / 32

### Spacing
- Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48
- Screen padding: 20px horizontal

### Border Radius
- Small (inputs, tags): 8px
- Medium (cards, buttons): 12px
- Large (modals, sheets): 20px
- Full (avatars, pills): 9999px

### Shadows
- Card: 0 2px 8px rgba(0,0,0,0.06)
- Elevated: 0 4px 16px rgba(0,0,0,0.10)

---

## Components

### Button
- Primary: #FF6B35 bg, white text, 12px radius, 50px height, bold 600
- Secondary: white bg, #FF6B35 text, 1px border #FF6B35
- Ghost: transparent, #FF6B35 text, no border
- Danger: #EF4444 bg, white text
- Pressed: darken 10% + scale 0.97
- Disabled: 40% opacity
- Loading: spinner replacing text, maintain width

### Input
- 52px height, #F5F5F5 bg, 8px radius
- No border default, 2px #FF6B35 border on focus (animated)
- Label above in Neutral 700, 14px medium
- Error: #EF4444 border + error text 12px
- Icon support (left/right)

### Card
- White bg, 12px radius, 1px border #E8E8E8, 16px padding
- Tappable variant: scale 0.98 on press
- Elevated variant: shadow

### Badge / Tag
- #FFF0EB bg, #FF6B35 text, 8px radius, 6/12px padding

### Skeleton Loader
- Shimmer #E8E8E8 -> #F5F5F5 gradient animated
- Matches shape of content it replaces

### Bottom Sheet
- 20px top radius, drag handle, backdrop blur
- Replaces full-screen modals for filters/confirmations

---

## Onboarding — Setup Wizard

After registration, redirect to 4-step wizard:

### Step 1 — Tu negocio
- Workspace type: two large tappable cards (Persona / Empresa)
- Business name input
- Progress bar: Step 1 of 4, #FF6B35 fill

### Step 2 — Tu perfil publico
- Slug input with live preview: linkdn.co/tu-slug
- City selector (dropdown with search)
- Description textarea with character count
- Category multi-select: horizontal chips, #FFF0EB -> #FF6B35 selected

### Step 3 — Tu primer servicio
- Name, description
- Duration picker: pre-set pills (30m, 45m, 1h, 1.5h, 2h) + custom
- Price input with $ prefix and COP label
- Buffer inputs collapsed under "Opciones avanzadas"

### Step 4 — Tu disponibilidad
- Week grid: 7 day columns, tap toggle
- Active days show time range pickers
- Quick-fill: "Lunes a Viernes 8:00-18:00" preset
- Preview: "Disponible 5 dias, 50 horas/semana"

### Finish
- Success screen with confetti-style animation
- CTAs: "Ver mi perfil publico" (primary) / "Ir al dashboard" (secondary)

---

## Marketplace Discovery

### Home (default state)
- Greeting: "Hola, [name]" with avatar
- Search bar: 52px, #F5F5F5, search icon
- Category grid: 2 columns, icon + label, soft colored bg
- "Cerca de ti": horizontal scroll provider cards
- "Populares": vertical list top-booked providers

### Search Results
- Filter chips: horizontal scroll (Ciudad, Categoria, Precio, Ordenar)
- Chip tap -> bottom sheet
- Result cards: avatar, name, city tag, category pills, price "Desde $XX.XXX COP"
- Skeleton loaders while fetching
- Empty state: illustration + suggestion

### Provider Profile
- Hero: cover color band + avatar overlapping
- Name, city, category tags
- Services list: cards with name, duration pill, price, "Agendar" CTA
- Reviews section (future placeholder)
- Sticky bottom bar: "Agendar con [name]"

---

## Booking Flow — 3 Steps

### Step 1 — Seleccionar Fecha
- Horizontal scrollable calendar (30 days)
- Selected: circle #FF6B35
- Unavailable: gray, not tappable
- Service summary card fixed below

### Step 2 — Seleccionar Hora
- Slot grid: 44px pills, 3 columns
- Available: border #E8E8E8
- Selected: bg #FF6B35, white text
- No slots: message + next available day suggestion
- Fade-in transition on day change

### Step 3 — Confirmar Reserva
- Existing client: pre-filled data
- New client: 3 inputs (name, email, phone)
- Summary card: provider, service, date/time, price
- "Confirmar reserva" button

### Success Screen
- Animated check icon (scale-in)
- "Reserva confirmada!"
- Summary + email confirmation note
- CTAs: "Ver mi reserva" / "Volver al inicio"

---

## Client Profiles + Service History

### Client Profile Model
- ClientProfile: email (unique), name, phone, auto-created on first booking
- MagicLinkToken: token, clientId, expiresAt (24h)
- Booking now references ClientProfile instead of loose fields

### Provider Side — "Mis Clientes"
- Search bar at top
- List: avatar (initials), name, email, last visit, total visits
- Frequency badge: "Frecuente" (3+ visits) in #FFF0EB
- Sort by: last visit, most frequent, name
- Client detail: stats (visits, last service, total spent), history, CTAs (Reagendar, Enviar notificacion)

### Client Side — "Mis Citas" (tab in client role)
- Magic link access via email after first booking
- Upcoming appointments: cards with date, time, provider, service, status
- History: past appointments list with "Volver a agendar" CTA
- Favorite providers: 2+ bookings, horizontal scroll with "Agendar" direct

---

## Scheduled Notifications System

### Automatic Rules
- Post-service reminder: configurable days (15, 30, 45, 60, 90, custom)
- Pre-appointment reminder: 24h, 12h, 6h, 2h (default 24h)
- Toggle on/off per service
- Templates with variables: {clientName}, {serviceName}, {providerName}, {lastDate}

### Manual (Mini-CRM)
- Individual: from client detail, composer with subject + message + variables + schedule
- Mass campaign: select audience (all, by service, by last visit, frequent), composer, schedule, confirmation

### Notifications Screen (provider tab Mi Negocio)
- Tab "Reglas automaticas": active rules with toggles
- Tab "Campanas": history with status (scheduled, sent, failed) + metrics
- Tab "Historial": all notifications log, filterable by client

### Data Models
- NotificationRule: workspaceId, type, days/hours, serviceId, template, active
- Campaign: workspaceId, subject, message, audienceFilter (JSON), scheduledAt, status
- CampaignRecipient: campaignId, clientProfileId, sentAt, status
- NotificationLog: workspaceId, clientProfileId, type, sentAt, template

### Backend
- Cron job: hourly check for active rules + scheduled campaigns
- Email via Nodemailer (existing system)
- Future: push notifications via Expo Notifications

---

## Role System + Navigation

### Role Selection (on register / first login)
- "Como quieres usar LinkDN?"
- Two large cards: "Ofrecer servicios" / "Buscar servicios"
- Saved locally + user profile

### Provider Navigation (3 tabs)
1. Mi Negocio — dashboard, profile, services, availability, clients, notifications
2. Explorar — marketplace
3. Perfil — account, role switch, logout

### Client Navigation (3 tabs)
1. Explorar — marketplace, search, discovery
2. Mis Citas — upcoming, history, favorite providers
3. Perfil — account, role switch, logout

### Role Switch
- From Perfil tab -> "Cambiar a [Proveedor/Cliente]"
- Fade transition between tab sets
- First-time provider: launches Setup Wizard
- Existing provider: switches directly

### Profile Tab (shared, adapted by role)
- Avatar with initials
- Name and email
- Account section: edit name, change password
- App section: switch role
- Logout: ghost danger button
- App version in muted text

---

## Animations (subtle & functional)

- Screen transitions: standard slide (stack), fade crossfade 200ms (tabs), fade 300ms (role switch)
- Button press: scale 0.97 (100ms, reanimated)
- Card press: scale 0.98 + opacity 0.8
- Skeleton loaders: shimmer on all lists
- Content fade-in: 200ms replacing skeleton
- Pull-to-refresh: #FF6B35 indicator
- Booking step change: horizontal slide
- Slot selection: scale-in 1.05 -> 1.0 spring
- Success check: scale 0 -> 1 bounce
- Toast: slide-in top 300ms + auto-dismiss 3s
- Toggle: spring animation

### New Libraries
- react-native-reanimated (Expo compatible)
- @gorhom/bottom-sheet
- Shimmer via reanimated

---

## Implementation Order

### Phase 1 — Foundations
1. New theme (colors, typography, spacing, tokens)
2. Base components redesign (Button, Input, Card, Badge, Skeleton, BottomSheet)
3. Role system + new navigation (3 tabs per role)

### Phase 2 — Core Screens Redesigned
4. Role selection screen
5. Onboarding wizard (4 steps)
6. Provider dashboard (redesigned)
7. Marketplace discovery (categories, near you, search)
8. Provider profile (redesigned)
9. Booking flow (3 steps with summary)

### Phase 3 — New Features
10. Data models: ClientProfile, MagicLinkToken (Prisma + migrations)
11. Backend API: client + magic link endpoints
12. "Mis Clientes" screen (provider)
13. "Mis Citas" screen (client) + magic link auth
14. Data models: NotificationRule, Campaign, NotificationLog
15. Backend API: notifications + campaigns endpoints
16. Cron/scheduled job for automatic sending
17. Notifications screen (rules + campaigns + history)

### Phase 4 — Polish
18. Animations and micro-interactions
19. Skeleton loaders on all screens
20. Profile tab with role switch
21. Testing and final adjustments
