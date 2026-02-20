# Reporte de Implementacion — Soiling Calc SaaS

> Documento generado: 2026-02-19
> Stack: Next.js 16 + React 19 + TypeScript + Supabase + Tailwind CSS 3.4
> Arquitectura: Feature-First en `src/features/`

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Final del Proyecto](#estado-final-del-proyecto)
3. [FASE 1 — Marketing Funnel](#fase-1--marketing-funnel)
4. [FASE 2 — Lead Activation](#fase-2--lead-activation)
5. [FASE 3 — Hardening & Auth](#fase-3--hardening--auth)
6. [FASE 4 — Content Swap & UX Fix](#fase-4--content-swap--ux-fix)
7. [FASE 5 — Visual Rebrand & Delete Confirmations](#fase-5--visual-rebrand--delete-confirmations)
8. [FASE 6 — Production Hardening](#fase-6--production-hardening)
9. [Arquitectura Final](#arquitectura-final)
10. [Aprendizajes y Auto-Blindaje](#aprendizajes-y-auto-blindaje)

---

## Resumen Ejecutivo

El proyecto **Soiling Calc** es una plataforma SaaS para el monitoreo del soiling fotovoltaico. Se construyo sobre un template legal (LexAgenda) y se transformo completamente a traves de 6 fases de implementacion hasta lograr un producto coherente, seguro y listo para produccion.

### Metricas finales

| Metrica | Valor |
|---------|-------|
| Rutas totales | 22 pages + 1 API route |
| Componentes | 50 (.tsx) |
| Server Actions | 11 funciones en 4 archivos |
| Features | 9 modulos (auth, plants, readings, soiling, irradiance, leads, demo, marketing, template) |
| Errores TypeScript | 0 |
| Referencias LexAgenda | 0 |
| Referencias teal (template) | 0 |
| Build status | Exitoso (21 rutas compiladas) |

### Origen: Template LexAgenda

El punto de partida fue un template SaaS de bufete legal ("LexAgenda") con:
- Tema visual teal (verde azulado)
- Iconos de balanza de justicia y mazo de juez
- Contenido sobre derecho familiar, abogados, citas legales
- E2E tests para rutas `/lawyers`, `/appointments`
- Seed SQL con abogados ficticios

Las 6 fases transformaron este template en un producto solar completamente diferente.

---

## Estado Final del Proyecto

### Estructura de directorios

```
src/
├── app/                          # Next.js App Router (22 pages)
│   ├── (auth)/                   # Login, Signup, Forgot/Reset Password
│   ├── (main)/                   # Dashboard, Plants CRUD, Readings, Admin
│   ├── (marketing)/              # Landing, Demo, Apply, Waitlist, Thanks
│   ├── (public)/                 # Equipo, Servicios, Contacto, Legal
│   ├── api/plants/[id]/export/   # CSV export endpoint
│   ├── error.tsx                 # Error boundary personalizado
│   └── not-found.tsx             # Pagina 404 personalizada
│
├── actions/                      # Server Actions (4 archivos, 11 funciones)
│   ├── auth.ts                   # Autenticacion
│   ├── plants.ts                 # CRUD plantas (5 funciones)
│   ├── readings.ts               # Lecturas + motor soiling (3 funciones)
│   └── leads.ts                  # Gestion leads admin (3 funciones)
│
├── features/                     # Feature-First (9 modulos)
│   ├── auth/components/          # 4 formularios de autenticacion
│   ├── plants/components/        # PlantCard, PlantForm, DeletePlantButton, etc.
│   ├── readings/components/      # ReadingForm, ReadingList, DeleteReadingButton
│   ├── soiling/components/       # ChartsSection, SoilingChart, LossesChart
│   ├── soiling/services/         # soilingCalculator.ts (motor NOCT)
│   ├── irradiance/services/      # openMeteoClient.ts, irradianceService.ts
│   ├── leads/                    # ApplyForm, schema
│   ├── demo/                     # DemoKPIs, DemoReadingTable
│   └── marketing/                # MarketingNav, LandingHero, FAQ, Footer
│
├── components/                   # Componentes compartidos
│   ├── ui/                       # Button, Card, Input, Select, Badge, ConfirmDialog
│   ├── layout/                   # Header, Sidebar, MainShell
│   └── public/                   # Navbar, Footer, HeroSection, 11 mas
│
├── config/siteConfig.ts          # Configuracion centralizada del sitio
├── lib/                          # Infraestructura (auth, env, supabase, email)
└── middleware.ts                  # Proteccion de rutas via Supabase Auth
```

---

## FASE 1 — Marketing Funnel

### Objetivo
Construir el embudo de conversion completo: desde la landing page hasta el registro de leads, con limite de 1 planta por usuario gratuito.

### Archivos creados

| Archivo | Proposito |
|---------|-----------|
| `src/app/(marketing)/page.tsx` | Landing page con hero, features, FAQ |
| `src/app/(marketing)/demo/page.tsx` | Demo interactiva con datos ficticios |
| `src/app/(marketing)/apply/page.tsx` | Formulario de solicitud de acceso |
| `src/app/(marketing)/apply/actions.ts` | Server action para crear lead en Supabase |
| `src/app/(marketing)/waitlist/page.tsx` | Pagina de lista de espera |
| `src/app/(marketing)/thanks/page.tsx` | Confirmacion post-registro |
| `src/app/(marketing)/layout.tsx` | Layout marketing (MarketingNav + MarketingFooter) |
| `src/features/marketing/components/` | MarketingNav, LandingHero, LandingFeatures, LandingFAQ, MarketingFooter |
| `src/features/demo/components/` | DemoKPIs, DemoReadingTable |
| `src/features/leads/schemas/` | Zod schema para validacion de leads |
| `src/lib/demoData.ts` | Datos ficticios para la demo |

### Logica de negocio implementada

1. **Embudo**: Landing → Demo → Apply → Waitlist/Thanks
2. **Lead capture**: Formulario con nombre, email, tamano de planta, sistema de monitoreo
3. **Limite free tier**: `plants/new/page.tsx` verifica `count >= 1` antes de permitir crear planta
4. **Trial banner**: Layout principal muestra banner si `trial_ends_at < now()`

### Impacto
- 7 rutas nuevas (marketing + confirmacion)
- 5 componentes de marketing reutilizables
- Pipeline de conversion lead → trial user

---

## FASE 2 — Lead Activation

### Objetivo
Permitir al admin convertir leads en usuarios activos con cuenta Supabase Auth y email de bienvenida.

### Archivos creados/modificados

| Archivo | Accion | Proposito |
|---------|--------|-----------|
| `src/actions/leads.ts` | Creado | `getLeads()`, `updateLeadStatus()`, `activateLead()` |
| `src/app/(main)/admin/leads/page.tsx` | Creado | Panel admin con tabla de leads |
| `src/features/leads/components/LeadsTable.tsx` | Creado | Tabla interactiva con status badges |
| `src/lib/email/resend.ts` | Creado | Servicio Resend para emails transaccionales |
| `src/lib/email/index.ts` | Creado | Barrel export |
| `src/components/layout/Sidebar.tsx` | Modificado | Link "Admin > Leads" visible solo para admin |

### Flujo de activacion

```
Admin ve leads → Cambia status → Click "Activar" →
  1. Genera password temporal
  2. Crea usuario en auth.users via service role
  3. Inserta trial_ends_at (30 dias) en tabla users
  4. Envia email de bienvenida via Resend (fallo no bloqueante)
  5. Actualiza status del lead a 'active'
```

### Decisiones tecnicas

- **Service role client**: Se usa `createServiceClient()` para crear usuarios (bypasses RLS)
- **Email graceful fail**: Si Resend falla, la activacion continua — el email es informativo, no critico
- **Admin gate**: `requireAdmin()` verifica `user.email === process.env.ADMIN_EMAIL`

---

## FASE 3 — Hardening & Auth

### Objetivo
Reforzar la seguridad, la coherencia del branding en auth y cerrar rutas legacy del template.

### Cambios realizados

| Area | Cambio | Archivos |
|------|--------|----------|
| Trial enforcement | Bloquear creacion de plantas/lecturas si trial expirado | `plants/new/page.tsx`, `readings/new/page.tsx` |
| Auth branding | Reescribir formularios con branding Soiling Calc | `LoginForm.tsx`, `SignupForm.tsx`, `ForgotPasswordForm.tsx` |
| Signup block | Bloquear registro publico (solo invitacion via admin) | `signup/page.tsx` |
| Password link | Agregar "Cambiar contrasena" en sidebar | `Sidebar.tsx` |
| Legacy cleanup | Eliminar rutas inexistentes del template | Varias redirecciones |

### Patron de trial enforcement

```tsx
// En plants/new y readings/new:
const { expired } = await checkTrialStatus()
if (expired) {
  return <TrialExpiredCard />  // Con link mailto para contacto
}
```

---

## FASE 4 — Content Swap & UX Fix

### Objetivo
Reemplazar todo el contenido legal del template por contenido solar, arreglar errores de UX y eliminar codigo muerto.

### Reescritura de siteConfig

El archivo `src/config/siteConfig.ts` (272 lineas) fue completamente reescrito:

| Campo | Antes (LexAgenda) | Despues (Soiling Calc) |
|-------|-------------------|----------------------|
| `firmName` | "LexAgenda" | "Soiling Calc" |
| `firmSlogan` | "Tu bufete legal de confianza" | "Monitorea la suciedad de tus paneles solares" |
| `services[]` | divorcio, custodia, pension | soiling, irradiancia, limpieza |
| `team[]` | Dr. Juan Perez (abogado) | Equipo Soiling Calc (ingenieria solar) |
| `testimonials[]` | Casos legales | Usuarios de plantas solares |
| `values[]` | Respeto, dignidad | Precision cientifica, datos accionables |
| `navigation[]` | Servicios Legales, Directorio | Producto, Demo, Solicitar Acceso |

### UX Fix: PlantForm error display

**Problema**: Los errores de validacion Zod no se mostraban al usuario.
**Solucion**: Se agrego `fieldErrors` display bajo cada campo con `text-red-600`.

### Codigo muerto eliminado

| Archivo/Carpeta | Razon |
|-----------------|-------|
| `src/types/database.ts` | Tipos LexAgenda (Profile, Lawyer, etc.) sin importers |
| `src/hooks/useAuth.ts` | Importaba de database.ts, nunca usado |
| `src/components/notifications/` | NotificationCenter legacy, nunca montado |

### Paginas publicas reescritas

- **Privacidad** (`/privacidad`): Reescrita para SaaS de monitoreo solar
- **Terminos** (`/terminos`): Reescrita con clausulas relevantes a datos meteorologicos
- **Equipo** (`/equipo`): De "Equipo Legal" a "Nuestro Equipo" de ingenieria solar
- **Servicios** (`/servicios`): De areas de practica legal a producto (Soiling, Irradiancia, Limpieza)

---

## FASE 5 — Visual Rebrand & Delete Confirmations

### Objetivo
Eliminar la incoherencia visual (teal del template vs. slate/amber del producto) y agregar dialogos de confirmacion para eliminar plantas y lecturas.

### Parte 1: Rebrand de colores (17 archivos)

**Mapeo sistematico teal → slate/amber:**

| Patron teal | Reemplazo | Uso |
|------------|-----------|-----|
| `from-teal-900/800/700` | `from-slate-900 via-slate-800 to-slate-700` | Hero, headers |
| `bg-teal-950` | `bg-slate-900` | Footer |
| `bg-teal-600 hover:bg-teal-700` | `bg-amber-500 hover:bg-amber-600` | Botones CTA |
| `bg-teal-50` | `bg-amber-50` | Fondos de acento |
| `text-teal-600` | `text-amber-600` | Texto de acento |
| `focus:ring-teal-500` | `focus:ring-amber-500` | Focus de inputs |

**Archivos modificados (5 batches paralelos):**

- **Batch A**: HeroSection, Footer, Navbar, MobileMenu
- **Batch B**: TopBar, CTABanner, ContactSection, ContactForm, TestimonialsCarousel, AboutSection
- **Batch C**: SectionHeading, ServicesGrid, ValueCards, TabbedContent
- **Batch D**: equipo/page.tsx, servicios/page.tsx, contacto/page.tsx
- **Batch E**: tailwind.config.ts (eliminacion de paleta teal custom)

**Contenido legal descubierto durante el rebrand:**
- TopBar: "Servicios de derecho familiar" → "Monitoreo de soiling fotovoltaico"
- CTABanner: "caso de derecho familiar" → CTA solar
- ServicesGrid: "divorcio y derecho familiar" → "herramientas para paneles"
- TabbedContent: "Servicios juridicos" → "Tecnologia de Soiling Calc"
- AboutSection: "Derecho de Familia" → "Equipo de especialistas en monitoreo solar"

### Parte 2: Delete Confirmations (3 componentes nuevos)

#### ConfirmDialog (componente reutilizable)

```
Archivo: src/components/ui/confirm-dialog.tsx
Patron: createPortal → document.body
Props: open, onConfirm, onCancel, title, description, confirmLabel, variant
Features: useTransition (pending state), Escape key, backdrop click, z-[100]
```

#### DeletePlantButton

```
Archivo: src/features/plants/components/DeletePlantButton.tsx
Trigger: Boton rojo en "Zona de peligro" de settings
Accion: deletePlant(id) → redirect('/plants')
Integracion: settings/page.tsx agrego seccion danger zone
```

#### DeleteReadingButton

```
Archivo: src/features/readings/components/DeleteReadingButton.tsx
Trigger: Icono trash en cada fila de ReadingList
Accion: deleteReading(id, plantId) → revalidatePath
Integracion: ReadingList recibe plantId, nueva columna de acciones
```

### Verificacion

- `grep -ri "teal" src/` → 0 resultados
- TypeScript: 0 errores
- Build: 21 rutas exitosas

---

## FASE 6 — Production Hardening

### Objetivo
Cerrar las brechas restantes para produccion: iconos legales, middleware de auth, paginas de error, limpieza de artefactos legacy, documentacion de env vars y centralizacion de emails.

### Parte 1: Iconos solares (reemplazo de iconos legales)

**Problema**: `ScaleIcon` (balanza de justicia) era el logotipo de la marca en Navbar, Footer y MobileMenu. `GavelIcon` (mazo de juez) aparecia en ValueCards. `ServiceIcon` mapeaba casos legales (divorce, custody) pero siteConfig usaba 'soiling', 'irradiance', 'cleaning' — todos caian al default `ScaleIcon`.

**Solucion**:

5 nuevos iconos SVG creados en `src/components/public/icons/index.tsx`:

| Icono | SVG | Uso |
|-------|-----|-----|
| `SunIcon` | Sol con rayos | Logo de marca (Navbar, Footer, MobileMenu) |
| `SolarPanelIcon` | Panel solar con celdas | ServiceIcon: soiling, default |
| `SparklesIcon` | Destellos | ServiceIcon: cleaning |
| `ChartBarIcon` | Grafico de barras | ServiceIcon: monitoring, ValueIcon: results |
| (SunIcon) | (mismo) | ServiceIcon: irradiance, ValueIcon: experience |

**ServiceIcon switch actualizado:**

```
Antes                          Despues
'divorce' → DocumentIcon       'soiling' → SolarPanelIcon
'custody' → HomeIcon           'irradiance' → SunIcon
'alimony' → DollarIcon         'cleaning' → SparklesIcon
'criminal' → GavelIcon         'export' → DocumentIcon
default → ScaleIcon            'monitoring' → ChartBarIcon
                               default → SolarPanelIcon
```

**7 iconos legales muertos eliminados**: ScaleIcon, GavelIcon, HeartIcon, HandshakeIcon, HomeIcon, DollarIcon, AlertIcon.

**ValueCards labels corregidos** (`src/components/public/ValueCards.tsx:19`):

```
Antes (legal)                  Despues (solar)
"Respeto y dignidad"           "Tecnologia avanzada"
"Cada caso es unico"           "Datos accionables"
"Equipo experimentado"         "Cero hardware extra"
```

### Parte 2: Middleware de autenticacion

**Problema**: No existia `src/middleware.ts`. Cada pagina verificaba auth individualmente — si se agregaba una ruta nueva sin verificacion, quedaba desprotegida.

**Archivos creados:**

| Archivo | Proposito |
|---------|-----------|
| `src/middleware.ts` (47 lineas) | Proteccion centralizada de rutas |
| `src/lib/supabase/middleware.ts` (36 lineas) | Helper `updateSession` para refresh de cookies |

**Logica del middleware:**

```
Request entrante
  ↓
¿Ruta publica? (/, /login, /servicios, /demo, /apply, etc.)
  → SI: updateSession() y pasar
  → NO: updateSession() y verificar user
         → Sin user: redirect a /login
         → Con user: pasar
```

**Matcher config**: Excluye `_next/static`, `_next/image`, `favicon.ico`, `api/`, archivos estaticos.

### Parte 3: Paginas de error personalizadas

| Archivo | Tipo | Titulo | Acciones |
|---------|------|--------|----------|
| `src/app/not-found.tsx` | Server Component | "404 — Pagina no encontrada" | "Ir a Mis Plantas", "Volver al inicio" |
| `src/app/error.tsx` | Client Component | "Algo salio mal" | "Intentar de nuevo" (reset), "Ir a Mis Plantas" |

### Parte 4: Limpieza de artefactos legacy

**E2E tests eliminados (8 archivos):**

Todos referenciaban LexAgenda, abogados, citas. Irrecuperables para Soiling Calc.

```
e2e/appointments.spec.ts    → ELIMINADO
e2e/lawyers.spec.ts         → ELIMINADO
e2e/auth.spec.ts            → ELIMINADO
e2e/dashboard.spec.ts       → ELIMINADO
e2e/navigation.spec.ts      → ELIMINADO
e2e/admin-dashboard.spec.ts → ELIMINADO
e2e/helpers.ts              → ELIMINADO
e2e/setup/admin.setup.ts    → ELIMINADO
```

**seed.sql reemplazado:**

| Antes (LexAgenda) | Despues (Soiling Calc) |
|-------------------|----------------------|
| 4 usuarios `@lexagenda.com` | 1 usuario `admin@soiling.test` |
| Tabla `lawyers` con especialidades legales | Tabla `plants` con planta de ejemplo (10kWp Madrid) |
| Tabla `availability` (horarios de abogados) | Trial activo por 30 dias |
| Roles: lawyer | Roles: authenticated |

**Paquete eliminado:**
- `@types/qrcode` — instalado pero sin ninguna importacion en `src/`

### Parte 5: Documentacion de env vars y centralizacion de emails

**.env.local.example actualizado:**

```env
# Antes: solo 2 variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Despues: 7 variables documentadas
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_EMAIL=admin@yourdomain.com
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Emails centralizados** — `"hola@soilingcalc.com"` estaba hardcodeado en 6 archivos. Se reemplazo con `siteConfig.contact.email` en 4 archivos (los 2 restantes son la fuente de verdad en siteConfig y un fallback server-side en resend.ts):

| Archivo | Cambio |
|---------|--------|
| `src/app/(main)/layout.tsx` | `href="mailto:..."` → `href={mailto:${siteConfig.contact.email}}` |
| `src/app/(main)/plants/new/page.tsx` | 2 ocurrencias reemplazadas |
| `src/app/(main)/plants/[id]/readings/new/page.tsx` | 1 ocurrencia reemplazada |
| `src/features/marketing/components/MarketingFooter.tsx` | 1 ocurrencia reemplazada |

### Verificacion final

| Check | Resultado |
|-------|-----------|
| `pnpm exec tsc --noEmit` | 0 errores |
| `pnpm run build` | 21 rutas + middleware, exitoso |
| `grep -ri "ScaleIcon\|GavelIcon" src/` | Solo definiciones (eliminadas) |
| `grep -ri "lexagenda\|abogad" e2e/` | 0 resultados |
| `grep -ri "hola@soilingcalc" src/` | Solo siteConfig.ts + resend.ts fallback |
| `grep -ri "teal" src/` | 0 resultados |

---

## Arquitectura Final

### Flujo de datos principal

```
Usuario registra lectura (kWh del dia)
  ↓
Server Action: createReading()
  ↓
1. Validar con Zod schema
2. Verificar propiedad de planta (RLS)
3. Fetch irradiancia → Open-Meteo API (con cache en Supabase)
4. Convertir GHI → POA (factor de inclinacion)
5. Calcular temperatura celda (modelo NOCT)
6. Calcular produccion teorica (kWh esperados)
7. Performance Ratio = real / teorico
8. Obtener baseline PR (mejor PR reciente post-limpieza)
9. Soiling % = (1 - PR_actual / PR_baseline) * 100
10. Perdida diaria (EUR) = soiling% * teorico * precio_energia
11. Perdida acumulada desde ultima limpieza
12. Recomendacion: WATCH (>3%) | RECOMMENDED (>7%) | URGENT (>15%)
  ↓
INSERT en production_readings + revalidatePath
```

### Seguridad

| Capa | Implementacion |
|------|---------------|
| Middleware | `src/middleware.ts` — redirige a /login si no autenticado |
| Page-level | `requireAuth()` / `requireAdmin()` en cada Server Component |
| Database | RLS activo en todas las tablas (plants, readings, irradiance_cache, users) |
| Validacion | Zod schemas en todas las entradas de usuario |
| Admin | `ADMIN_EMAIL` env var como gate para panel de leads |
| Trial | `checkTrialStatus()` bloquea creacion si trial expirado |

### Paleta de colores

| Elemento | Color | Uso |
|----------|-------|-----|
| Fondos oscuros | `slate-900`, `slate-800`, `slate-700` | Hero, footer, headers |
| Acento primario | `amber-500`, `amber-600` | Botones CTA, iconos, badges |
| Acento suave | `amber-50`, `amber-100` | Fondos de cards, hover states |
| Links | `blue-600` | Enlaces de navegacion internos |
| Danger | `red-600`, `red-50` | Zona de peligro, errores |

---

## Aprendizajes y Auto-Blindaje

### Errores documentados y soluciones

| Fecha | Error | Fix | Aplicar en |
|-------|-------|-----|------------|
| FASE 4 | `bookingSlug` no existe en `TeamMember` despues de reescribir siteConfig | Eliminar bloque de booking en equipo/page.tsx | Siempre verificar tipos despues de cambiar interfaces |
| FASE 5 | `replace_all` en Footer cogio `hover:text-teal-400` como substring de `text-teal-400` | Hacer reemplazo en dos pasadas (primero hover, luego base) | Cuidado con replace_all y substrings CSS |
| FASE 5 | `.next/types` cache causa errores TS fantasma despues de eliminar rutas | `rm -rf .next/types .next/dev/types` antes de typecheck | Siempre limpiar cache despues de eliminar rutas |
| FASE 6 | `cookiesToSet` en middleware.ts tenia tipo implicito `any` | Agregar type `CookieToSet` explicito | Siempre tipar parametros de callbacks de Supabase SSR |
| FASE 6 | `pnpm remove qrcode` fallo porque el paquete era `@types/qrcode` | Verificar nombre exacto en package.json antes de desinstalar | Leer package.json antes de `pnpm remove` |
| General | recharts SSR: `dynamic()` no puede estar en Server Component | Crear wrapper Client Component con `'use client'` + `dynamic` | Nunca usar `dynamic` con SSR false en Server Components |
| General | Supabase columnas `GENERATED ALWAYS` (total_power_kw, total_area_m2_calc) | NO incluir en INSERT/UPDATE | Revisar DDL antes de escribir mutations |

### Patrones establecidos

1. **Batch paralelo**: Agrupar archivos por complejidad y editar en batches paralelos para maximizar velocidad
2. **Grep validation**: Despues de cada fase, ejecutar greps de verificacion para confirmar 0 artefactos restantes
3. **Triple check**: TypeScript → Build → Grep como pipeline de verificacion estandar
4. **siteConfig as source of truth**: Toda configuracion del sitio centralizada en un solo archivo
5. **Feature-First**: Cada feature autocontenida con components/, services/, types/, hooks/

---

## Resumen por Fase

| Fase | Foco | Archivos nuevos | Archivos modificados | Archivos eliminados |
|------|------|-----------------|---------------------|-------------------|
| 1 | Marketing Funnel | ~15 | ~3 | 0 |
| 2 | Lead Activation | ~6 | ~2 | 0 |
| 3 | Hardening & Auth | ~2 | ~8 | ~3 rutas legacy |
| 4 | Content Swap | ~0 | ~12 | ~4 (dead code) |
| 5 | Visual Rebrand | 3 | 22 | 0 |
| 6 | Production Hardening | 4 | ~12 | 9 (e2e + qrcode) |
| **Total** | | **~30** | **~59** | **~16** |

---

## Fases SaaS (segunda ronda de desarrollo)

Sobre el MVP funcional (Fases 1-6 originales), se implementaron 7 fases adicionales para convertir la app en un SaaS completo con funnel de adquisicion y activacion.

### SaaS FASE 0: Marketing Site
- Landing page con hero, features, social proof, CTA
- Paginas estaticas: /servicios, /equipo, /contacto, /privacidad, /terminos
- Footer y navbar publica con navegacion

### SaaS FASE 1: Lead Capture
- Formulario /apply con validacion Zod
- Tabla `leads` con scoring automatico
- Notificacion email al admin via Resend
- Pagina /thanks + /waitlist (cuota de 10 leads activos)

### SaaS FASE 2: Lead Ops
- Panel /admin/leads con tabla interactiva
- Scoring automatico (0-100) basado en datos del lead
- Filtros por estado + notas inline editables
- Status flow: applied → qualified → invited → active

### SaaS FASE 3: Invites + Profiles + Access Control
- Tabla `profiles` con access_level enum (founding/admin/paid/free)
- Tabla `invites` con tokens criptograficos (7 dias expiracion)
- Flujo: admin invita → lead recibe email → elige contrasena → cuenta activa
- RLS en profiles e invites + migracion de usuarios existentes
- Archivos clave: `src/actions/invites.ts`, `src/features/invites/`

### SaaS FASE 4: App Activation
- Pagina /settings con edicion de nombre + cambio contrasena
- Trial countdown en sidebar (colores: slate >15d, amber 7-14d, red <7d)
- Onboarding mejorado en empty state (3 pasos visuales)
- Banner verde en /login?registered=true
- Archivos clave: `src/actions/profile.ts`, `src/features/settings/`

### SaaS FASE 5: Business Enforcement
- `requireActiveSubscription()` helper en `src/lib/auth.ts`
- Trial enforcement en `createPlant()` y `createReading()` (server action level)
- `signup()` bloqueada (invite-only model)
- Rate limiting en formulario publico /apply (3 submits / 15 min por IP)

### SaaS FASE 6: Funnel Instrumentation
- Tabla `funnel_events` con RLS (admin read, service insert)
- Helper `track()` fire-and-forget en `src/lib/tracking.ts`
- 5 eventos: LEAD_APPLIED, LEAD_INVITED, INVITE_CONSUMED, PLANT_CREATED, READING_CREATED
- Admin dashboard /admin/funnel con contadores, conversion rates y timeline
- Archivos clave: `src/lib/tracking.ts`, `src/app/(main)/admin/funnel/page.tsx`

### SaaS FASE 7: Integraciones + Enterprise (documentada, pendiente)
- Roadmap documentado en `.claude/PRPs/PRP-002-roadmap-integraciones-enterprise.md`
- Areas: CSV Import, Public API con API Keys, Notificaciones/Webhooks, Multi-org, Stripe Billing
- Bloqueada por: APIs de inversores no disponibles para testing

### Resumen SaaS

| Fase SaaS | Foco | Archivos nuevos | Archivos modificados |
|-----------|------|-----------------|---------------------|
| 0 | Marketing | ~15 | ~3 |
| 1 | Lead Capture | ~6 | ~2 |
| 2 | Lead Ops | ~4 | ~3 |
| 3 | Invites + Profiles | ~6 | ~8 |
| 4 | App Activation | 4 | 5 |
| 5 | Business Enforcement | 0 | 5 |
| 6 | Funnel Instrumentation | 3 | 5 |
| 7 | Roadmap (doc only) | 1 | 0 |
| **Total** | | **~39** | **~31** |

---

> Este documento refleja el estado del proyecto al cierre de SaaS FASE 6.
> FASE 7 (Integraciones + Enterprise) documentada como roadmap en PRP-002.
> El MVP SaaS esta completo y funcional.
