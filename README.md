# LinkDN Services

Marketplace de servicios profesionales para Colombia. Aplicacion movil (iOS/Android) con backend API.

## Arquitectura

```
linkdn-services/
  apps/
    backend/        # Next.js 14 (App Router) - API backend
    mobile/         # Expo + React Native - Aplicacion movil
  packages/
    shared/         # Esquemas Zod y tipos compartidos
  docker-compose.yml
```

**Stack:**
- **Mobile:** React Native + Expo + TypeScript, React Navigation, TanStack Query, React Hook Form + Zod
- **Backend:** Next.js 14 (App Router, Route Handlers), Prisma, PostgreSQL
- **Auth:** JWT custom (bcrypt + jsonwebtoken)
- **Email:** nodemailer + Mailhog (desarrollo)
- **Validacion:** Zod (compartida entre mobile y backend)

---

## Requisitos previos

- Node.js 20+
- Docker y Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Expo Go (app en tu celular) o emulador iOS/Android

---

## Inicio rapido

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd linkdn-services
npm install
```

### 2. Levantar infraestructura con Docker

```bash
docker compose up -d
```

Esto levanta:
- **PostgreSQL** en `localhost:5432` (usuario: postgres, contrasena: postgres, base: linkdn_services)
- **Mailhog** SMTP en `localhost:1025`, Web UI en `http://localhost:8025`

### 3. Configurar variables de entorno

Las variables de entorno reales (`apps/backend/.env`) **no se versionan**. Para desarrollo local, crea tu archivo a partir del template:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Si necesitas modificarlo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linkdn_services?schema=public"
JWT_SECRET="dev-secret-change-in-production-abc123"
SMTP_HOST="localhost"
SMTP_PORT=1025
SMTP_FROM="noreply@linkdn-services.co"
APP_URL="http://localhost:3000"
MOBILE_SCHEME="linkdn-services"
```

### 4. Ejecutar migraciones y seed

```bash
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

O desde la raiz:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Ejecutar el backend

```bash
npm run dev:backend
```

El backend estara disponible en `http://localhost:3000`.

### 6. Ejecutar la app movil

```bash
npm run dev:mobile
```

Escanea el codigo QR con Expo Go o presiona `a` para Android / `i` para iOS.

**Nota (API URL para mobile):** crea tu archivo a partir del template:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Para dispositivos fisicos, usa la IP de tu maquina:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

---

## Probar emails con Mailhog

1. Asegurate de que Docker este corriendo: `docker compose up -d`
2. Abre `http://localhost:8025` en tu navegador
3. Todos los correos enviados por la aplicacion apareceran aqui
4. Prueba creando una reserva: recibiras un correo de confirmacion

---

## Variables de entorno

| Variable | Descripcion | Default (dev) |
|---|---|---|
| `DATABASE_URL` | URL de conexion PostgreSQL | `postgresql://postgres:postgres@localhost:5432/linkdn_services` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `dev-secret-change-in-production-abc123` |
| `SMTP_HOST` | Host del servidor SMTP | `localhost` |
| `SMTP_PORT` | Puerto del servidor SMTP | `1025` |
| `SMTP_FROM` | Direccion de correo remitente | `noreply@linkdn-services.co` |
| `APP_URL` | URL base del backend | `http://localhost:3000` |
| `MOBILE_SCHEME` | Esquema de deep link | `linkdn-services` |
| `EXPO_PUBLIC_API_URL` | URL del API para la app movil | `http://10.0.2.2:3000` |

---

## Deep links y URL de respaldo

### Esquema de deep link
La app movil registra el esquema `linkdn-services://`. El enlace para gestionar una reserva es:

```
linkdn-services://booking/manage/<token>
```

### URL HTTPS de respaldo
Cuando un cliente recibe un correo de confirmacion, el enlace apunta a:

```
http://localhost:3000/booking/manage/<token>
```

Esta pagina web:
1. Muestra los detalles de la reserva
2. Intenta abrir la app movil via deep link
3. Si la app no esta instalada, permite cancelar desde la pagina web

### Configuracion en Expo
El esquema esta configurado en `apps/mobile/app.json`:
```json
{
  "expo": {
    "scheme": "linkdn-services"
  }
}
```

Y el linking en `apps/mobile/src/navigation/linking.ts` mapea:
```
linkdn-services://booking/manage/:token -> ManageBooking screen
```

---

## Datos de prueba (seed)

### Usuarios demo
| Email | Contrasena | Proveedor |
|---|---|---|
| maria@demo.co | password123 | Maria Estilista (Bogota) - Belleza |
| carlos@demo.co | password123 | TechnoFix SAS (Medellin) - Tecnologia |
| laura@demo.co | password123 | Laura Fitness (Bogota) - Fitness |

### Categorias
Belleza, Salud, Hogar y Oficios, Tecnologia, Mantenimiento, Educacion, Fitness y Deporte, Legal, Contabilidad, Fotografia, Diseno, Mascotas

---

## Endpoints API

### Auth
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesion |
| GET | `/api/auth/me` | Obtener usuario actual |

### Provider (requiere auth)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/workspaces` | Crear espacio de trabajo |
| GET | `/api/workspaces/current` | Obtener workspace actual |
| PUT | `/api/workspaces/current` | Actualizar workspace |
| GET | `/api/profile` | Obtener perfil |
| PUT | `/api/profile` | Crear/actualizar perfil |
| GET | `/api/services` | Listar servicios |
| POST | `/api/services` | Crear servicio |
| PUT | `/api/services/:id` | Actualizar servicio |
| DELETE | `/api/services/:id` | Eliminar servicio |
| GET | `/api/availability` | Obtener disponibilidad |
| PUT | `/api/availability` | Configurar disponibilidad |

### Marketplace (publico)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/categories` | Listar categorias |
| GET | `/api/marketplace/search` | Buscar proveedores |
| GET | `/api/marketplace/:slug` | Perfil publico del proveedor |

### Booking (publico)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | `/api/slots?slug=&serviceId=&from=&to=` | Obtener horarios disponibles |
| POST | `/api/bookings` | Crear reserva |
| GET | `/api/bookings/:token` | Obtener reserva por token |
| POST | `/api/bookings/:token/cancel` | Cancelar reserva |
| POST | `/api/bookings/:token/reschedule` | Reprogramar reserva |

---

## Reglas de negocio

- **Slug:** Unico, solo letras minusculas, numeros y guiones
- **Doble reserva:** Prevenida con transaccion de base de datos
- **Slots:** Incrementos de 30 minutos, descontando reservas confirmadas y buffers
- **Timezone:** Todos los calculos en America/Bogota
- **Cancelacion/Reprogramacion:** No permitida con menos de 6 horas de anticipacion
- **Token de gestion:** UUID unico, expira al momento de la reserva

---

## Checklist MVP completado

- [x] Registro e inicio de sesion (JWT custom)
- [x] Creacion de espacio de trabajo (PERSON/COMPANY)
- [x] Perfil publico del proveedor (slug unico, ciudad, categorias, descripcion)
- [x] CRUD de servicios (nombre, duracion, buffers, precio)
- [x] Configuracion de disponibilidad semanal
- [x] Busqueda en marketplace (ciudad, categoria, texto libre)
- [x] Perfil publico del proveedor con lista de servicios
- [x] Calculo de slots disponibles (30 min, timezone Bogota, buffers)
- [x] Creacion de reserva con prevencion de doble reserva
- [x] Token seguro para gestion de reserva
- [x] Cancelacion con politica de 6 horas
- [x] Reprogramacion con politica de 6 horas
- [x] Email de confirmacion de reserva
- [x] Email de cancelacion
- [x] Email de reprogramacion
- [x] Pagina web de respaldo para gestion de reserva
- [x] Deep link para gestion de reserva en app
- [x] Seed de datos demo (categorias, proveedores, servicios)
- [x] Docker Compose para Postgres + Mailhog
- [x] Esquemas Zod compartidos entre mobile y backend
- [x] Validacion de datos en todos los endpoints
- [x] Mensajes de error en espanol
- [x] UI en espanol, sin emojis
- [x] Token JWT almacenado con SecureStore
