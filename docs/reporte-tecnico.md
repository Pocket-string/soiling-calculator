# Reporte Tecnico — Soiling Calc

**Version:** 2.0
**Fecha:** 2026-02-20
**Estado del proyecto:** Produccion (funcionalidad completa + design system unificado)

---

## Tabla de Contenidos

1. [Vision General](#1-vision-general)
2. [Problema que Resuelve](#2-problema-que-resuelve)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Base de Datos](#5-base-de-datos)
6. [Motor de Calculo NOCT](#6-motor-de-calculo-noct)
7. [Integracion con Open-Meteo](#7-integracion-con-open-meteo)
8. [Flujo Completo de una Lectura](#8-flujo-completo-de-una-lectura)
9. [Funcionalidades de la Aplicacion](#9-funcionalidades-de-la-aplicacion)
10. [Design System y Tokens Semanticos](#10-design-system-y-tokens-semanticos)
11. [Componentes UI Clave](#11-componentes-ui-clave)
12. [Seguridad y Autenticacion](#12-seguridad-y-autenticacion)
13. [API Routes y Server Actions](#13-api-routes-y-server-actions)
14. [Tipos TypeScript](#14-tipos-typescript)
15. [Estructura de Archivos](#15-estructura-de-archivos)
16. [Variables de Entorno](#16-variables-de-entorno)
17. [Decisiones de Diseno](#17-decisiones-de-diseno)
18. [Portfolio Visual](#18-portfolio-visual)
19. [Metricas del Proyecto](#19-metricas-del-proyecto)

---

## 1. Vision General

**Soiling Calc** es una aplicacion web SaaS para monitorear y calcular el impacto economico de la suciedad (soiling) en instalaciones fotovoltaicas. Permite a operadores de plantas solares:

- Registrar lecturas diarias de produccion energetica
- Obtener automaticamente la irradiancia solar de su ubicacion (sin instalar sensores)
- Calcular el soiling usando el modelo NOCT estandar de la industria
- Cuantificar las perdidas economicas acumuladas desde la ultima limpieza
- Recibir recomendaciones de limpieza basadas en analisis coste-beneficio

El sistema incluye ademas una landing page marketing, un panel de gestion de leads para administradores, un funnel de conversion, y un design system documentado con UI Kit interno.

---

## 2. Problema que Resuelve

### Contexto del dominio

Las plantas solares pierden entre un **3% y un 25%** de produccion por acumulacion de polvo, arena, aves y contaminantes sobre los paneles. Esta perdida se llama **soiling**.

El problema para el operador es doble:
1. **¿Cuanto estoy perdiendo?** — Sin sensores especializados, es dificil medir el soiling
2. **¿Vale la pena limpiar?** — El coste de limpieza vs la energia recuperable no siempre justifica la operacion

### Solucion implementada

**Medir el soiling sin sensores fisicos:**
- Obtiene irradiancia solar del historial meteorologico de Open-Meteo (gratuito, global)
- Calcula con el modelo NOCT cuanta energia *deberian* producir los paneles limpios
- Compara esa produccion teorica con la produccion medida real
- La diferencia entre PR actual y PR del ultimo dia limpio = soiling %

**Decidir cuando limpiar:**
- Acumula perdidas economicas dia a dia
- Calcula los dias necesarios para recuperar el coste de limpieza (break-even)
- Emite recomendacion en 4 niveles: OK / VIGILAR / LIMPIAR / URGENTE

---

## 3. Stack Tecnologico

| Capa | Tecnologia | Version | Justificacion |
|------|-----------|---------|--------------|
| Framework | Next.js | ^16.0.0 | App Router, Server Actions, Turbopack, full-stack en un repo |
| Runtime | React | ^19.0.0 | Server Components, streaming, acciones nativas |
| Lenguaje | TypeScript | ^5.7.0 | Type safety en runtime y compile-time |
| Estilos | Tailwind CSS | ^3.4.0 | Utility-first con tokens semanticos via CSS custom properties |
| UI Components | shadcn/ui | — | Primitivas accesibles sobre Radix UI |
| Base de datos | Supabase / PostgreSQL | ^2.49.0 | Auth + Database + RLS sin servidor propio |
| SSR Auth | @supabase/ssr | ^0.6.0 | Sesiones server-side en cookies HTTP-only |
| Validacion | Zod | ^4.3.6 | Schemas tipados que se usan en cliente y servidor |
| Estado global | Zustand | ^5.0.9 | Minimal, sin boilerplate |
| Graficos | Recharts | ^3.7.0 | LineChart + BarChart con API declarativa |
| Email | Resend | ^6.6.0 | Transaccional: invitaciones, recovery, notificaciones |
| E2E Testing | Playwright | ^1.58.2 | Automatizacion de navegador + screenshots |
| Gestor paquetes | pnpm | — | Instalacion rapida, deduplicacion de dependencias |

### Servicios externos

| Servicio | Proposito | Coste |
|----------|----------|-------|
| Supabase | Auth + PostgreSQL + Row Level Security | Gratuito (plan free) |
| Open-Meteo | API de irradiancia y meteorologia historica | Gratuito, sin API key |
| Resend | Emails transaccionales (invitaciones, recovery) | Gratuito hasta 100/dia |

---

## 4. Arquitectura del Sistema

### Patron Feature-First

El codigo esta organizado por funcionalidad, no por tipo de archivo. Esto colocaliza todo el contexto de una feature en un solo directorio:

```
src/
├── actions/                     # Server Actions de React 19
│   ├── auth.ts                  # login, logout, resetPassword
│   ├── plants.ts                # CRUD plantas
│   ├── readings.ts              # Crear/borrar lecturas (orquestador principal)
│   ├── profile.ts               # Actualizar perfil de usuario
│   ├── leads.ts                 # Gestion de leads (admin)
│   └── invites.ts               # Invitaciones de equipo
│
├── app/                         # Next.js App Router (26 rutas)
│   ├── (auth)/                  # Flujo de autenticacion (7 rutas)
│   ├── (main)/                  # App protegida (10 rutas)
│   ├── (marketing)/             # Landing + marketing (5 rutas)
│   ├── (public)/                # Paginas publicas/legales (4 rutas)
│   └── api/                     # API Routes
│
├── features/                    # Logica por funcionalidad
│   ├── auth/                    # Autenticacion
│   ├── plants/                  # Gestion de plantas FV
│   ├── readings/                # Registro de lecturas
│   ├── soiling/                 # Motor de calculo + dashboard
│   ├── irradiance/              # Cliente Open-Meteo + cache
│   ├── leads/                   # CRM de leads (admin)
│   ├── invites/                 # Invitaciones de equipo
│   ├── settings/                # Perfil + cambio de contrasena
│   ├── demo/                    # Pagina demo con datos de ejemplo
│   └── marketing/               # Componentes landing page
│
├── components/
│   ├── ui/                      # Primitivas (Button, Card, Input, Select, Badge, KpiCard)
│   ├── layout/                  # MainShell, Sidebar, Header
│   └── public/                  # Componentes marketing/publicos (16 archivos)
│
├── lib/
│   ├── supabase/                # Clientes browser + server + service
│   ├── tokens/                  # status-map.ts (fuente unica de verdad para estados)
│   ├── auth.ts                  # requireAuth, requireAdmin, getProfile
│   └── email/                   # Templates y cliente Resend
│
└── config/
    └── siteConfig.ts            # Textos centralizados de toda la app
```

### Flujo de datos

```
Browser (Client Component)
    ↓ form action / fetch
Server Action ('use server')
    ↓ validacion Zod
    ↓ verificacion auth + ownership
    ↓ Open-Meteo (con cache Supabase)
    ↓ Motor NOCT (calculos puros TS)
    ↓ INSERT production_readings
    ↓ revalidatePath
Browser (actualiza con datos frescos)
```

Los Server Components leen datos directamente desde Supabase (server-side), sin APIs intermedias para operaciones de lectura.

### Grupos de rutas

| Grupo | Layout | Navegacion | Rutas |
|-------|--------|------------|-------|
| `(marketing)` | MarketingLayout | MarketingNav + MarketingFooter | Landing, apply, thanks, waitlist, demo |
| `(public)` | PublicLayout | Navbar + Footer (4-col) | Contacto, servicios, equipo, terminos, privacidad |
| `(auth)` | AuthLayout (split-screen) | Ninguna | Login, signup, forgot-password, update-password, check-email, invite |
| `(main)` | MainLayout + Sidebar | Sidebar colapsable | Plants, readings, settings, admin/leads, admin/funnel, admin/ui-kit |

---

## 5. Base de Datos

### Esquema completo (8 tablas)

Las tablas se crearon con migraciones numeradas 000-008.

### Tabla: `plants`

Almacena la configuracion tecnica y economica de cada instalacion fotovoltaica.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK, generado automaticamente |
| `user_id` | UUID | FK → `auth.users`, RLS filter |
| `name` | TEXT | Nombre descriptivo |
| `latitude` | DOUBLE | Coordenadas geograficas para Open-Meteo |
| `longitude` | DOUBLE | |
| `num_modules` | INTEGER | Cantidad de modulos fotovoltaicos |
| `module_power_wp` | DOUBLE | Potencia unitaria nominal (Wp) |
| `module_area_m2` | DOUBLE | Superficie del modulo (m2) |
| `total_power_kw` | DOUBLE | **GENERATED** = `num_modules * module_power_wp / 1000` |
| `total_area_m2_calc` | DOUBLE | **GENERATED** = `num_modules * module_area_m2` |
| `tilt_degrees` | DOUBLE | Inclinacion del plano (0-90, default 30) |
| `azimuth_degrees` | DOUBLE | Orientacion (0-360, default 180 = sur) |
| `noct` | DOUBLE | Nominal Operating Cell Temperature (default 45C) |
| `temp_coeff_percent` | DOUBLE | Coeficiente temperatura (%/C, default -0.40) |
| `module_efficiency` | DOUBLE | Eficiencia del modulo (decimal, default 0.20) |
| `energy_price_eur` | DOUBLE | Precio de venta energia (EUR/kWh, default 0.12) |
| `cleaning_cost_eur` | DOUBLE | Coste de limpieza completa (EUR, default 150) |
| `created_at` | TIMESTAMPTZ | Timestamp creacion |
| `updated_at` | TIMESTAMPTZ | Auto-actualizado por trigger |

> **Importante:** Las columnas marcadas como GENERATED no deben incluirse en INSERT/UPDATE.

### Tabla: `production_readings`

Almacena cada lectura diaria con todos los valores calculados por el motor NOCT.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK |
| `plant_id` | UUID | FK → `plants(id)` ON DELETE CASCADE |
| `user_id` | UUID | FK → `auth.users(id)` ON DELETE CASCADE |
| `reading_date` | DATE | **UNIQUE** con `plant_id` (una lectura/dia) |
| `kwh_real` | DOUBLE | **Input del usuario:** produccion medida (kWh) |
| `reading_type` | TEXT | `'DAILY'` / `'WEEKLY'` / `'MONTHLY'` |
| `is_cleaning_day` | BOOLEAN | Paneles limpiados antes de esta lectura? |
| `irradiance_kwh_m2` | DOUBLE | GHI de Open-Meteo (kWh/m2) |
| `poa_w_m2` | DOUBLE | Irradiancia en plano inclinado equivalente (W/m2) |
| `temp_ambient_c` | DOUBLE | Temperatura ambiente media del dia (C) |
| `t_cell_c` | DOUBLE | **Calculado:** temperatura de celda (modelo NOCT) |
| `kwh_theoretical` | DOUBLE | **Calculado:** produccion si paneles limpios |
| `kwh_loss` | DOUBLE | **Calculado:** perdida = `kwh_theoretical - kwh_real` |
| `loss_percent` | DOUBLE | **Calculado:** `kwh_loss / kwh_theoretical * 100` |
| `loss_eur` | DOUBLE | **Calculado:** `kwh_loss * energy_price_eur` |
| `pr_current` | DOUBLE | **Calculado:** Performance Ratio = `kwh_real / kwh_theoretical` |
| `pr_baseline` | DOUBLE | PR del ultimo dia de limpieza valido (baseline) |
| `soiling_percent` | DOUBLE | **Calculado:** `(1 - PR_actual / PR_baseline) * 100` |
| `cumulative_loss_kwh` | DOUBLE | Perdida acumulada desde ultima limpieza (kWh) |
| `cumulative_loss_eur` | DOUBLE | Perdida acumulada desde ultima limpieza (EUR) |
| `cleaning_recommendation` | TEXT | `'OK'` / `'WATCH'` / `'RECOMMENDED'` / `'URGENT'` |
| `days_to_breakeven` | INTEGER | Dias para recuperar el coste de limpieza |
| `created_at` | TIMESTAMPTZ | Timestamp creacion |

### Tabla: `irradiance_cache`

Cache de datos meteorologicos para evitar llamadas redundantes a Open-Meteo.

| Columna | Tipo | Notas |
|---------|------|-------|
| `cache_key` | TEXT | **UNIQUE** = `${lat(2dec)}_${lon(2dec)}_${date}` |
| `latitude` | DOUBLE | Redondeada a 2 decimales (~1.1 km precision) |
| `longitude` | DOUBLE | |
| `cache_date` | DATE | Fecha de los datos meteorologicos |
| `ghi_kwh_m2` | DOUBLE | Irradiancia global horizontal (kWh/m2) |
| `poa_kwh_m2` | DOUBLE | Irradiancia en plano inclinado (kWh/m2) |
| `temp_max_c` | DOUBLE | Temperatura maxima del dia |
| `temp_mean_c` | DOUBLE | Temperatura media del dia |
| `fetched_at` | TIMESTAMPTZ | Cuando se obtuvo de la API |
| `expires_at` | TIMESTAMPTZ | NULL para datos historicos, +24h para el dia actual |

### Tabla: `profiles`

Extension del usuario de Supabase Auth con roles y suscripcion.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | TEXT | Nombre completo (nullable) |
| `access_level` | ENUM | `'founding'` / `'admin'` / `'paid'` / `'free'` (default: free) |
| `trial_ends_at` | TIMESTAMPTZ | Fecha de fin de trial (nullable) |
| `max_plants` | INTEGER | Limite de plantas (default: 1) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Tabla: `leads`

Formulario de postulacion (`/apply`). Almacena datos de prospectos.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK |
| `email` | TEXT | Email del prospecto |
| `company` | TEXT | Empresa |
| `phone` | TEXT | Telefono |
| `notes` | TEXT | Notas internas del admin |
| `funnel_stage` | TEXT | Etapa en el funnel |
| `lead_score` | INTEGER | Puntuacion automatica |
| `created_at` | TIMESTAMPTZ | |

### Tabla: `invites`

Invitaciones de equipo para el modelo invite-only.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK |
| `from_user_id` | UUID | FK → admin que invita |
| `to_email` | TEXT | Email del invitado |
| `token` | TEXT | Token unico de invitacion |
| `expires_at` | TIMESTAMPTZ | Expiracion |
| `accepted_at` | TIMESTAMPTZ | Cuando fue aceptada (nullable) |

### Tabla: `funnel_events`

Eventos de tracking del funnel de conversion.

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | UUID | PK |
| `user_id` | UUID | FK (nullable) |
| `event_type` | TEXT | Tipo de evento |
| `metadata` | JSONB | Datos adicionales |
| `created_at` | TIMESTAMPTZ | |

### Row Level Security (RLS)

Todas las tablas tienen RLS activo:

```sql
-- Patron aplicado en plants, production_readings, profiles
CREATE POLICY "user_owns_row" ON {table}
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles: lectura/escritura de perfil propio + acceso total service_role
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- irradiance_cache: SELECT publico (datos no sensibles)
CREATE POLICY "Public read" ON irradiance_cache FOR SELECT USING (true);
```

---

## 6. Motor de Calculo NOCT

**Archivo:** `src/features/soiling/services/soilingCalculator.ts`

El motor implementa el modelo NOCT (Nominal Operating Cell Temperature), estandar de la industria fotovoltaica para estimar produccion real bajo condiciones variables de temperatura e irradiancia.

### Paso 1: Temperatura de celda

```
T_celda = T_ambiente + ((NOCT - 20) / 800) * POA
```

- `T_ambiente`: temperatura media del dia (C), de Open-Meteo
- `NOCT`: parametro del modulo (tipicamente 43-48C, default 45C)
- `POA`: irradiancia en plano del modulo (W/m2)

### Paso 2: Correccion de potencia por temperatura

```
P_corregida = P_STC * (1 + (T_celda - 25) * gamma / 100)
```

- `P_STC`: potencia en condiciones estandar de prueba (kW)
- `gamma`: coeficiente de temperatura (%/C, tipicamente -0.4)

### Paso 3: Recorte por inversor (clipping)

```
P_efectiva = min(P_corregida, P_STC * 1.10)
```

Limita la potencia al 110% de P_STC para simular la saturacion del inversor.

### Paso 4: Produccion teorica diaria

```
kWh_teorico = P_efectiva * PSH
```

- `PSH` (Peak Sun Hours): equivale numericamente al GHI en kWh/m2/dia

### Paso 5: Performance Ratio

```
PR = kWh_real / kWh_teorico
PR = max(0, min(1.10, PR))  ← acotado para detectar outliers
```

### Paso 6: Calculo de Soiling

```
Soiling% = max(0, (1 - PR_actual / PR_baseline) * 100)
```

- `PR_baseline`: PR del ultimo dia de limpieza registrado
- Si no existe baseline: Soiling% = 0 (primer ciclo de la planta)

### Deteccion de outliers

```
Es outlier si: PR < 0.30 O PR > 1.05
```

Las lecturas outlier **no actualizan el baseline**, protegiendo los calculos futuros.

### Sistema de recomendacion

| Nivel | Condicion | Color |
|-------|-----------|-------|
| `OK` | Soiling < 3% Y perdida acum. < 40% del coste limpieza | Verde (success) |
| `WATCH` | Soiling 3-7% | Amarillo (warning) |
| `RECOMMENDED` | Soiling > 7% O perdida acum. > 80% del coste limpieza | Naranja |
| `URGENT` | Soiling > 15% O perdida acum. > 2x coste limpieza | Rojo (error) |

**Fuente unica de verdad:** `src/lib/tokens/status-map.ts` — define labels, mensajes y clases Tailwind para cada nivel. Todos los componentes importan de ahi.

**Break-even:**
```
Dias break-even = ceil(coste_limpieza / perdida_diaria_EUR)
```

---

## 7. Integracion con Open-Meteo

**Archivos:**
- `src/features/irradiance/services/openMeteoClient.ts`
- `src/features/irradiance/services/irradianceService.ts`

### API Open-Meteo

Open-Meteo es una API meteorologica gratuita con datos historicos desde 1940. No requiere API key.

**Endpoints usados:**
- `archive-api.open-meteo.com` → datos historicos (fechas pasadas)
- `api.open-meteo.com/v1/forecast` → datos del dia actual

**Parametros solicitados:**
```
latitude, longitude
start_date = end_date = YYYY-MM-DD
daily=shortwave_radiation_sum,temperature_2m_max,temperature_2m_mean
```

**Conversion de unidades:**
```
GHI (kWh/m2) = shortwave_radiation_sum (MJ/m2) / 3.6
```

**Conversion GHI → POA:**
```
POA (kWh/m2) = GHI * (1 + sin(tilt_rad) * 0.15)
```

### Sistema de cache

**Clave de cache:** `${lat.toFixed(2)}_${lon.toFixed(2)}_${date}`

**Logica de cache:**
```
1. Buscar en irradiance_cache WHERE cache_key = key
2. Si existe Y (expires_at IS NULL O expires_at > NOW()):
   → Devolver datos del cache (source: 'cache')
3. Si no existe o expiro:
   → Llamar a Open-Meteo API
   → UPSERT en irradiance_cache
   → Para datos historicos: expires_at = NULL (nunca expiran)
   → Para hoy: expires_at = NOW() + 24h
   → Devolver datos frescos (source: 'api')
```

---

## 8. Flujo Completo de una Lectura

Flujo que ejecuta el Server Action `createReading`:

```
Usuario ingresa: fecha, kWh reales medidos, tipo, hay limpieza?
       ↓
[1] VALIDACION ZOD
    - plant_id: UUID valido
    - reading_date: formato YYYY-MM-DD, no futuro
    - kwh_real: numero >= 0
    - reading_type: enum DAILY/WEEKLY/MONTHLY
    - is_cleaning_day: boolean
       ↓
[2] AUTENTICACION
    - getUser() de Supabase
    - Si no hay sesion → error "No autorizado"
       ↓
[3] VERIFICAR OWNERSHIP DE PLANTA
    - SELECT * FROM plants WHERE id = plant_id AND user_id = auth.uid()
    - Si no existe → error "Planta no encontrada"
       ↓
[4] OBTENER IRRADIANCIA (con cache)
    - getOrFetchIrradiance(lat, lon, date, tilt)
    - Retorna: ghi_kwh_m2, poa_kwh_m2, temp_max_c, temp_mean_c
       ↓
[5] CALCULAR TEMPERATURA DE CELDA
    - poa_w_m2 = poa_kwh_m2 * 1000 / 8   (aprox: 8h sol/dia)
    - t_cell_c = calcCellTemperature(temp_mean_c, noct, poa_w_m2)
       ↓
[6] CALCULAR kWh TEORICOS (NOCT)
    - calcTheoreticalKwh({total_power_kw, noct, temp_coeff, t_cell_c}, ghi_kwh_m2)
       ↓
[7] CALCULAR PERFORMANCE RATIO ACTUAL
    - pr_current = kwh_real / kwh_theoretical
    - is_outlier = (pr_current < 0.30 || pr_current > 1.05)
       ↓
[8] OBTENER BASELINE
    - Si is_cleaning_day Y NO es outlier: pr_baseline = pr_current
    - Si no: buscar ultimo dia de limpieza valido en la BD
       ↓
[9] CALCULAR SOILING %
    - Si hay baseline: soiling_percent = max(0, (1 - pr/baseline) * 100)
    - Si no hay baseline: soiling_percent = 0
       ↓
[10] CALCULAR PERDIDAS DEL DIA
    - kwh_loss = max(0, kwh_theoretical - kwh_real)
    - loss_eur = kwh_loss * energy_price_eur
       ↓
[11] CALCULAR PERDIDAS ACUMULADAS
    - SUM desde ultima limpieza + perdida de hoy
    - Si es dia de limpieza: reset a 0
       ↓
[12] CALCULAR RECOMENDACION
    - calcCleaningRecommendation → OK/WATCH/RECOMMENDED/URGENT + days_to_breakeven
       ↓
[13] INSERT en production_readings
    - UNIQUE(plant_id, reading_date) → error 23505 si ya existe
       ↓
[14] INVALIDAR CACHE NEXT.JS
    - revalidatePath('/plants/{id}') + revalidatePath('/plants')
       ↓
Redirect a /plants/{id} con datos actualizados
```

---

## 9. Funcionalidades de la Aplicacion

### 9.1 Autenticacion (modelo invite-only)

- **Login** con email y contrasena (toggle mostrar/ocultar)
- **Recuperacion de contrasena** por email via Resend
- **Registro solo por invitacion**: `/signup` redirige a `/apply`
- **Invitaciones de equipo**: administradores generan tokens con expiracion
- Sesion persistida en cookies HTTP-only via `@supabase/ssr`

### 9.2 Gestion de Plantas

**Crear planta** — Formulario con 5 secciones:
1. **Identificacion:** nombre, latitud, longitud
2. **Modulos:** cantidad, potencia por modulo (Wp), area por modulo (m2)
3. **Orientacion:** inclinacion (tilt), azimut
4. **Parametros tecnicos:** NOCT, coeficiente de temperatura, eficiencia
5. **Economia:** precio de energia (EUR/kWh), coste de limpieza (EUR)

**Listar plantas** — Grid de tarjetas con:
- Nombre + badge de nivel de soiling (CleaningLevelBadge)
- Potencia instalada (kWp) y numero de modulos
- Soiling % actual, PR actual, perdida acumulada (EUR)
- Fecha de ultima lectura

**Editar / Eliminar** — Con confirmacion explicita; CASCADE en lecturas

### 9.3 Registro de Lecturas

- **Fecha:** selector de fecha (maximo hoy)
- **kWh producidos:** produccion real medida del inversor
- **Tipo de lectura:** Diaria / Semanal / Mensual
- **Dia de limpieza:** checkbox que resetea el baseline de soiling

Al guardar, ejecuta automaticamente el flujo completo de la seccion 8.

### 9.4 Dashboard de Planta

**Card de recomendacion** — Badge de nivel + mensaje + 4 KPIs (soiling %, PR, perdida EUR, break-even)

**Grafico de Soiling** — LineChart con lineas de referencia (7% VIGILAR, 15% URGENTE) + puntos de limpieza

**Grafico de Performance Ratio** — LineChart con PR actual + PR baseline

**Grafico de Perdidas** — BarChart con perdida economica diaria (EUR)

**Historial de lecturas** — Tabla con todos los valores, indicadores de limpieza y outliers, colores por soiling

### 9.5 Exportacion CSV

Desde detalle de planta, descarga CSV con todas las lecturas:
```
filename: soiling-{nombre-planta}-{fecha}.csv
columnas: fecha, tipo, kwh_real, kwh_teorico, pr_actual_%, pr_baseline_%,
          soiling_%, perdida_kwh, perdida_eur, acumulado_eur, dias_break_even,
          recomendacion, dia_limpieza, irradiancia_kwh_m2, temp_media_c, t_celda_c
```

### 9.6 Demo Publica

Pagina `/demo` con datos de ejemplo precalculados: KPIs, tabla de lecturas, graficos interactivos. Permite a visitantes explorar la funcionalidad sin crear cuenta.

### 9.7 Panel Admin — Gestion de Leads

- **Tabla de leads** con filtros por estado (Todos, Por calificar, Postulados, Calificados, etc.)
- **KPIs**: total, postulados, score promedio, calificados, invitados, activos
- **Acciones**: calificar, enviar invitacion, rechazar
- **Score automatico** basado en datos del formulario de postulacion

### 9.8 Panel Admin — Funnel de Conversion

- **Metricas del funnel**: Leads → Invitados → Activados → Plantas → Lecturas
- **Tasas de conversion** entre etapas
- **Eventos recientes** con timeline

### 9.9 Panel Admin — UI Kit

Pagina interna en `/admin/ui-kit` con 9 secciones documentadas:
1. Colores semanticos (fondos, texto, bordes)
2. Paleta de marca (primary, secondary, accent + status colors)
3. Tipografia (escala completa con font-families)
4. Botones (variantes + tamanos + estados)
5. Badges (variantes + CleaningLevelBadge)
6. Cards (default + bordered + KPI cards)
7. Formularios (inputs normales, con hint, con error, deshabilitados + selects)
8. Espaciado y bordes (radius, shadows)
9. Reglas del design system

### 9.10 Landing Page y Marketing

- **Hero** con CTA principal
- **Features grid** con iconos y descripciones
- **FAQ** con acordeon interactivo
- **Formulario de postulacion** (`/apply`) con scoring automatico
- **Paginas legales**: terminos de servicio, politica de privacidad
- **Paginas informativas**: equipo, servicios, contacto

### 9.11 Sidebar de Navegacion

- **Expandido (default):** iconos + etiquetas de texto
- **Colapsado:** modo icono-only, se expande al hacer hover
- **Secciones:** Mis Plantas, Nueva Planta, [Admin: Gestion Leads, Funnel], Configuracion
- **Footer:** avatar + email + badge Admin + boton cerrar sesion

---

## 10. Design System y Tokens Semanticos

### Filosofia

El proyecto usa un sistema de **tokens semanticos** basado en CSS custom properties, definidos en `globals.css` y consumidos via `tailwind.config.ts`. Esto permite:
- Cambiar toda la paleta modificando solo las variables CSS
- Soporte para dark mode sin cambiar clases
- Consistencia garantizada en 100+ componentes

### Tokens de color

| Rol | Token Tailwind | Valor Light | Valor Dark |
|-----|---------------|-------------|------------|
| Fondo pagina | `bg-background` | #FAFBFC | #020617 |
| Superficie (cards) | `bg-surface` | #FFFFFF | #0F172A |
| Superficie alt | `bg-surface-alt` | #F8FAFC | #1E293B |
| Texto principal | `text-foreground` | #0F172A | #F8FAFC |
| Texto secundario | `text-foreground-secondary` | #64748B | #94A3B8 |
| Texto muted | `text-foreground-muted` | #94A3B8 | #64748B |
| Borde default | `border-border` | #E2E8F0 | #1E293B |
| Borde light | `border-border-light` | #F1F5F9 | #0F172A |
| Borde dark | `border-border-dark` | #CBD5E1 | #334155 |

### Paleta de marca

| Rol | Token | Hex base |
|-----|-------|----------|
| Primary (azul marino) | `primary-50` a `primary-900` | #1E3A5F |
| Secondary (dorado) | `secondary-50` a `secondary-900` | #D4A853 |
| Accent (azul brillante) | `accent-50` a `accent-900` | #2563EB |
| Success | `success-50` a `success-700` | Verde |
| Warning | `warning-50` a `warning-700` | Ambar |
| Error | `error-50` a `error-700` | Rojo |

### Tipografia

| Contexto | Font Family | Token |
|----------|-------------|-------|
| App (dashboard) | Inter | `font-sans` |
| Marketing headings | DM Sans | `font-heading` |
| Codigo / datos | System mono | `font-mono` |

Escala: `text-display-2xl` → `text-display-xs` (marketing), `text-body-xl` → `text-body-xs` (app)

### Bordes y sombras

| Token | Uso |
|-------|-----|
| `rounded-lg` (0.5rem) | Cards, inputs, buttons |
| `rounded-md` (0.375rem) | Badges, chips |
| `rounded-full` | Avatares, iconos circulares |
| `shadow-card` | Cards en reposo |
| `shadow-card-hover` | Cards en hover |
| `shadow-elevated` | Dropdowns, modals |

### Reglas del design system

- **NUNCA** usar clases hardcodeadas de Tailwind (`text-gray-600`, `bg-white`, `border-gray-200`)
- **SIEMPRE** usar tokens semanticos (`text-foreground-secondary`, `bg-surface`, `border-border`)
- **NUNCA** usar `rounded-xl` o `rounded-2xl` — maximo `rounded-lg`
- **Excepciones**: secciones dark intencionales (Footer `bg-slate-900`, HeroSection gradients)

### Health Score: 9.3/10

| Dimension | Score |
|-----------|-------|
| Tokens semanticos | 9/10 |
| Tipografia | 8/10 |
| Estado/colores | 10/10 |
| Layout | 9/10 |
| Auth coherencia | 10/10 |
| Copy/microcopy | 9/10 |
| UI Kit | 10/10 |

---

## 11. Componentes UI Clave

### Primitivas UI (src/components/ui/)

| Componente | Descripcion |
|-----------|------------|
| `Button` | Variantes: default, secondary, outline, ghost, destructive. Soporte `isLoading` |
| `Input` | Input con label integrado, error message, hint text. Accesible con aria-describedby |
| `Card` | Sistema de composicion: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `Select` | Select nativo con label y error |
| `Badge` | Variantes: default, success, warning, error, outline |
| `KpiCard` | Tarjeta para metricas con titulo, valor, subtitulo, color |
| `ConfirmDialog` | Modal de confirmacion para acciones destructivas |

### Layout (src/components/layout/)

| Componente | Descripcion |
|-----------|------------|
| `MainShell` | Layout principal con sidebar colapsable. Gestiona estado collapsed |
| `Sidebar` | Navegacion lateral: logo, links con iconos, seccion admin, footer con user info |

### Feature Components

| Componente | Descripcion |
|-----------|------------|
| `CleaningLevelBadge` | Badge con color segun STATUS_MAP. Fuente unica de verdad |
| `ChartsSection` | Client Component wrapper para Recharts con dynamic import (ssr: false) |
| `CleaningRecommendationCard` | Card principal del dashboard: badge grande + mensaje + 4 KPIs |
| `PlantCard` | Tarjeta del grid con hover effect y datos resumidos |
| `ReadingList` | Tabla con scroll, colores por soiling, indicadores limpieza/outlier |
| `ApplyForm` | Formulario de postulacion con validacion Zod + scoring automatico |

### Marketing Components (src/components/public/ + src/features/marketing/)

16 componentes publicos: Navbar, MobileMenu, Footer, HeroSection, CTABanner, ValueCards, AboutSection, ContactSection, ContactForm, ServicesGrid, TabbedContent, TestimonialsCarousel, SectionHeading, PublicPageWrapper, MarketingNav, MarketingFooter, LandingHero, LandingFeatures, LandingFAQ.

---

## 12. Seguridad y Autenticacion

### Capas de seguridad

**Capa 1 — Middleware Next.js:**
Redirige a `/login` si no hay sesion activa al acceder a rutas `(main)/`.

**Capa 2 — Server Actions:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'No autorizado' }

const { data: plant } = await supabase
  .from('plants')
  .select('*')
  .eq('id', plantId)
  .eq('user_id', user.id)  // ← ownership check
  .single()
```

**Capa 3 — Row Level Security de Supabase:**
Politicas RLS en PostgreSQL garantizan aislamiento a nivel de base de datos, independiente del codigo.

**Capa 4 — Validacion Zod:**
Todas las entradas pasan por schemas Zod antes de cualquier procesamiento.

**Capa 5 — Control de acceso por roles:**
```typescript
export async function requireAdmin() {
  const user = await requireAuth()
  const profile = await getProfile(user.id)
  if (profile?.access_level === 'admin') return user
  // Fallback: email-based check
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email === adminEmail) return user
  redirect('/plants')
}
```

### Gestion de sesion

- JWT + refresh tokens gestionados por Supabase
- Cookies HTTP-only via `@supabase/ssr` con chunked encoding
- `createServerClient` en Server Actions (con cookies)
- `createBrowserClient` para operaciones cliente
- `createServiceClient` para operaciones admin (bypasses RLS)

---

## 13. API Routes y Server Actions

### API Routes

| Metodo | Ruta | Descripcion |
|--------|------|------------|
| GET | `/api/plants/[id]/export` | Genera CSV con lecturas de una planta |

**Autenticacion:** Verifica sesion + ownership. Errores: 401, 403, 404, 500.

### Server Actions (6 archivos)

| Archivo | Funciones |
|---------|-----------|
| `auth.ts` | login, logout, resetPassword, updatePassword |
| `plants.ts` | getPlants, getPlantById, createPlant, updatePlant, deletePlant |
| `readings.ts` | createReading, deleteReading, getReadings |
| `profile.ts` | updateProfile, changePassword |
| `leads.ts` | createLead, updateLeadStatus, qualifyLead |
| `invites.ts` | createInvite, acceptInvite, listInvites |

---

## 14. Tipos TypeScript

```typescript
// Niveles de recomendacion de limpieza
type CleaningLevel = 'OK' | 'WATCH' | 'RECOMMENDED' | 'URGENT'

// Tipo de lectura
type ReadingType = 'DAILY' | 'WEEKLY' | 'MONTHLY'

// Niveles de acceso
type AccessLevel = 'founding' | 'admin' | 'paid' | 'free'

// Planta fotovoltaica
interface Plant {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  num_modules: number
  module_power_wp: number
  module_area_m2: number
  total_power_kw: number        // columna GENERATED
  total_area_m2_calc: number    // columna GENERATED
  tilt_degrees: number
  azimuth_degrees: number
  noct: number
  temp_coeff_percent: number
  module_efficiency: number
  energy_price_eur: number
  cleaning_cost_eur: number
  created_at: string
  updated_at: string
}

// Planta con estadisticas para el listado
interface PlantWithStats extends Plant {
  latest_reading: {
    reading_date: string
    soiling_percent: number | null
    cleaning_recommendation: CleaningLevel | null
    pr_current: number | null
    cumulative_loss_eur: number | null
  } | null
}

// Lectura de produccion con calculos
interface ProductionReading {
  id: string
  plant_id: string
  user_id: string
  reading_date: string
  kwh_real: number
  reading_type: ReadingType
  is_cleaning_day: boolean
  irradiance_kwh_m2: number | null
  poa_w_m2: number | null
  temp_ambient_c: number | null
  t_cell_c: number | null
  kwh_theoretical: number | null
  kwh_loss: number | null
  loss_percent: number | null
  loss_eur: number | null
  pr_current: number | null
  pr_baseline: number | null
  soiling_percent: number | null
  cumulative_loss_kwh: number | null
  cumulative_loss_eur: number | null
  cleaning_recommendation: CleaningLevel | null
  days_to_breakeven: number | null
  created_at: string
}

// Datos de irradiancia obtenidos (cache o API)
interface IrradianceData {
  date: string
  ghi_kwh_m2: number
  poa_kwh_m2: number
  temp_max_c: number
  temp_mean_c: number
  source: 'cache' | 'api'
}

// Perfil de usuario
interface Profile {
  id: string
  full_name: string | null
  access_level: AccessLevel
  trial_ends_at: string | null
  max_plants: number
  created_at: string
  updated_at: string
}

// Configuracion de estados (fuente unica de verdad)
interface StatusConfig {
  label: string
  message: string
  badge: string   // Tailwind classes
  dot: string     // Tailwind class
  pill: string    // Tailwind classes
}
```

---

## 15. Estructura de Archivos

```
.
├── src/
│   ├── actions/
│   │   ├── auth.ts                              # login, logout, resetPassword
│   │   ├── plants.ts                            # CRUD plantas
│   │   ├── readings.ts                          # Crear/borrar lecturas
│   │   ├── profile.ts                           # Actualizar perfil
│   │   ├── leads.ts                             # Gestion de leads
│   │   └── invites.ts                           # Invitaciones de equipo
│   │
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                       # Layout split-screen
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx                  # Redirige a /apply
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── update-password/page.tsx
│   │   │   ├── check-email/page.tsx
│   │   │   └── invite/[token]/page.tsx
│   │   │
│   │   ├── (main)/
│   │   │   ├── layout.tsx                       # MainShell con sidebar
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── plants/
│   │   │   │   ├── page.tsx                     # Grid de plantas
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                 # Dashboard detalle
│   │   │   │       ├── settings/page.tsx
│   │   │   │       └── readings/new/page.tsx
│   │   │   └── admin/
│   │   │       ├── leads/page.tsx               # Gestion de leads
│   │   │       ├── funnel/page.tsx              # Funnel de conversion
│   │   │       └── ui-kit/page.tsx              # Design system interno
│   │   │
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                         # Landing page
│   │   │   ├── demo/page.tsx
│   │   │   ├── apply/page.tsx                   # Formulario postulacion
│   │   │   ├── thanks/page.tsx
│   │   │   └── waitlist/page.tsx
│   │   │
│   │   ├── (public)/
│   │   │   ├── contacto/page.tsx
│   │   │   ├── equipo/page.tsx
│   │   │   ├── servicios/page.tsx
│   │   │   ├── terminos/page.tsx
│   │   │   └── privacidad/page.tsx
│   │   │
│   │   ├── api/plants/[id]/export/route.ts
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   ├── globals.css                          # Tokens semanticos CSS
│   │   └── layout.tsx                           # Root layout
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainShell.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── header.tsx
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   └── confirm-dialog.tsx
│   │   └── public/                              # 16 componentes marketing
│   │       ├── Navbar.tsx
│   │       ├── MobileMenu.tsx
│   │       ├── Footer.tsx
│   │       ├── HeroSection.tsx
│   │       ├── CTABanner.tsx
│   │       ├── ValueCards.tsx
│   │       ├── AboutSection.tsx
│   │       ├── ContactSection.tsx
│   │       ├── ContactForm.tsx
│   │       ├── ServicesGrid.tsx
│   │       ├── TabbedContent.tsx
│   │       ├── TestimonialsCarousel.tsx
│   │       ├── SectionHeading.tsx
│   │       └── PublicPageWrapper.tsx
│   │
│   ├── features/
│   │   ├── auth/components/                     # LoginForm, ForgotPasswordForm, etc.
│   │   ├── plants/components/                   # PlantCard, PlantForm, PlantList, etc.
│   │   ├── readings/components/                 # ReadingForm, ReadingList
│   │   ├── soiling/
│   │   │   ├── components/                      # ChartsSection, SoilingChart, LossesChart
│   │   │   └── services/soilingCalculator.ts    # Motor NOCT
│   │   ├── irradiance/services/                 # openMeteoClient, irradianceService
│   │   ├── leads/components/                    # ApplyForm, LeadsFilterBar, ScoreTooltip
│   │   ├── invites/components/                  # InviteForm
│   │   ├── settings/components/                 # ProfileForm, ChangePasswordForm
│   │   ├── demo/components/                     # DemoKPIs, DemoReadingTable
│   │   └── marketing/components/                # LandingHero, LandingFeatures, etc.
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                        # createBrowserClient
│   │   │   └── server.ts                        # createServerClient + createServiceClient
│   │   ├── tokens/
│   │   │   └── status-map.ts                    # STATUS_MAP (fuente unica de verdad)
│   │   ├── auth.ts                              # requireAuth, requireAdmin, getProfile
│   │   └── email/resend.ts                      # Cliente Resend + templates
│   │
│   └── config/
│       └── siteConfig.ts                        # Textos centralizados
│
├── scripts/
│   ├── seed-readings.js                         # Genera 36 lecturas con fisica real
│   ├── migrate-006-007-profiles-invites.js      # Migracion profiles + invites
│   ├── migrate-008-funnel-events.js             # Migracion funnel events
│   ├── screenshot-portfolio.mjs                 # Capturas paginas publicas
│   └── screenshot-auth.mjs                      # Capturas paginas autenticadas
│
├── portfolio/
│   ├── v1/                                      # 6 capturas — diseno original
│   ├── v2/                                      # 4 capturas — validacion rediseno
│   ├── v3/                                      # 8 capturas — version pre-branding
│   ├── v4/                                      # 13 capturas — post-tokens app
│   └── v5/                                      # 24 capturas — version final
│
├── docs/
│   └── reporte-tecnico.md                       # Este archivo
│
├── .claude/
│   ├── PRPs/
│   │   ├── PRP-001-calculadora-soiling-v2.md    # Blueprint principal
│   │   └── PRP-002-roadmap-integraciones.md     # Roadmap enterprise
│   └── brand-contract.md                        # Contrato de marca (9.3/10)
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── CLAUDE.md
```

---

## 16. Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Para operaciones admin (getProfile, migraciones)

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # URL base de la aplicacion
ADMIN_EMAIL=admin@soiling.test             # Fallback para verificacion admin por email

# Notas:
# - Open-Meteo es gratuito y no necesita API key
# - Resend API key se configura si se activa el envio de emails
```

---

## 17. Decisiones de Diseno

### ¿Por que Next.js 16 en lugar de mantener Python + Next.js?

El proyecto anterior tenia un backend Python/FastAPI y un frontend Next.js. Mantener dos repositorios, dos deployments y dos lenguajes duplicaba el esfuerzo. Next.js 16 con Server Actions permite implementar toda la logica de negocio en TypeScript directamente en el servidor.

### ¿Por que Open-Meteo en lugar de sensores fisicos?

Los sensores de irradiancia (piranometros) cuestan entre 200 y 2000 EUR por instalacion. Open-Meteo ofrece datos historicos con resolucion de 1-2 km, suficiente para instalaciones de pequena y mediana escala, sin coste ni hardware.

### ¿Por que el modelo NOCT?

NOCT es el modelo estandar de la industria FV. Es simple (una formula), requiere solo 2 parametros del modulo y es suficientemente preciso para calculos de soiling donde el objetivo es la tendencia relativa.

### ¿Por que Supabase?

PostgreSQL gestionado + autenticacion JWT + Row Level Security nativo + cliente TypeScript tipado + plan gratuito generoso. RLS elimina middleware de autorizacion manual.

### ¿Por que cache de irradiancia en Supabase?

Para plantas en la misma zona geografica y lecturas historicas (datos inmutables), cachear evita llamadas redundantes a Open-Meteo, reduce latencia y protege contra interrupciones de la API externa.

### ¿Por que Recharts con dynamic import?

Recharts usa APIs de DOM que no existen en Node.js. Los componentes se importan con `dynamic(() => import(...), { ssr: false })` dentro de un Client Component.

### ¿Por que tokens semanticos en lugar de clases Tailwind directas?

Un sistema de 200+ componentes con colores hardcodeados (`text-gray-600`) es imposible de mantener. Los tokens semanticos (`text-foreground-secondary`) permiten:
- Cambiar toda la paleta en un archivo
- Dark mode automatico
- Consistencia garantizada por convencion
- UI Kit como documentacion viva

### ¿Por que modelo invite-only?

Para un SaaS B2B especializado, el modelo invite-only permite:
- Cualificacion de leads antes del onboarding
- Control de calidad de la base de usuarios
- Funnel de conversion medible
- Sentido de exclusividad

---

## 18. Portfolio Visual

La carpeta `portfolio/` contiene capturas de pantalla de la evolucion visual del proyecto:

### v1 — Diseno original (6 capturas)
| Archivo | Contenido |
|---------|-----------|
| `01-dashboard-plantas.png` | Grid inicial de plantas |
| `02-detalle-planta-hero.png` | Vista detalle con primeros graficos |
| `03-formulario-nueva-lectura.png` | Formulario de registro |
| `04-login.png` | Pantalla de login original |
| `05-graficos-soiling-perdidas.png` | Graficos en version beta |
| `06-historial-lecturas.png` | Tabla de historial inicial |

### v2 — Validacion del rediseno (4 capturas)
| Archivo | Contenido |
|---------|-----------|
| `redesign-01-plants-sidebar.png` | Nuevo sidebar dark |
| `redesign-02-detail-full.png` | Detalle completo rediseñado |
| `redesign-03-kpi-cards.png` | Cards KPI con iconos |
| `redesign-04-sidebar-collapsed.png` | Sidebar en modo colapsado |

### v3 — Version pre-branding (8 capturas)
| Archivo | Contenido |
|---------|-----------|
| `01-login.png` | Login con panel slate-900 |
| `02-dashboard-plantas.png` | Grid de plantas |
| `03-detalle-planta-hero.png` | Dashboard con KPIs |
| `04-detalle-planta-full.png` | Scroll completo |
| `05-sidebar-colapsado.png` | Modo icono-only |
| `06-nueva-lectura.png` | Formulario de lectura |
| `07-configuracion-planta.png` | Configuracion |
| `08-historial-lecturas.png` | Historial con badges |

### v4 — Post-tokens app (13 capturas)
Primeras capturas tras la migracion de tokens semanticos en la app autenticada.

### v5 — Version final (24 capturas)
Captura completa de toda la aplicacion tras las 8 fases de brand consistency.

| # | Archivo | Contenido |
|---|---------|-----------|
| 01 | `01-landing-hero.png` | Landing page hero |
| 02 | `02-landing-full.png` | Landing page completa |
| 03 | `03-servicios.png` | Pagina de servicios |
| 04 | `04-contacto.png` | Pagina de contacto |
| 05 | `05-equipo.png` | Pagina de equipo |
| 06 | `06-apply-form.png` | Formulario de postulacion |
| 07 | `07-demo-hero.png` | Demo hero |
| 08 | `08-demo-full.png` | Demo completa |
| 09 | `09-login.png` | Login (split-screen) |
| 10 | `10-forgot-password.png` | Recuperar contrasena |
| 11 | `11-check-email.png` | Verificar email |
| 12 | `12-dashboard-plantas.png` | Grid de plantas con datos reales |
| 13 | `13-nueva-planta.png` | Formulario crear planta |
| 14 | `14-detalle-planta-hero.png` | Dashboard planta (hero) |
| 15 | `15-detalle-planta-full.png` | Dashboard planta (scroll completo) |
| 16 | `16-nueva-lectura.png` | Formulario nueva lectura |
| 17 | `17-configuracion-planta.png` | Configuracion de planta |
| 18 | `18-settings.png` | Configuracion de usuario |
| 19 | `19-admin-leads.png` | Gestion de leads (admin) |
| 20 | `20-admin-funnel.png` | Funnel de conversion (admin) |
| 21 | `21-ui-kit-hero.png` | UI Kit — colores y tipografia |
| 22 | `22-ui-kit-full.png` | UI Kit — pagina completa (9 secciones) |
| 23 | `23-terminos.png` | Terminos de servicio |
| 24 | `24-privacidad.png` | Politica de privacidad |

---

## 19. Metricas del Proyecto

| Metrica | Valor |
|---------|-------|
| Rutas totales (pages) | 26 |
| Componentes totales | 95+ |
| Server Actions | 6 archivos |
| API Routes | 1 |
| Features (dominios) | 10 |
| Tablas en base de datos | 8 (con RLS activo) |
| Tokens semanticos CSS | 12+ |
| Paletas de marca | 3 (primary, secondary, accent) + 3 status |
| Dependencias de produccion | 8 |
| Dependencias de desarrollo | 9 |
| Scripts de automatizacion | 5 |
| Capturas de portfolio | 55 (v1-v5) |
| Health score del design system | 9.3/10 |

---

*Documento generado el 2026-02-20. Para el historial de decisiones y cambios durante el desarrollo, ver [.claude/PRPs/PRP-001-calculadora-soiling-v2.md](../.claude/PRPs/PRP-001-calculadora-soiling-v2.md). Para el contrato de marca vigente, ver [.claude/brand-contract.md](../.claude/brand-contract.md).*
