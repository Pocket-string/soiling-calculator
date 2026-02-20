# Funnel Report — Soiling Calc SaaS

**Fecha:** 2026-02-20
**Version:** 1.0
**Modelo de adquisicion:** Invite-only con programa Founding 10

---

## Tabla de Contenidos

1. [Resumen del Funnel](#1-resumen-del-funnel)
2. [Stage 1 — Descubrimiento (Landing)](#2-stage-1--descubrimiento-landing)
3. [Stage 2 — Interes (Demo)](#3-stage-2--interes-demo)
4. [Stage 3 — Postulacion (Apply)](#4-stage-3--postulacion-apply)
5. [Stage 4 — Calificacion (Admin)](#5-stage-4--calificacion-admin)
6. [Stage 5 — Invitacion](#6-stage-5--invitacion)
7. [Stage 6 — Activacion de Cuenta](#7-stage-6--activacion-de-cuenta)
8. [Stage 7 — First Value (Primera Planta)](#8-stage-7--first-value-primera-planta)
9. [Stage 8 — Retencion (Primera Lectura)](#9-stage-8--retencion-primera-lectura)
10. [Tracking y Metricas](#10-tracking-y-metricas)
11. [Protecciones del Sistema](#11-protecciones-del-sistema)
12. [Customer Journey Completo](#12-customer-journey-completo)
13. [Edge Cases y Errores](#13-edge-cases-y-errores)
14. [Archivos del Funnel](#14-archivos-del-funnel)

---

## 1. Resumen del Funnel

```
  DESCUBRIMIENTO        INTERES          POSTULACION        CALIFICACION
┌─────────────────┐  ┌──────────┐  ┌──────────────────┐  ┌──────────────┐
│  Landing Page   │→ │   Demo   │→ │  Formulario      │→ │ Admin revisa │
│  /              │  │  /demo   │  │  /apply           │  │ /admin/leads │
│                 │  │          │  │                    │  │              │
│ CTAs:           │  │ KPIs     │  │ 10 campos + GDPR  │  │ Score 0-100  │
│ - Ver demo      │  │ Graficos │  │ Rate limit 3/15m  │  │ Filtros      │
│ - Solicitar     │  │ Tabla    │  │ Quota check (10)   │  │ Notas        │
│   acceso        │  │          │  │                    │  │              │
└────────┬────────┘  └────┬─────┘  └────────┬───────────┘  └──────┬───────┘
         │                │                  │                      │
         └───→ /demo ─────┘                  │                      │
         └───→ /apply ───────────────────────┘                      │
                                                                    │
   INVITACION            ACTIVACION         FIRST VALUE         RETENCION
┌──────────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ Admin genera     │→ │ /invite/[tkn] │→ │ /plants/new  │→ │ /readings/   │
│ token + email    │  │               │  │              │  │    new        │
│                  │  │ Crear cuenta  │  │ Crear planta │  │              │
│ Token 7d exp.    │  │ contrasena    │  │ 5 secciones  │  │ Registrar    │
│ Email via Resend │  │ auto-confirm  │  │ Validacion   │  │ primera      │
│ URL al clipboard │  │ 30d trial     │  │ Zod          │  │ lectura      │
│                  │  │               │  │              │  │              │
└──────────────────┘  └───────────────┘  └──────────────┘  └──────────────┘
                                │
                         /login?registered=true
```

### Eventos de tracking

| Stage | Evento | Tabla |
|-------|--------|-------|
| Postulacion | `LEAD_APPLIED` | `funnel_events` |
| Invitacion | `LEAD_INVITED` | `funnel_events` |
| Activacion | `INVITE_CONSUMED` | `funnel_events` |
| First Value | `PLANT_CREATED` | `funnel_events` |
| Retencion | `READING_CREATED` | `funnel_events` |

---

## 2. Stage 1 — Descubrimiento (Landing)

**Ruta:** `/`
**Archivos:** `src/app/(marketing)/page.tsx`, `src/features/marketing/components/`
**Objetivo:** Captar atencion y dirigir a /demo o /apply

### Lo que ve el visitante

1. **Hero Section** — Titulo: "Tu instalacion solar, en su maximo rendimiento"
   - Badge: "Founding 10 — Plazas limitadas"
   - Subtitulo explicando el problema del soiling
   - Dos CTAs:
     - "Ver demo en vivo →" → `/demo`
     - "Solicitar acceso gratuito" → `/apply`
   - Linea de confianza: "30 dias gratis · Sin tarjeta de credito · Sin compromiso"

2. **Features Grid** — 3 columnas:
   - Irradiancia real segun ubicacion (Open-Meteo)
   - Correccion por temperatura del modulo (NOCT)
   - Recomendacion basada en coste-beneficio

3. **FAQ** — 4 preguntas frecuentes:
   - ¿Que necesito para usar Soiling Calc?
   - ¿Con que inversores funciona?
   - ¿Mis datos son privados?
   - ¿Que incluye el periodo de prueba?

4. **CTA Banner Final** — "Solicitar mi plaza gratuita →" → `/apply`

### Datos recopilados

Ninguno. Pagina estatica sin formularios ni tracking.

### Decisiones de diseño

- No hay registro abierto: todo dirige a /apply o /demo
- Se enfatiza la escasez ("Founding 10", "Plazas limitadas")
- El CTA principal es /apply, no /login
- Se ofrece /demo como alternativa de menor compromiso

---

## 3. Stage 2 — Interes (Demo)

**Ruta:** `/demo`
**Archivos:** `src/app/(marketing)/demo/page.tsx`, `src/features/demo/components/`
**Objetivo:** Demostrar el valor del producto con datos reales precalculados

### Lo que ve el visitante

1. **Banner superior** — "Quiero acceso gratuito →" → `/apply`

2. **DemoKPIs** — 4 tarjetas con datos de la planta demo:
   - Estado actual (badge de limpieza con color)
   - Soiling % actual
   - Performance Ratio actual vs baseline
   - Perdida acumulada en EUR
   - Dias hasta break-even

3. **Graficos interactivos** (ChartsSection con Recharts):
   - Soiling % historico con lineas de referencia
   - Performance Ratio con baseline
   - Perdidas economicas diarias

4. **Tabla de lecturas** (DemoReadingTable) — Ultimas 12 lecturas con:
   - Fecha, kWh real, kWh teorico, soiling %, PR %, estado
   - Dias de limpieza marcados con emoji

5. **CTA inferior** — "Solicitar acceso gratuito (30 dias)" → `/apply`

### Datos recopilados

Ninguno. Los datos se generan a partir de un dataset seed estatico (`demoData`).

### Decisiones de diseño

- La demo usa datos realistas con fisica NOCT real (no datos inventados)
- El visitante puede interactuar con los graficos (hover, tooltips)
- Dos CTAs visibles (banner superior + boton inferior) para maximizar conversion
- No se requiere registro para ver la demo

---

## 4. Stage 3 — Postulacion (Apply)

**Ruta:** `/apply`
**Archivos:** `src/app/(marketing)/apply/page.tsx`, `src/app/(marketing)/apply/actions.ts`, `src/features/leads/components/ApplyForm.tsx`
**Objetivo:** Capturar datos del prospecto y evaluar su idoneidad

### Lo que ve el visitante

**Header:**
- Badge: "Founding 10 — Plazas limitadas"
- Titulo: "Solicita tu acceso gratuito"
- Subtitulo: "30 dias de acceso completo, sin tarjeta de credito"

**Formulario (10 campos):**

| Campo | Tipo | Validacion | Obligatorio |
|-------|------|------------|-------------|
| Nombre | text | min 2, max 100 | Si |
| Email | email | formato valido | Si |
| Pais | text | min 2, max 100 | Si |
| Ciudad | text | min 2, max 100 | Si |
| Potencia instalada (kWp) | number | min 0.1, max 10000 | Si |
| Marca del inversor | select | enum: Huawei, SMA, Fronius, SolarEdge, Growatt, Otro | Si |
| Modelo del inversor | text | max 100 | No |
| Frecuencia de registro | radio | daily / weekly / monthly | Si |
| Compromiso semanal | radio | si / no | Si |
| Consentimiento GDPR | checkbox | debe ser 'true' | Si |

**Boton:** "Enviar solicitud" (estado pending: "Enviando...")

### Flujo del servidor (createLead)

```
1. Obtener IP del visitante (x-forwarded-for → x-real-ip → 'unknown')
2. Rate limit: 3 solicitudes por IP en 15 minutos
   → Si excede: error "Demasiadas solicitudes. Espera unos minutos."
3. Validar con schema Zod (leadSchema)
   → Si falla: devolver fieldErrors
4. Verificar cuota: contar leads con status 'invited' o 'active'
   → Si >= 10: redirect a /waitlist
5. UPSERT en tabla leads (onConflict: email) con status = 'applied'
6. Enviar email al admin (ADMIN_EMAIL) con datos del lead
   → Silencioso si falla (no bloquea)
7. Track evento: LEAD_APPLIED (metadata: email, name, ip)
8. Redirect a /thanks
```

### Datos almacenados (tabla `leads`)

```sql
INSERT INTO leads (
  name, email, location_country, location_city,
  system_kwp, inverter_brand, inverter_model,
  reporting_frequency, can_commit_weekly,
  status  -- 'applied'
)
```

### Pagina de confirmacion (/thanks)

- Emoji: 🎉
- Titulo: "¡Solicitud recibida!"
- Proximos pasos: confirmacion email, credenciales en 24-48h, 30 dias gratis
- CTAs: "Ver demo mientras tanto" → /demo, "Volver al inicio" → /

### Pagina de lista de espera (/waitlist)

Se muestra cuando las 10 plazas estan ocupadas:
- Emoji: ⏳
- Titulo: "Lista de espera"
- Mensaje: solicitud registrada, aviso por email cuando haya plaza
- CTA: "Ver demo mientras tanto →" → /demo

---

## 5. Stage 4 — Calificacion (Admin)

**Ruta:** `/admin/leads`
**Archivos:** `src/app/(main)/admin/leads/page.tsx`, `LeadsTable.tsx`, `src/features/leads/services/leadScorer.ts`
**Acceso:** Solo admin (`requireAdmin()`)
**Objetivo:** Evaluar y calificar leads para decidir a quien invitar

### Sistema de scoring automatico

Cada lead recibe una puntuacion de 0-100 basada en 5 criterios:

| Criterio | Condicion | Puntos |
|----------|-----------|--------|
| Compromiso semanal | `can_commit_weekly === true` | 30 |
| Marca de inversor Tier 1 | Huawei, SMA, Fronius, SolarEdge | 25 |
| Marca de inversor Tier 2 | Growatt | 15 |
| Marca de inversor Otro | Cualquier otro | 5 |
| Sistema serio | `system_kwp >= 5` | 15 |
| Frecuencia diaria | `reporting_frequency === 'daily'` | 20 |
| Frecuencia semanal | `reporting_frequency === 'weekly'` | 15 |
| Frecuencia mensual | `reporting_frequency === 'monthly'` | 5 |
| Ubicacion completa | Pais Y ciudad informados | 10 |

**Clasificacion por score:**

| Tier | Rango | Color |
|------|-------|-------|
| Excelente | >= 80 | Verde (success) |
| Bueno | >= 60 | Azul |
| Regular | >= 40 | Amarillo (warning) |
| Bajo | < 40 | Gris |

### Lo que ve el admin

1. **6 KPIs** en tarjetas:
   - Total de leads
   - Postulados (status = 'applied')
   - Score promedio
   - Calificados (score >= 60, status applied/qualified)
   - Invitados
   - Activos

2. **Filtros:**
   - Por estado: Todos, Por calificar, Postulados, Calificados, Invitados, Activos, En espera, Rechazados
   - Busqueda por nombre o email
   - Ordenar por: Fecha (DESC) o Score (DESC)

3. **Tabla de leads** con columnas:
   - Nombre / Email
   - Ubicacion (ciudad, pais)
   - kWp (potencia instalada)
   - Inversor (marca)
   - Score (hover muestra desglose con ScoreTooltip)
   - Notas (editable inline por el admin)
   - Estado (badge con color)
   - Acciones
   - Fecha

4. **ScoreTooltip** — Al hacer hover sobre el score:
   ```
   Compromiso semanal:   {n}/30
   Marca inversor:       {n}/25
   Frecuencia reporte:   {n}/20
   Tamano sistema:       {n}/15
   Ubicacion completa:   {n}/10
   ─────────────────────────
   Total:                {n}/100
   ```

### Acciones del admin

| Accion | Condicion | Efecto |
|--------|-----------|--------|
| Invitar | Status = applied o qualified | Genera invitacion (ver Stage 5) |
| Cambiar estado | Cualquier lead | applied ↔ qualified ↔ waitlisted ↔ rejected |
| Agregar notas | Cualquier lead | UPDATE leads SET notes = ... |

> Los estados `invited` y `active` solo se alcanzan via el flujo de invitacion, no manualmente.

---

## 6. Stage 5 — Invitacion

**Archivos:** `src/actions/invites.ts`, `src/lib/email/resend.ts`
**Trigger:** Admin hace clic en "Invitar" desde la tabla de leads
**Objetivo:** Generar un enlace unico con token y enviarlo por email

### Flujo de invitacion (createInvite)

```
1. Verificar admin: requireAdmin()
2. Obtener lead por ID
3. Validar status del lead: debe ser 'applied' o 'qualified'
   → Si es otro status: error "Este lead ya fue procesado"
4. Expirar invitaciones previas pendientes del mismo lead:
   UPDATE invites SET status = 'expired'
   WHERE lead_id = ? AND status = 'pending'
5. Crear nueva invitacion:
   INSERT INTO invites (
     lead_id, email, name,
     access_level: 'founding',
     max_plants: 1,
     created_by: admin.id
     -- token y expires_at generados por defaults de la BD
   )
6. Actualizar lead:
   UPDATE leads SET status = 'invited' WHERE id = leadId
7. Construir URL: ${SITE_URL}/invite/${token}
8. Enviar email via Resend:
   - To: lead.email
   - Subject: "Tu acceso a Soiling Calc esta listo"
   - Body: saludo + enlace + instrucciones + 7d expiracion
9. Track evento: LEAD_INVITED (userId: admin, leadId, metadata: { email })
10. Revalidar: /admin/leads
11. Retornar: { inviteUrl, emailSent, error }
```

### Email enviado al prospecto

```
De: Soiling Calc <onboarding@resend.dev>
Para: {lead.email}
Reply-To: hola@soilingcalc.com
Asunto: Tu acceso a Soiling Calc esta listo

Hola {name},

Has sido invitado/a a usar Soiling Calc. Tienes 30 dias de prueba
gratuita con acceso completo.

Para activar tu cuenta, haz clic en el siguiente enlace y elige
tu contrasena:

   {inviteUrl}

Este enlace expira en 7 dias.

Una vez registrado/a:
1. Crea tu primera instalacion fotovoltaica
2. Registra tu primera lectura de produccion (kWh)
3. La app calcula automaticamente el soiling y te recomienda cuando limpiar

Si tienes alguna duda, responde directamente a este email.

-- Equipo Soiling Calc
```

### Feedback al admin

- Exito: "Invitacion creada. Email enviado. URL copiada al portapapeles."
- Email fallo: "Invitacion creada. Email no enviado (Resend no configurado). URL copiada."
- Error: Mensaje de error en banner rojo

---

## 7. Stage 6 — Activacion de Cuenta

**Ruta:** `/invite/[token]`
**Archivos:** `src/app/(auth)/invite/[token]/page.tsx`, `src/features/invites/components/InviteForm.tsx`, `src/actions/invites.ts`
**Objetivo:** El prospecto crea su cuenta usando el token de invitacion

### Validacion del token (server-side)

```
1. Buscar invitacion por token
2. Si no existe → "Invitacion no encontrada."
3. Si status = 'consumed' → "Esta invitacion ya fue utilizada."
4. Si status = 'expired' → "Esta invitacion ha expirado."
5. Si expires_at < now() → "Esta invitacion ha expirado."
```

### Lo que ve el prospecto

**Exito (token valido):**
- Titulo: "Activa tu cuenta"
- Subtitulo: "Hola {name}, elige una contrasena para acceder a Soiling Calc."
- Formulario:
  - Email (readonly, informativo)
  - Nombre completo (precargado desde la invitacion)
  - Contrasena (minimo 6 caracteres)
  - Boton: "Activar cuenta"
  - Links a /terminos y /privacidad

**Error (token invalido):**
- Icono rojo
- Titulo: "Invitacion no valida"
- Mensaje de error especifico
- CTA: "Solicitar acceso" → /apply

### Flujo de activacion (consumeInvite)

```
1. Validar schema: token (string), full_name (min 2), password (min 6)
2. Buscar invitacion por token
3. Validar status = 'pending' y no expirada
4. Crear usuario en Supabase Auth:
   - email: invite.email
   - password: del formulario
   - email_confirm: true (auto-confirmado, sin email de verificacion)
   - user_metadata: { name, source: 'invite' }
   → Si email ya existe: error "Ya existe una cuenta con el email {email}."
5. Crear perfil:
   INSERT INTO profiles (
     id: user.id,
     full_name,
     access_level: invite.access_level,  -- 'founding'
     trial_ends_at: now() + 30 dias,
     max_plants: invite.max_plants       -- 1
   )
6. Compatibilidad legacy:
   UPSERT INTO users (id, trial_ends_at)
7. Marcar invitacion como consumida:
   UPDATE invites SET status = 'consumed', consumed_at = now()
8. Actualizar lead:
   UPDATE leads SET status = 'active'
9. Track evento: INVITE_CONSUMED (userId: newUser.id, leadId, metadata: { email })
10. Redirect a: /login?registered=true
```

### Pagina de login post-registro

Cuando el usuario llega a `/login?registered=true`, ve:
- Banner verde: "Cuenta creada correctamente. Inicia sesion con tus credenciales."
- Formulario de login normal
- Footer: "Acceso solo por invitacion. Solicitar acceso → /apply"

---

## 8. Stage 7 — First Value (Primera Planta)

**Ruta:** `/plants` (despues del primer login) → `/plants/new`
**Archivos:** `src/app/(main)/plants/page.tsx`, `src/app/(main)/plants/new/page.tsx`
**Objetivo:** El usuario crea su primera planta fotovoltaica

### Lo que ve el usuario

**Dashboard vacio (/plants):**
- Titulo: "Mis Plantas"
- Subtitulo: "0 instalaciones fotovoltaicas" (si no tiene plantas)
- CTA: "+ Nueva planta" → /plants/new

**Formulario de nueva planta (/plants/new):**
5 secciones con campos precargados con defaults razonables:

| Seccion | Campos | Defaults |
|---------|--------|----------|
| Identificacion | Nombre, latitud, longitud | — |
| Modulos | Cantidad, potencia Wp, area m2 | 400 Wp, 2.0 m2 |
| Orientacion | Inclinacion, azimut | 30 grados, 180 (sur) |
| Parametros tecnicos | NOCT, coef. temperatura, eficiencia | 45C, -0.40, 0.20 |
| Economia | Precio energia, coste limpieza | 0.12 EUR/kWh, 150 EUR |

### Track

Evento `PLANT_CREATED` registrado al insertar la planta exitosamente.

---

## 9. Stage 8 — Retencion (Primera Lectura)

**Ruta:** `/plants/[id]/readings/new`
**Archivos:** `src/features/readings/components/ReadingForm.tsx`, `src/actions/readings.ts`
**Objetivo:** El usuario registra su primera lectura y ve resultados inmediatos

### Lo que hace el usuario

1. Ingresa fecha y kWh producidos (lectura del inversor/contador)
2. Selecciona tipo de lectura (diaria/semanal/mensual)
3. Marca si hubo limpieza ese dia
4. Presiona "Guardar lectura"

### Lo que hace el sistema

El Motor NOCT ejecuta automaticamente:
- Obtiene irradiancia de Open-Meteo (o cache)
- Calcula temperatura de celda, produccion teorica
- Calcula soiling %, PR, perdidas en EUR
- Genera recomendacion de limpieza
- Inserta en production_readings con 25+ columnas calculadas

### Resultado inmediato

El usuario es redirigido al dashboard de la planta donde ve:
- Card de recomendacion con badge de color
- Primer punto en los graficos
- Primera fila en el historial

### Track

Evento `READING_CREATED` registrado al insertar la lectura exitosamente.

---

## 10. Tracking y Metricas

### Sistema de tracking (fire-and-forget)

**Archivo:** `src/lib/tracking.ts`

```typescript
track({
  event: string,       // Nombre del evento
  userId?: string,     // ID del usuario (si autenticado)
  leadId?: string,     // ID del lead (si aplica)
  metadata?: object,   // Datos adicionales (email, name, etc.)
  ip?: string          // IP del visitante (para anonimos)
})
```

Inserta en la tabla `funnel_events`. Nunca lanza excepciones (fire-and-forget con console.warn en error).

### Dashboard del funnel (/admin/funnel)

**Acceso:** Solo admin (`requireAdmin()`)

**5 metricas mostradas:**

| Metrica | Evento | Color | Significado |
|---------|--------|-------|-------------|
| Leads | `LEAD_APPLIED` | Azul | Formularios de postulacion recibidos |
| Invitados | `LEAD_INVITED` | Amarillo | Invitaciones generadas por admin |
| Activados | `INVITE_CONSUMED` | Verde | Cuentas creadas desde invitacion |
| Plantas | `PLANT_CREATED` | Violeta | Plantas configuradas |
| Lecturas | `READING_CREATED` | Rosa | Lecturas de produccion registradas |

**Para cada metrica se muestra:**
- Total (all time)
- Ultimos 7 dias
- Ultimos 30 dias

**Tasas de conversion calculadas:**
```
Leads → Invitados:  (LEAD_INVITED / LEAD_APPLIED) * 100
Invitados → Activados:  (INVITE_CONSUMED / LEAD_INVITED) * 100
Activados → Plantas:  (PLANT_CREATED / INVITE_CONSUMED) * 100
Plantas → Lecturas:  (READING_CREATED / PLANT_CREATED) * 100
```

**Timeline de eventos recientes** (ultimos 20):
- Tipo de evento (con dot de color)
- Identificador (email, user_id parcial, o IP)
- Timestamp formateado en es-ES

---

## 11. Protecciones del Sistema

### Rate limiting en /apply

```
Limite: 3 solicitudes por IP en 15 minutos
Implementacion: Map en memoria (no persistente)
IP detection: x-forwarded-for → x-real-ip → 'unknown'
Error: "Demasiadas solicitudes. Espera unos minutos e intentalo de nuevo."
```

### Cuota del programa Founding 10

```
Maximo: 10 leads con status 'invited' o 'active'
Verificacion: COUNT(*) WHERE status IN ('invited', 'active')
Si excede: redirect a /waitlist (no error)
```

### Validacion de invitaciones

| Validacion | Error |
|-----------|-------|
| Token no existe | "Invitacion no encontrada." |
| Token ya consumido | "Esta invitacion ya fue utilizada." |
| Token expirado (7 dias) | "Esta invitacion ha expirado." |
| Email ya registrado en Auth | "Ya existe una cuenta con el email {email}." |
| Lead no es 'applied'/'qualified' | "Este lead ya fue procesado." |

### Control de acceso

| Recurso | Proteccion |
|---------|-----------|
| /plants, /settings | `requireAuth()` — redirige a /login |
| /admin/leads, /admin/funnel, /admin/ui-kit | `requireAdmin()` — redirige a /plants |
| Datos de plantas | RLS: `auth.uid() = user_id` |
| Perfil | RLS: solo lectura/escritura del propio |
| Funcionalidades post-trial | `checkTrialStatus()` — muestra badge "Trial expirado" |

### Perfiles y suscripcion

| access_level | Trial | max_plants | Acceso admin |
|-------------|-------|------------|--------------|
| `founding` | 30 dias desde activacion | 1 | No |
| `admin` | Sin limite | Sin limite | Si |
| `paid` | Sin limite | Configurable | No |
| `free` | Sin trial | 1 | No |

---

## 12. Customer Journey Completo

### Escenario: Operador FV descubre Soiling Calc y se convierte en usuario activo

```
DIA 0 — DESCUBRIMIENTO
│ El operador llega a soilingcalc.com (busqueda, referido, etc.)
│ Ve el hero: "Tu instalacion solar, en su maximo rendimiento"
│ Lee features, FAQ
│ Hace clic en "Ver demo en vivo →"
│
├─→ /demo
│   Ve KPIs reales: soiling 9%, PR 76.9%, perdida 4 EUR
│   Interactua con graficos (hover en puntos)
│   Ve la tabla de lecturas con recomendaciones
│   Convencido, hace clic en "Solicitar acceso gratuito"
│
├─→ /apply
│   Rellena el formulario (2-3 minutos):
│   - Nombre, email, ubicacion
│   - Planta: 8 kWp, inversor Huawei
│   - Frecuencia: diaria, compromiso: si
│   - Acepta GDPR
│   Envia solicitud
│
├─→ /thanks
│   Ve confirmacion: "¡Solicitud recibida!"
│   Se le informa: credenciales en 24-48h
│   Mientras tanto puede volver a /demo
│
│ [SERVIDOR: lead insertado con status 'applied']
│ [SERVIDOR: email enviado al admin]
│ [SERVIDOR: evento LEAD_APPLIED trackeado]

DIA 0-1 — CALIFICACION
│ Admin abre /admin/leads
│ Ve el nuevo lead con score automatico (ej: 90/100)
│   - Compromiso semanal: 30/30
│   - Huawei (Tier 1): 25/25
│   - Frecuencia diaria: 20/20
│   - Sistema >= 5 kWp: 15/15
│   - Ubicacion completa: 0/10
│ Lead clasificado como "Excelente"
│ Admin hace clic en "Invitar"
│ Confirma la invitacion
│
│ [SERVIDOR: invitacion creada con token, expira en 7 dias]
│ [SERVIDOR: lead actualizado a status 'invited']
│ [SERVIDOR: email enviado al prospecto]
│ [SERVIDOR: evento LEAD_INVITED trackeado]
│ [ADMIN: URL copiada al portapapeles]

DIA 1-2 — ACTIVACION
│ Prospecto recibe email: "Tu acceso a Soiling Calc esta listo"
│ Hace clic en el enlace: /invite/{token}
│
├─→ /invite/{token}
│   Ve: "Activa tu cuenta — Hola {nombre}"
│   Email ya precargado (readonly)
│   Nombre precargado (editable)
│   Elige contrasena (min 6 chars)
│   Hace clic en "Activar cuenta"
│
│ [SERVIDOR: usuario creado en Supabase Auth (auto-confirmado)]
│ [SERVIDOR: perfil creado: founding, 30d trial, max 1 planta]
│ [SERVIDOR: invitacion marcada como 'consumed']
│ [SERVIDOR: lead actualizado a status 'active']
│ [SERVIDOR: evento INVITE_CONSUMED trackeado]
│
├─→ /login?registered=true
│   Ve banner verde: "Cuenta creada correctamente"
│   Inicia sesion con email y contrasena
│
├─→ /plants (dashboard vacio)
│   Ve: "Mis Plantas — 0 instalaciones fotovoltaicas"
│   Hace clic en "+ Nueva planta"

DIA 2 — FIRST VALUE
│
├─→ /plants/new
│   Rellena formulario (3-5 minutos):
│   - Nombre: "Mi instalacion Madrid"
│   - Ubicacion: 40.42, -3.70
│   - 20 modulos x 400 Wp = 8 kWp
│   - Inclinacion 30, azimut 180 (sur)
│   - Defaults tecnicos (NOCT 45, coef -0.40)
│   - Precio energia 0.12, limpieza 150 EUR
│   Guarda la planta
│
│ [SERVIDOR: planta insertada en BD]
│ [SERVIDOR: evento PLANT_CREATED trackeado]
│
├─→ /plants/{id} (dashboard de la planta, vacio)
│   Ve: datos de la planta, sin lecturas aun
│   Hace clic en "Nueva lectura"
│
├─→ /plants/{id}/readings/new
│   Ingresa:
│   - Fecha: hoy
│   - kWh: 35.2 (del inversor)
│   - Tipo: Diaria
│   - Limpieza: Si (primera lectura = paneles limpios)
│   Guarda la lectura
│
│ [SERVIDOR: Open-Meteo → GHI 5.8 kWh/m2, temp 12C]
│ [SERVIDOR: Motor NOCT → teorico 38.5 kWh, PR 0.914]
│ [SERVIDOR: Soiling 0% (es dia de limpieza, baseline = PR)]
│ [SERVIDOR: Recomendacion: OK]
│ [SERVIDOR: evento READING_CREATED trackeado]
│
├─→ /plants/{id} (dashboard con datos!)
│   Ve por primera vez:
│   - Badge verde: "Sin soiling"
│   - KPI: Soiling 0%, PR 91.4%, Perdida 0 EUR
│   - Primer punto en los graficos
│   - Primera fila en el historial
│
│ EL USUARIO HA RECIBIDO VALOR.

DIAS 3+ — RETENCION
│ Cada dia, el operador registra una nueva lectura (30 segundos)
│ El soiling va subiendo: 0.5%, 1.2%, 2.8%, 5.1%...
│ Los graficos muestran la tendencia
│ Cuando llega a 7%: badge naranja "Limpiar pronto"
│ Perdida acumulada visible en EUR
│ El operador decide limpiar basandose en el break-even
│ Marca "dia de limpieza" → reset del ciclo
│ El proceso se repite.
```

---

## 13. Edge Cases y Errores

| Escenario | Comportamiento | Mensaje |
|-----------|---------------|---------|
| Rate limit excedido (3/15min) | Formulario rechazado | "Demasiadas solicitudes. Espera unos minutos." |
| 10 plazas ocupadas | Redirect | → /waitlist |
| Email ya postulado | Upsert (actualiza datos) | Redirect a /thanks normalmente |
| Token de invitacion invalido | Pagina de error | "Invitacion no encontrada." |
| Token ya usado | Pagina de error | "Esta invitacion ya fue utilizada." |
| Token expirado (7d) | Pagina de error | "Esta invitacion ha expirado." |
| Email ya tiene cuenta Auth | Error en formulario | "Ya existe una cuenta con el email {email}." |
| Trial expirado | Badge en dashboard | "Trial expirado" (funcionalidad limitada) |
| Admin sin perfil | Fallback | Verifica ADMIN_EMAIL env var |
| Resend no configurado | Email no enviado | Admin ve "Email no enviado" (invitacion sigue valida) |
| Open-Meteo caido | Lectura falla | Error en el servidor al crear lectura |

---

## 14. Archivos del Funnel

### Por stage

| Stage | Archivos principales |
|-------|---------------------|
| Landing | `src/app/(marketing)/page.tsx`, `src/features/marketing/components/LandingHero.tsx`, `LandingFeatures.tsx`, `LandingFAQ.tsx` |
| Demo | `src/app/(marketing)/demo/page.tsx`, `src/features/demo/components/DemoKPIs.tsx`, `DemoReadingTable.tsx` |
| Apply | `src/app/(marketing)/apply/page.tsx`, `apply/actions.ts`, `src/features/leads/components/ApplyForm.tsx` |
| Thanks | `src/app/(marketing)/thanks/page.tsx` |
| Waitlist | `src/app/(marketing)/waitlist/page.tsx` |
| Admin Leads | `src/app/(main)/admin/leads/page.tsx`, `LeadsTable.tsx`, `src/features/leads/services/leadScorer.ts` |
| Admin Funnel | `src/app/(main)/admin/funnel/page.tsx` |
| Invitacion | `src/actions/invites.ts`, `src/lib/email/resend.ts` |
| Activacion | `src/app/(auth)/invite/[token]/page.tsx`, `src/features/invites/components/InviteForm.tsx` |
| Login | `src/app/(auth)/login/page.tsx` |
| Tracking | `src/lib/tracking.ts` |

### Tablas de BD involucradas

| Tabla | Rol en el funnel |
|-------|-----------------|
| `leads` | Almacena postulaciones, status, scoring |
| `invites` | Tokens de invitacion, expiracion, consumo |
| `profiles` | Perfil de usuario post-activacion, access_level, trial |
| `funnel_events` | Tracking de todos los eventos del funnel |
| `plants` | First value: creacion de la primera planta |
| `production_readings` | Retencion: lecturas que generan valor |

### Schemas Zod

| Schema | Archivo | Uso |
|--------|---------|-----|
| `leadSchema` | `src/features/leads/types/schemas.ts` | Validacion del formulario /apply |
| `consumeInviteSchema` | `src/features/invites/types/schemas.ts` | Validacion al activar cuenta |

---

*Documento generado el 20 de Febrero, 2026.*
*Soiling Calc v2.0 — Funnel de adquisicion invite-only con programa Founding 10.*
