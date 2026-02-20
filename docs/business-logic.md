# BUSINESS_LOGIC.md - Soiling Calc

> Fecha: 2026-02-20 | Version: 2.0

## 1. Problema de Negocio

**Dolor:** Los operadores de plantas fotovoltaicas no tienen forma economica de medir cuanto estan perdiendo por suciedad (soiling). Los sensores de irradiancia (piranometros) cuestan 200-2000 EUR, las decisiones de limpieza se basan en intuicion, y no hay herramientas accesibles que cuantifiquen las perdidas en EUR.

**Costo actual (sin Soiling Calc):**
- ~200-2000 EUR en sensores de irradiancia por instalacion
- ~8-15 horas/mes analizando datos en Excel manualmente
- ~2-3 limpiezas innecesarias al ano (300-450 EUR desperdiciados)
- ~500-3000 EUR/ano en perdidas por soiling no detectado
- Decisiones de limpieza sin base cientifica (por calendario o "a ojo")

## 2. Solucion

**Propuesta de valor:** Una plataforma SaaS que calcula automaticamente el soiling de plantas fotovoltaicas usando datos meteorologicos gratuitos (Open-Meteo) y el modelo NOCT estandar de la industria, eliminando la necesidad de sensores fisicos y hojas de calculo manuales.

**Flujo principal (Happy Path):**
1. Operador crea su planta con datos tecnicos (modulos, potencia, ubicacion)
2. Cada dia, registra los kWh producidos (lectura del inversor)
3. El sistema obtiene automaticamente la irradiancia de Open-Meteo (con cache)
4. El motor NOCT calcula cuanto deberian haber producido los paneles limpios
5. Compara produccion real vs teorica → calcula soiling % y perdidas EUR
6. Acumula perdidas desde la ultima limpieza
7. Emite recomendacion: OK / VIGILAR / LIMPIAR PRONTO / URGENTE
8. Cuando el operador limpia, marca "dia de limpieza" → reset del baseline
9. El ciclo se repite con un nuevo punto de referencia limpio

**Modelo de acceso: Invite-Only**
1. Visitante llega a la landing page
2. Se postula via formulario (/apply) con datos de su instalacion
3. Admin califica el lead (scoring automatico + revision manual)
4. Si califica, admin genera invitacion con token
5. Prospecto recibe email, crea cuenta, comienza a usar el sistema

## 3. Usuario Objetivo

**Roles:**
- **Admin:** Gestiona leads, genera invitaciones, ve funnel de conversion, accede a UI Kit
- **Founding/Paid:** Usuario activo con acceso completo a plantas y lecturas
- **Free (trial):** Acceso limitado por tiempo (trial_ends_at) y max_plants

**Contexto:** Operadores de plantas solares de pequena y mediana escala (1-50 kWp) — instalaciones residenciales, comerciales e industriales pequenas — que quieren optimizar el mantenimiento de limpieza sin invertir en sensores caros.

**Perfil tipico:**
- Dueno de instalacion FV residencial o comercial
- Empresa de O&M (Operations & Maintenance) con multiples plantas
- Ingeniero solar que gestiona un portfolio de instalaciones
- No necesita conocimientos tecnicos avanzados: solo ingresa kWh y fecha

## 4. Arquitectura de Datos

**Input del usuario:**
- Datos de la planta: ubicacion (lat, lon), modulos (cantidad, potencia, area), orientacion (tilt, azimut), parametros tecnicos (NOCT, temp_coeff, eficiencia), economia (precio energia, coste limpieza)
- Lecturas diarias: fecha, kWh producidos, tipo de lectura, si hubo limpieza

**Input automatico (Open-Meteo):**
- Irradiancia global horizontal (GHI) en kWh/m2
- Irradiancia en plano inclinado (POA) en kWh/m2
- Temperatura maxima y media del dia

**Output calculado (Motor NOCT):**
- Temperatura de celda (modelo NOCT)
- kWh teoricos (produccion de paneles limpios)
- Performance Ratio (PR actual vs baseline)
- Soiling % (degradacion por suciedad)
- Perdida diaria en kWh y EUR
- Perdidas acumuladas desde ultima limpieza
- Recomendacion de limpieza (OK/WATCH/RECOMMENDED/URGENT)
- Dias hasta break-even

**Output para el usuario:**
- Dashboard con 3 graficos interactivos
- Card de recomendacion con badge de color
- Historial de lecturas completo
- Exportacion CSV

**Storage (Supabase tables):**

```sql
-- Plantas fotovoltaicas
plants (
  id uuid primary key,
  user_id uuid references auth.users(id),
  name text not null,
  latitude double precision, longitude double precision,
  num_modules integer, module_power_wp double precision, module_area_m2 double precision,
  total_power_kw double precision GENERATED ALWAYS,
  total_area_m2_calc double precision GENERATED ALWAYS,
  tilt_degrees double precision default 30,
  azimuth_degrees double precision default 180,
  noct double precision default 45,
  temp_coeff_percent double precision default -0.40,
  module_efficiency double precision default 0.20,
  energy_price_eur double precision default 0.12,
  cleaning_cost_eur double precision default 150,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- Lecturas de produccion con calculos
production_readings (
  id uuid primary key,
  plant_id uuid references plants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  reading_date date not null,
  kwh_real double precision not null,        -- INPUT del usuario
  reading_type text default 'DAILY',
  is_cleaning_day boolean default false,
  irradiance_kwh_m2 double precision,        -- De Open-Meteo
  poa_w_m2 double precision,
  temp_ambient_c double precision,
  t_cell_c double precision,                 -- CALCULADO (NOCT)
  kwh_theoretical double precision,           -- CALCULADO
  kwh_loss double precision,
  loss_percent double precision,
  loss_eur double precision,
  pr_current double precision,
  pr_baseline double precision,
  soiling_percent double precision,
  cumulative_loss_kwh double precision,
  cumulative_loss_eur double precision,
  cleaning_recommendation text,              -- OK/WATCH/RECOMMENDED/URGENT
  days_to_breakeven integer,
  created_at timestamptz default now(),
  UNIQUE(plant_id, reading_date)
)

-- Cache de irradiancia (evita llamadas redundantes a Open-Meteo)
irradiance_cache (
  cache_key text unique,                     -- lat_lon_date
  latitude double precision, longitude double precision,
  cache_date date,
  ghi_kwh_m2 double precision, poa_kwh_m2 double precision,
  temp_max_c double precision, temp_mean_c double precision,
  fetched_at timestamptz default now(),
  expires_at timestamptz                     -- NULL = nunca expira (historico)
)

-- Perfiles de usuario con roles y suscripcion
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  access_level access_level default 'free',  -- founding/admin/paid/free
  trial_ends_at timestamptz,
  max_plants integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- Leads (postulaciones via /apply)
leads (
  id uuid primary key,
  email text, company text, phone text,
  notes text,                                -- Notas del admin
  funnel_stage text,
  lead_score integer,                        -- Scoring automatico
  created_at timestamptz default now()
)

-- Invitaciones de equipo
invites (
  id uuid primary key,
  from_user_id uuid,                         -- Admin que invita
  to_email text,
  token text unique,                         -- Token de invitacion
  expires_at timestamptz,
  accepted_at timestamptz,                   -- NULL si pendiente
  created_at timestamptz default now()
)

-- Eventos del funnel de conversion
funnel_events (
  id uuid primary key,
  user_id uuid,
  event_type text,
  metadata jsonb,
  created_at timestamptz default now()
)
```

**Row Level Security (RLS):** Activo en TODAS las tablas. Patron: `auth.uid() = user_id`. Excepciones: `irradiance_cache` (SELECT publico), `profiles` (service_role full access para admin).

## 5. KPI de Exito

**Metrica principal:** Permitir que un operador fotovoltaico sepa cuanto esta perdiendo por soiling y si debe limpiar, en menos de 30 segundos despues de ingresar sus kWh del dia.

**Metricas secundarias:**
- Precision del modelo: soiling calculado vs soiling real (medido con sensor) < 3% de error
- Tiempo de carga del dashboard con graficos < 2 segundos
- Tasa de conversion del funnel: apply → invitado → activo > 30%
- Retencion: > 70% de usuarios activos despues de 30 dias
- NPS de operadores > 40

**Metricas tecnicas:**
- Build exitoso: 0 errores TypeScript
- Cache hit rate de irradiancia > 60%
- Design system health score > 9/10

## 6. Especificacion Tecnica

### Features Implementadas (Feature-First)

```
src/features/
├── auth/              # Autenticacion invite-only          [COMPLETADO]
├── plants/            # CRUD plantas + validacion Zod      [COMPLETADO]
├── readings/          # Registro de lecturas + formulario   [COMPLETADO]
├── soiling/           # Motor NOCT + graficos + dashboard   [COMPLETADO]
├── irradiance/        # Open-Meteo client + cache Supabase  [COMPLETADO]
├── leads/             # CRM + scoring + tabla admin         [COMPLETADO]
├── invites/           # Invitaciones con token              [COMPLETADO]
├── settings/          # Perfil + cambio contrasena          [COMPLETADO]
├── demo/              # Demo publica con datos ejemplo      [COMPLETADO]
└── marketing/         # Landing hero + features + FAQ       [COMPLETADO]
```

### Stack Confirmado
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 3.4 + Tokens Semanticos
- **Backend:** Supabase (Auth + Database + RLS + SSR cookies)
- **Calculo:** Motor NOCT puro TypeScript (funciones sin side effects)
- **Irradiancia:** Open-Meteo API (gratuito, sin API key)
- **Validacion:** Zod 4.x
- **Estado:** Zustand 5.x
- **Graficos:** Recharts 3.7 (dynamic import, client-only)
- **Email:** Resend (invitaciones, recovery)
- **Design System:** CSS custom properties + tailwind.config.ts + UI Kit interno

### Fases de Implementacion

1. [x] Fase 1: Auth base + Supabase setup
2. [x] Fase 2: Base de datos (plants, readings, irradiance_cache + RLS)
3. [x] Fase 3: Motor NOCT + Open-Meteo client + cache
4. [x] Fase 4: Dashboard + graficos + exportacion CSV
5. [x] Fase 5: Profiles + invites + leads + funnel
6. [x] Fase 6: Landing page + marketing + demo
7. [x] Fase 7: Design system (tokens semanticos, 8 fases de brand consistency)
8. [x] Fase 8: UI Kit + portfolio v5 (24 capturas)

### Pendiente (Roadmap)
- [ ] Integracion con inversores (SolarEdge, Huawei, Fronius API)
- [ ] Alertas por email cuando soiling > umbral
- [ ] Sistema de pagos (Stripe)
- [ ] Dashboard multi-planta (portfolio view)
- [ ] Modelo Perez completo para irradiancia POA
- [ ] API publica para integradores
