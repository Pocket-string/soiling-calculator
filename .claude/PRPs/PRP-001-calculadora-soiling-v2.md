# PRP-001: Calculadora de Soiling V2

> **Estado**: PENDIENTE
> **Fecha**: 2026-02-17
> **Proyecto**: Nueva Calculadora de Soiling
> **Autor del requisito**: Jonathan

---

## Objetivo

Migrar y reconstruir completamente la Calculadora de Soiling desde un backend Python/FastAPI hacia un stack full-stack Next.js 16 + Supabase, eliminando el servidor Python, añadiendo seguridad real con RLS, y entregando un dashboard multi-planta con graficos historicos, recomendaciones economicas inteligentes y export CSV.

---

## Por Que

| Problema | Solucion |
|----------|----------|
| Backend Python separado: doble despliegue, doble mantenimiento | Todo en Next.js Server Actions: un solo repo, un solo deploy |
| Sin RLS real en Supabase v1: cualquier usuario lee datos de otro | RLS por `user_id` en cada tabla, politicas estrictas |
| Sin validacion de tipos en frontend: errores en runtime | Zod en cada Server Action + tipos TypeScript generados desde el schema |
| Sin graficos historicos: imposible ver tendencias de PR/soiling | Recharts integrado con datos de Supabase agregados |
| Sin cache de irradiancia: llamada a Open-Meteo en cada lectura | Cache en tabla `irradiance_cache` con TTL de 24 horas |
| Dashboard de planta unica: no escala para flotas | Vista multi-planta con resumen por planta y drill-down |

**Valor de negocio**: Reducir tiempo de mantenimiento del stack en 60%, habilitar multi-usuario real, y proporcionar ROI claro de cada limpieza con analisis economico integrado.

---

## Que

### Criterios de Exito

- [ ] Un usuario autenticado puede crear plantas solares con todos sus parametros tecnicos
- [ ] Al registrar una lectura diaria, el sistema calcula automaticamente kWh teoricos, PR, soiling % y perdidas economicas
- [ ] La irradiancia se obtiene de Open-Meteo (o del cache si ya existe para ese dia/ubicacion)
- [ ] Al marcar `is_cleaning_day = true`, el baseline de PR se resetea correctamente
- [ ] La recomendacion de limpieza muestra 4 niveles (OK, WATCH, RECOMMENDED, URGENT) con analisis break-even
- [ ] El dashboard multi-planta muestra estado actual de todas las plantas del usuario
- [ ] Los graficos historicos muestran PR, soiling %, y perdidas de los ultimos 30/90/180 dias
- [ ] El export CSV descarga todas las lecturas de una planta con sus calculos
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` produce build exitoso

### Comportamiento Esperado (Happy Path)

1. Usuario inicia sesion y ve dashboard con tarjeta por cada planta suya
2. Hace click en "Nueva Planta", completa formulario con datos tecnicos (lat, lon, modulos, etc.)
3. Cada dia ingresa la lectura: fecha, kWh medidos, tipo (DAILY), si ese dia limpio
4. El sistema llama a Open-Meteo (o cache) para obtener GHI/POA del dia
5. Calcula T_cell, P_temp, kWh teoricos, PR, soiling %
6. Muestra badge de recomendacion con dias para break-even y perdida acumulada
7. En la pagina de planta el usuario ve graficos historicos con tendencia de PR y soiling
8. Puede exportar a CSV para reportes externos

---

## Contexto

### Referencias Existentes en el Proyecto

- `src/actions/auth.ts` - Patron de Server Actions con Supabase a seguir exactamente
- `src/lib/supabase/server.ts` - `createClient()` y `createServiceClient()` disponibles
- `src/lib/supabase/client.ts` - Cliente browser disponible
- `src/features/dashboard/` - Patron de feature-first a replicar
- `src/features/dashboard/services/dashboardService.ts` - Patron de servicio con Supabase
- `src/components/ui/` - Button, Card, Badge, Input, Select disponibles (shadcn/ui)
- `src/components/layout/sidebar.tsx` - Sidebar ya existe, se deben agregar los nuevos nav items
- `src/app/(main)/layout.tsx` - Layout principal con Sidebar ya configurado
- `src/app/(main)/dashboard/page.tsx` - Patron de Server Component con auth check

### Dependencias a Instalar

```bash
npm install recharts zod
npm install @types/recharts --save-dev
```

Nota: `zod` puede no estar instalado aun - verificar en package.json antes de la Fase 1.

### API Open-Meteo

- URL base: `https://api.open-meteo.com/v1/forecast`
- Endpoint historico (datos pasados): `https://archive-api.open-meteo.com/v1/archive`
- Parametros clave: `latitude`, `longitude`, `daily=shortwave_radiation_sum`, `start_date`, `end_date`
- Respuesta: `daily.shortwave_radiation_sum` en MJ/m2/dia -> convertir a kWh/m2/dia dividiendo por 3.6
- Para POA (irradiancia en plano del modulo) usar `hourly=global_tilted_irradiance` con `tilt` y `azimuth`
- Gratuito, sin API key, limite de 10.000 llamadas/dia

### Arquitectura Propuesta (Feature-First)

```
src/features/
├── plants/                        # Gestion de plantas fotovoltaicas
│   ├── components/
│   │   ├── PlantCard.tsx          # Tarjeta resumen de planta con estado soiling
│   │   ├── PlantForm.tsx          # Formulario crear/editar planta
│   │   ├── PlantList.tsx          # Lista/grid de plantas del usuario
│   │   └── index.ts
│   ├── hooks/
│   │   ├── usePlants.ts           # Hook para lista de plantas
│   │   └── usePlant.ts            # Hook para planta individual
│   ├── services/
│   │   └── plantService.ts        # CRUD plants via Supabase
│   ├── store/
│   │   └── plantStore.ts          # Estado global de plantas seleccionadas
│   └── types/
│       └── index.ts               # Plant, PlantFormData, PlantWithStats
│
├── readings/                      # Lecturas de produccion
│   ├── components/
│   │   ├── ReadingForm.tsx         # Formulario nueva lectura
│   │   ├── ReadingList.tsx         # Tabla de lecturas con paginacion
│   │   └── index.ts
│   ├── hooks/
│   │   └── useReadings.ts
│   ├── services/
│   │   └── readingService.ts       # CRUD readings via Supabase
│   └── types/
│       └── index.ts                # Reading, ReadingFormData, ReadingWithCalcs
│
├── soiling/                       # Motor de calculo y dashboard
│   ├── components/
│   │   ├── SoilingDashboard.tsx    # Dashboard principal multi-planta
│   │   ├── PlantDetailView.tsx     # Vista detallada de una planta
│   │   ├── SoilingChart.tsx        # Grafico historico PR + soiling
│   │   ├── LossesChart.tsx         # Grafico perdidas economicas
│   │   ├── CleaningBadge.tsx       # Badge recomendacion (OK/WATCH/RECOMMENDED/URGENT)
│   │   ├── CleaningRecommendation.tsx  # Card con analisis economico
│   │   └── index.ts
│   ├── hooks/
│   │   └── useSoilingData.ts       # Hook para datos calculados
│   └── services/
│       └── soilingCalculator.ts    # Motor de calculo puro TypeScript
│
└── irradiance/                    # Cliente Open-Meteo + cache
    ├── services/
    │   ├── openMeteoClient.ts     # Cliente HTTP para Open-Meteo
    │   └── irradianceService.ts   # Cache + logica de obtencion
    └── types/
        └── index.ts               # IrradianceData, OpenMeteoResponse
```

---

## Schema de Base de Datos

### Migracion Completa (ejecutar en orden)

```sql
-- ============================================================
-- MIGRATION: 001_create_plants_table
-- ============================================================
CREATE TABLE plants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  num_modules         INTEGER NOT NULL CHECK (num_modules > 0),
  module_power_wp     DOUBLE PRECISION NOT NULL CHECK (module_power_wp > 0),
  module_area_m2      DOUBLE PRECISION NOT NULL CHECK (module_area_m2 > 0),
  total_power_kw      DOUBLE PRECISION GENERATED ALWAYS AS (num_modules * module_power_wp / 1000) STORED,
  total_area_m2       DOUBLE PRECISION GENERATED ALWAYS AS (num_modules * module_area_m2) STORED,
  tilt_degrees        DOUBLE PRECISION NOT NULL DEFAULT 30 CHECK (tilt_degrees >= 0 AND tilt_degrees <= 90),
  azimuth_degrees     DOUBLE PRECISION NOT NULL DEFAULT 180 CHECK (azimuth_degrees >= 0 AND azimuth_degrees <= 360),
  noct                DOUBLE PRECISION NOT NULL DEFAULT 45 CHECK (noct > 0),
  temp_coeff_percent  DOUBLE PRECISION NOT NULL DEFAULT -0.4,
  module_efficiency   DOUBLE PRECISION NOT NULL DEFAULT 0.20 CHECK (module_efficiency > 0 AND module_efficiency <= 1),
  energy_price_eur    DOUBLE PRECISION NOT NULL DEFAULT 0.12 CHECK (energy_price_eur > 0),
  cleaning_cost_eur   DOUBLE PRECISION NOT NULL DEFAULT 150 CHECK (cleaning_cost_eur > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice para buscar plantas de un usuario
CREATE INDEX idx_plants_user_id ON plants(user_id);

-- Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plants_select_own" ON plants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "plants_insert_own" ON plants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "plants_update_own" ON plants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "plants_delete_own" ON plants
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- MIGRATION: 002_create_production_readings_table
-- ============================================================
CREATE TABLE production_readings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id              UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_date          DATE NOT NULL,
  kwh_real              DOUBLE PRECISION NOT NULL CHECK (kwh_real >= 0),
  reading_type          TEXT NOT NULL DEFAULT 'DAILY' CHECK (reading_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  is_cleaning_day       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Irradiancia obtenida de Open-Meteo (kWh/m2)
  irradiance_kwh_m2     DOUBLE PRECISION,
  -- POA calculada (W/m2 equivalente)
  poa_w_m2              DOUBLE PRECISION,
  -- Temperatura ambiente (C)
  temp_ambient_c        DOUBLE PRECISION,

  -- Calculos del motor NOCT
  t_cell_c              DOUBLE PRECISION,        -- Temperatura de celda
  kwh_theoretical       DOUBLE PRECISION,        -- kWh teoricos limpios
  kwh_loss              DOUBLE PRECISION,        -- kWh perdidos por soiling
  loss_percent          DOUBLE PRECISION,        -- Porcentaje de perdida respecto teorico
  loss_eur              DOUBLE PRECISION,        -- Perdida economica en euros

  -- Performance Ratio
  pr_current            DOUBLE PRECISION,        -- PR del dia actual
  pr_baseline           DOUBLE PRECISION,        -- PR del baseline (ultimo dia de limpieza)
  soiling_percent       DOUBLE PRECISION,        -- Soiling = (1 - PR/baseline) * 100

  -- Acumulados desde la ultima limpieza
  cumulative_loss_kwh   DOUBLE PRECISION,
  cumulative_loss_eur   DOUBLE PRECISION,

  -- Recomendacion de limpieza
  cleaning_recommendation TEXT CHECK (cleaning_recommendation IN ('OK', 'WATCH', 'RECOMMENDED', 'URGENT')),
  days_to_breakeven     INTEGER,                 -- Dias para recuperar costo de limpieza

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Restriccion: una lectura por planta por fecha
  UNIQUE (plant_id, reading_date)
);

-- Indices para consultas frecuentes
CREATE INDEX idx_readings_plant_id ON production_readings(plant_id);
CREATE INDEX idx_readings_user_id ON production_readings(user_id);
CREATE INDEX idx_readings_date ON production_readings(reading_date DESC);
CREATE INDEX idx_readings_plant_date ON production_readings(plant_id, reading_date DESC);

-- RLS
ALTER TABLE production_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "readings_select_own" ON production_readings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "readings_insert_own" ON production_readings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "readings_update_own" ON production_readings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "readings_delete_own" ON production_readings
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- MIGRATION: 003_create_irradiance_cache_table
-- ============================================================
CREATE TABLE irradiance_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Clave de cache: lat/lon redondeados a 2 decimales + fecha
  cache_key     TEXT NOT NULL UNIQUE,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  cache_date    DATE NOT NULL,
  -- Irradiancia horizontal global (GHI) en kWh/m2/dia
  ghi_kwh_m2    DOUBLE PRECISION NOT NULL,
  -- Irradiancia POA en kWh/m2/dia (depende de tilt/azimuth - promedio 30/180)
  poa_kwh_m2    DOUBLE PRECISION,
  -- Temperatura maxima/media del dia
  temp_max_c    DOUBLE PRECISION,
  temp_mean_c   DOUBLE PRECISION,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Cache valido 24 horas para datos recientes, permanente para datos historicos
  expires_at    TIMESTAMPTZ
);

CREATE INDEX idx_irradiance_cache_key ON irradiance_cache(cache_key);
CREATE INDEX idx_irradiance_cache_date ON irradiance_cache(cache_date);

-- Sin RLS: es tabla de cache de sistema, no datos de usuario
-- El acceso se controla via service role en Server Actions
```

### Tipos TypeScript Generados del Schema

```typescript
// src/features/plants/types/index.ts

export interface Plant {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  num_modules: number
  module_power_wp: number
  module_area_m2: number
  total_power_kw: number    // columna generada
  total_area_m2: number     // columna generada
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

export interface PlantFormData {
  name: string
  latitude: number
  longitude: number
  num_modules: number
  module_power_wp: number
  module_area_m2: number
  tilt_degrees: number
  azimuth_degrees: number
  noct: number
  temp_coeff_percent: number
  module_efficiency: number
  energy_price_eur: number
  cleaning_cost_eur: number
}

export interface PlantWithLatestReading extends Plant {
  latest_reading?: ProductionReading | null
  soiling_status?: CleaningRecommendation
}

// src/features/readings/types/index.ts

export interface ProductionReading {
  id: string
  plant_id: string
  user_id: string
  reading_date: string
  kwh_real: number
  reading_type: 'DAILY' | 'WEEKLY' | 'MONTHLY'
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
  cleaning_recommendation: CleaningRecommendation | null
  days_to_breakeven: number | null
  created_at: string
}

export type CleaningRecommendation = 'OK' | 'WATCH' | 'RECOMMENDED' | 'URGENT'

export interface ReadingFormData {
  plant_id: string
  reading_date: string
  kwh_real: number
  reading_type: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  is_cleaning_day: boolean
}

// src/features/soiling/services/soilingCalculator.ts - tipos internos

export interface NOCTInputs {
  poa_w_m2: number         // Irradiancia en plano del modulo (W/m2)
  temp_ambient_c: number   // Temperatura ambiente (C)
  noct: number             // NOCT del modulo (C)
  temp_coeff_percent: number  // Coeficiente de temperatura (%/C)
  total_power_kw: number   // Potencia pico total instalada (kW)
  total_area_m2: number    // Area total de modulos (m2)
}

export interface NOCTResult {
  t_cell_c: number
  kwh_theoretical: number
}

export interface SoilingInputs {
  kwh_real: number
  kwh_theoretical: number
  pr_baseline: number | null
}

export interface SoilingResult {
  pr_current: number
  soiling_percent: number
}

export interface CleaningAnalysisInputs {
  soiling_percent: number
  cumulative_loss_eur: number
  cleaning_cost_eur: number
  daily_theoretical_kwh: number
  energy_price_eur: number
}

export interface CleaningAnalysisResult {
  recommendation: CleaningRecommendation
  days_to_breakeven: number
}
```

---

## Logica de Negocio Critica

### Motor de Calculo NOCT (TypeScript puro)

```typescript
// src/features/soiling/services/soilingCalculator.ts

const P_CLEAN_CLIP_FACTOR = 1.10  // clipping al 110% de P_stc

/**
 * Formula 1: Temperatura de celda (modelo NOCT)
 * T_cell = T_amb + ((NOCT - 20) / 800) * POA
 */
export function calcCellTemperature(
  tempAmbient_c: number,
  noct: number,
  poa_w_m2: number
): number {
  return tempAmbient_c + ((noct - 20) / 800) * poa_w_m2
}

/**
 * Formula 2: Potencia corregida por temperatura
 * P_temp = P_stc * (1 + (T_cell - 25) * gamma/100)
 * gamma en %/C (ej: -0.4)
 */
export function calcTempCorrectedPower(
  totalPowerKw: number,
  tCellC: number,
  tempCoeffPercent: number
): number {
  return totalPowerKw * (1 + (tCellC - 25) * (tempCoeffPercent / 100))
}

/**
 * Formula 3: kWh teoricos limpios
 * P_clean = P_temp * (POA / 1000), con clipping al 110% de P_stc
 * Para lectura diaria: multiplicar por horas efectivas
 * Usamos energia diaria = GHI * area * eficiencia (metodo simplificado)
 *
 * Para tipo DAILY: kwh = P_clean_kw * horas_sol_equivalentes
 * horas_sol_equivalentes = irradiance_kwh_m2 / 1 (ya en kWh/m2/dia)
 */
export function calcTheoreticalKwh(
  inputs: NOCTInputs,
  irradiance_kwh_m2: number
): NOCTResult {
  const poa_w_m2 = inputs.poa_w_m2
  const tCell = calcCellTemperature(inputs.temp_ambient_c, inputs.noct, poa_w_m2)
  const pTempKw = calcTempCorrectedPower(
    inputs.total_power_kw,
    tCell,
    inputs.temp_coeff_percent
  )

  // Clipping al 110% de potencia nominal
  const pClipLimit = inputs.total_power_kw * P_CLEAN_CLIP_FACTOR
  const pEffKw = Math.min(pTempKw, pClipLimit)

  // kWh teoricos: potencia * horas sol equivalentes
  // horas sol equivalentes = irradiancia diaria / 1 kW/m2
  const horasSol = irradiance_kwh_m2  // GHI en kWh/m2 = PSH (Peak Sun Hours)
  const kwhTheoretical = Math.max(0, pEffKw * horasSol)

  return { t_cell_c: tCell, kwh_theoretical: kwhTheoretical }
}

/**
 * Formula 4: Performance Ratio
 * PR = kWh_real / kWh_theoretical
 * Acotado entre 0 y 1.1 para detectar outliers
 */
export function calcPerformanceRatio(kwhReal: number, kwhTheoretical: number): number {
  if (kwhTheoretical <= 0) return 0
  const pr = kwhReal / kwhTheoretical
  return Math.min(Math.max(pr, 0), 1.1)
}

/**
 * Formula 5: Soiling %
 * Soiling = (1 - PR_current / PR_baseline) * 100
 * Si no hay baseline (primer ciclo) = 0
 */
export function calcSoilingPercent(prCurrent: number, prBaseline: number | null): number {
  if (prBaseline === null || prBaseline <= 0) return 0
  const soiling = (1 - prCurrent / prBaseline) * 100
  return Math.max(0, soiling)  // no puede ser negativo (PR > baseline = panel limpio)
}

/**
 * Deteccion de outliers para proteger el baseline
 * Un dia se considera outlier si PR < 0.3 o PR > 1.05
 * (podria ser lectura erronea, fallo del medidor, etc.)
 */
export function isOutlier(prCurrent: number): boolean {
  return prCurrent < 0.3 || prCurrent > 1.05
}

/**
 * Analisis economico y recomendacion de limpieza
 *
 * Niveles:
 * - OK:          soiling < 3%
 * - WATCH:       soiling 3-7%
 * - RECOMMENDED: soiling 7-15% O perdida acumulada > 80% del costo de limpieza
 * - URGENT:      soiling > 15% O perdida acumulada > 2x costo de limpieza
 *
 * Break-even: dias hasta que la perdida diaria acumule el costo de limpieza
 */
export function calcCleaningRecommendation(
  inputs: CleaningAnalysisInputs
): CleaningAnalysisResult {
  const {
    soiling_percent,
    cumulative_loss_eur,
    cleaning_cost_eur,
    daily_theoretical_kwh,
    energy_price_eur
  } = inputs

  // Perdida diaria estimada a partir del soiling actual
  const daily_loss_eur = daily_theoretical_kwh * (soiling_percent / 100) * energy_price_eur
  const days_to_breakeven = daily_loss_eur > 0
    ? Math.ceil(cleaning_cost_eur / daily_loss_eur)
    : 999

  let recommendation: CleaningRecommendation

  if (soiling_percent > 15 || cumulative_loss_eur > cleaning_cost_eur * 2) {
    recommendation = 'URGENT'
  } else if (soiling_percent > 7 || cumulative_loss_eur > cleaning_cost_eur * 0.8) {
    recommendation = 'RECOMMENDED'
  } else if (soiling_percent > 3) {
    recommendation = 'WATCH'
  } else {
    recommendation = 'OK'
  }

  return { recommendation, days_to_breakeven }
}
```

### Gestion del Baseline de PR

El baseline es el PR de los paneles cuando estan limpios. Se gestiona asi:

1. Cuando `is_cleaning_day = TRUE`: el `pr_baseline` de ese dia = `pr_current` (reset)
2. Para lecturas posteriores: `pr_baseline` = el `pr_current` del ultimo dia con `is_cleaning_day = TRUE`
3. Si no hay ningun dia de limpieza previo: `pr_baseline = NULL` (soiling = 0)
4. Los outliers (PR < 0.3 o PR > 1.05) no actualizan el baseline

Query para obtener el baseline vigente:
```sql
SELECT pr_current
FROM production_readings
WHERE plant_id = $1
  AND reading_date < $2
  AND is_cleaning_day = TRUE
  AND pr_current IS NOT NULL
  AND pr_current BETWEEN 0.3 AND 1.05
ORDER BY reading_date DESC
LIMIT 1
```

### Gestion de Perdidas Acumuladas

Las perdidas se acumulan desde la ultima limpieza:
```sql
SELECT COALESCE(SUM(kwh_loss), 0) as cumulative_kwh,
       COALESCE(SUM(loss_eur), 0) as cumulative_eur
FROM production_readings
WHERE plant_id = $1
  AND reading_date > (
    SELECT COALESCE(MAX(reading_date), '1970-01-01'::date)
    FROM production_readings
    WHERE plant_id = $1 AND is_cleaning_day = TRUE
  )
  AND reading_date < $2
```

### Cliente Open-Meteo

```typescript
// src/features/irradiance/services/openMeteoClient.ts

const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive'
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

export interface OpenMeteoDay {
  date: string
  ghi_kwh_m2: number     // shortwave_radiation_sum en MJ/m2 / 3.6
  temp_max_c: number
  temp_mean_c: number
}

export async function fetchDailyIrradiance(
  latitude: number,
  longitude: number,
  date: string,  // YYYY-MM-DD
  tilt: number = 30,
  azimuth: number = 180
): Promise<OpenMeteoDay> {
  const today = new Date().toISOString().split('T')[0]
  const isHistorical = date < today

  const baseUrl = isHistorical ? ARCHIVE_BASE : FORECAST_BASE
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    start_date: date,
    end_date: date,
    daily: 'shortwave_radiation_sum,temperature_2m_max,temperature_2m_mean',
    timezone: 'auto',
  })

  const response = await fetch(`${baseUrl}?${params}`, {
    next: { revalidate: 3600 }  // cache Next.js 1 hora
  })

  if (!response.ok) {
    throw new Error(`Open-Meteo error: ${response.status}`)
  }

  const data = await response.json()

  // shortwave_radiation_sum viene en MJ/m2 -> convertir a kWh/m2 dividiendo por 3.6
  const ghi_kwh_m2 = (data.daily.shortwave_radiation_sum[0] ?? 0) / 3.6

  return {
    date,
    ghi_kwh_m2,
    temp_max_c: data.daily.temperature_2m_max[0] ?? 20,
    temp_mean_c: data.daily.temperature_2m_mean[0] ?? 15,
  }
}
```

---

## Fases de Implementacion

### Fase 1: Fundamentos - DB, Tipos y Motor de Calculo
**Objetivo**: Tener el schema de Supabase creado con RLS, los tipos TypeScript definidos, y el motor de calculo NOCT funcionando con tests unitarios.

**Subtareas**:
1. Instalar dependencias: `npm install recharts zod`
2. Ejecutar migration `001_create_plants_table` via Supabase MCP
3. Ejecutar migration `002_create_production_readings_table` via Supabase MCP
4. Ejecutar migration `003_create_irradiance_cache_table` via Supabase MCP
5. Verificar con `get_advisors` que las 3 tablas tienen RLS activo
6. Crear `src/features/plants/types/index.ts` con tipos Plant, PlantFormData, PlantWithLatestReading
7. Crear `src/features/readings/types/index.ts` con tipos ProductionReading, ReadingFormData, CleaningRecommendation
8. Crear `src/features/soiling/services/soilingCalculator.ts` con las 5 funciones del motor NOCT
9. Crear `src/features/irradiance/services/openMeteoClient.ts`
10. Crear `src/features/irradiance/services/irradianceService.ts` (wrapper con logica de cache en Supabase)

**Validacion**:
- `npm run typecheck` sin errores en los nuevos archivos
- Tablas visibles en Supabase con RLS activo
- Las funciones del calculador producen resultados correctos para inputs de referencia:
  - Input: POA=800 W/m2, T_amb=25C, NOCT=45C -> T_cell debe ser ~45C
  - Input: PR_current=0.70, PR_baseline=0.75 -> Soiling debe ser ~6.67%

---

### Fase 2: Gestion de Plantas (CRUD)
**Objetivo**: Un usuario autenticado puede crear, ver, editar y eliminar sus plantas fotovoltaicas.

**Subtareas**:
1. Crear `src/actions/plants.ts` con Server Actions: `createPlant`, `updatePlant`, `deletePlant`, `getPlants`, `getPlantById`
2. Crear esquemas Zod en `src/features/plants/types/schemas.ts`: `plantSchema`, `plantFormSchema`
3. Crear `src/features/plants/services/plantService.ts` con funciones de acceso a Supabase (solo lectura, para Client Components)
4. Crear `src/features/plants/components/PlantForm.tsx` (formulario con todos los campos tecnicos + validacion)
5. Crear `src/features/plants/components/PlantCard.tsx` (tarjeta con nombre, potencia, estado soiling, ultimo PR)
6. Crear `src/features/plants/components/PlantList.tsx` (grid de PlantCards)
7. Crear `src/app/(main)/plants/page.tsx` (lista de plantas del usuario)
8. Crear `src/app/(main)/plants/new/page.tsx` (formulario nueva planta)
9. Crear `src/app/(main)/plants/[id]/page.tsx` (detalle de planta - placeholder para Fase 4)
10. Agregar `/plants` a los navItems del sidebar en `src/components/layout/sidebar.tsx`

**Esquema Zod para planta**:
```typescript
// src/features/plants/types/schemas.ts
import { z } from 'zod'

export const plantSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  num_modules: z.coerce.number().int().min(1, 'Minimo 1 modulo'),
  module_power_wp: z.coerce.number().min(1, 'Potencia minima 1 Wp'),
  module_area_m2: z.coerce.number().min(0.1, 'Area minima 0.1 m2'),
  tilt_degrees: z.coerce.number().min(0).max(90).default(30),
  azimuth_degrees: z.coerce.number().min(0).max(360).default(180),
  noct: z.coerce.number().min(20).max(80).default(45),
  temp_coeff_percent: z.coerce.number().min(-1).max(0).default(-0.4),
  module_efficiency: z.coerce.number().min(0.01).max(0.5).default(0.20),
  energy_price_eur: z.coerce.number().min(0.01).default(0.12),
  cleaning_cost_eur: z.coerce.number().min(1).default(150),
})
```

**Patron de Server Action para plantas**:
```typescript
// src/actions/plants.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { plantSchema } from '@/features/plants/types/schemas'

export async function createPlant(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const parsed = plantSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { data, error } = await supabase
    .from('plants')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/plants')
  return { data }
}
```

**Validacion**:
- Usuario puede crear una planta y verla en la lista
- Formulario muestra errores de validacion en tiempo real
- `npm run typecheck` pasa

---

### Fase 3: Registro de Lecturas y Motor de Calculo
**Objetivo**: Al registrar una lectura, el sistema obtiene irradiancia de Open-Meteo (o cache), ejecuta el motor NOCT, y persiste todos los calculos en Supabase.

**Subtareas**:
1. Crear `src/features/readings/types/schemas.ts` con `readingFormSchema`
2. Crear `src/actions/readings.ts` con `createReading` (Server Action principal que orquesta todo el flujo)
3. Implementar la funcion `getOrFetchIrradiance` en `irradianceService.ts` (busca en cache, si no existe llama a Open-Meteo y guarda)
4. Implementar la funcion `calculateReadingWithContext` en `soilingCalculator.ts` (obtiene baseline de DB, calcula acumulados, llama al motor)
5. Crear `src/features/readings/components/ReadingForm.tsx` (formulario: fecha, kWh real, tipo, checkbox limpieza)
6. Crear `src/features/readings/components/ReadingList.tsx` (tabla paginada con todas las lecturas y sus calculos)
7. Crear `src/features/readings/services/readingService.ts` (queries de lectura para Client Components)
8. Crear `src/app/(main)/plants/[id]/readings/new/page.tsx` (formulario nueva lectura)
9. Integrar lectura resultado en `src/app/(main)/plants/[id]/page.tsx` (tabla de lecturas recientes)

**Flujo completo de `createReading`**:
```
1. Validar FormData con Zod
2. Verificar auth y ownership de la planta
3. Obtener datos de la planta (NOCT, coeficientes, area, etc.)
4. Llamar getOrFetchIrradiance(lat, lon, fecha, tilt, azimuth)
5. Calcular POA desde GHI (simplificado: POA = GHI * factor_inclinacion)
6. Calcular T_cell con modelo NOCT
7. Calcular kWh_theoretical con motor NOCT
8. Calcular PR_current = kWh_real / kWh_theoretical
9. Detectar si es outlier -> si lo es, almacenar pero no actualizar baseline
10. Obtener PR_baseline de DB (ultimo is_cleaning_day=TRUE no outlier)
11. Si is_cleaning_day=TRUE: PR_baseline = PR_current (reset)
12. Calcular soiling_percent
13. Calcular acumulados desde ultima limpieza (query a DB)
14. Calcular recomendacion y break-even
15. INSERT en production_readings con todos los campos calculados
16. revalidatePath para la planta
17. Return { data: reading }
```

**Validacion**:
- Insertar una lectura con kWh conocidos produce los calculos esperados
- El cache de irradiancia funciona: segunda llamada misma fecha no llama a Open-Meteo
- Marcar `is_cleaning_day=TRUE` resetea el PR_baseline
- `npm run typecheck` pasa

---

### Fase 4: Dashboard Multi-Planta y Vista de Planta
**Objetivo**: Dashboard principal muestra tarjetas con estado de cada planta, y la vista de planta individual muestra lecturas recientes, grafico historico, y recomendacion de limpieza.

**Subtareas**:
1. Crear `src/features/soiling/components/SoilingDashboard.tsx` (grid de PlantCards con estado actual)
2. Crear `src/features/soiling/components/CleaningBadge.tsx` (badge con colores: verde/amarillo/naranja/rojo)
3. Crear `src/features/soiling/components/CleaningRecommendation.tsx` (card con soiling%, perdida acumulada, break-even, costo limpieza)
4. Crear `src/features/soiling/components/SoilingChart.tsx` (recharts LineChart con PR y soiling % en el tiempo)
5. Crear `src/features/soiling/components/LossesChart.tsx` (recharts BarChart con perdidas economicas diarias)
6. Completar `src/app/(main)/plants/[id]/page.tsx` con PlantDetailView completo
7. Actualizar `src/app/(main)/dashboard/page.tsx` (o crear redirect a `/plants` con resumen)
8. Agregar selector de periodo (30/90/180 dias) en la vista de planta

**Colores del CleaningBadge**:
```typescript
const BADGE_CONFIG = {
  OK:          { label: 'Sin soiling',   color: 'bg-green-100 text-green-800',  icon: 'check' },
  WATCH:       { label: 'Vigilar',       color: 'bg-yellow-100 text-yellow-800', icon: 'eye' },
  RECOMMENDED: { label: 'Limpiar pronto', color: 'bg-orange-100 text-orange-800', icon: 'alert' },
  URGENT:      { label: 'URGENTE',       color: 'bg-red-100 text-red-800',      icon: 'x-circle' },
} as const
```

**Validacion**:
- Dashboard muestra tarjetas de todas las plantas con su estado actual
- Vista de planta muestra grafico con al menos 7 dias de datos
- Recharts se carga correctamente (puede requerir dynamic import para SSR)
- `npm run typecheck` pasa

---

### Fase 5: Export CSV y Funcionalidades de Calidad
**Objetivo**: Export CSV funcional, deteccion de outliers visible, dark mode y mejoras de UX.

**Subtareas**:
1. Crear `src/app/api/plants/[id]/export/route.ts` (GET endpoint que devuelve CSV de las lecturas)
2. Implementar `generateCsvContent(readings: ProductionReading[])` en un helper
3. Agregar boton "Exportar CSV" en la vista de planta
4. Crear indicador visual de outliers en ReadingList (icono de advertencia + tooltip)
5. Asegurar que el CSS ya tiene dark mode support (revisar `globals.css`)
6. Responsive: verificar que la UI funciona en mobile (min 375px)
7. Agregar loading states (skeleton) en ReadingList y SoilingChart
8. Agregar empty states cuando no hay lecturas

**Formato CSV**:
```
fecha,kwh_real,kwh_theoretical,pr_actual,pr_baseline,soiling_%,perdida_kwh,perdida_eur,perdida_acumulada_eur,recomendacion,dia_limpieza
2026-01-15,42.5,48.3,0.880,0.920,4.35,5.8,0.70,12.40,WATCH,false
```

**Validacion**:
- Descarga CSV con headers correctos y todos los campos calculados
- La tabla de lecturas muestra icono para outliers
- Layout responsive en 375px sin scroll horizontal
- `npm run build` exitoso sin warnings de SSR

---

### Fase 6: Validacion Final End-to-End
**Objetivo**: Sistema completo funcionando en modo produccion con todos los criterios de exito cumplidos.

**Subtareas**:
1. Ejecutar `npm run typecheck` -> 0 errores
2. Ejecutar `npm run build` -> build exitoso
3. Verificar RLS con `get_advisors` en Supabase MCP
4. Test manual: crear planta -> registrar 5 lecturas -> verificar calculos -> exportar CSV
5. Test manual: registrar dia de limpieza -> verificar reset de baseline
6. Test manual: soiling > 15% -> verificar badge URGENT con break-even correcto
7. Playwright screenshot del dashboard multi-planta
8. Playwright screenshot de la vista de planta con graficos
9. Documentar aprendizajes en seccion de Self-Annealing de este PRP

**Validacion Final (Checklist)**:
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run build` exitoso
- [ ] Tablas `plants`, `production_readings`, `irradiance_cache` existen con RLS
- [ ] CRUD de plantas funciona con validacion Zod
- [ ] Lectura con calculos NOCT persiste correctamente en DB
- [ ] Cache de irradiancia funciona (evita llamadas duplicadas)
- [ ] Baseline de PR se resetea con is_cleaning_day=TRUE
- [ ] Los 4 niveles de recomendacion se muestran correctamente
- [ ] Graficos historicos renderizan datos reales
- [ ] Export CSV descarga archivo valido
- [ ] Dashboard multi-planta muestra todas las plantas del usuario

---

## Estructura de Archivos Target (Completa)

```
src/
├── actions/
│   ├── auth.ts                              (EXISTENTE - no modificar)
│   ├── plants.ts                            (NUEVO - Fase 2)
│   └── readings.ts                          (NUEVO - Fase 3)
│
├── app/
│   ├── (main)/
│   │   ├── dashboard/page.tsx               (MODIFICAR - agregar link a /plants)
│   │   └── plants/
│   │       ├── page.tsx                     (NUEVO - lista de plantas)
│   │       ├── new/page.tsx                 (NUEVO - formulario nueva planta)
│   │       └── [id]/
│   │           ├── page.tsx                 (NUEVO - detalle de planta)
│   │           └── readings/
│   │               └── new/page.tsx         (NUEVO - formulario nueva lectura)
│   └── api/
│       └── plants/
│           └── [id]/
│               └── export/
│                   └── route.ts             (NUEVO - export CSV)
│
├── components/
│   └── layout/
│       └── sidebar.tsx                      (MODIFICAR - agregar nav item Plants)
│
└── features/
    ├── plants/
    │   ├── components/
    │   │   ├── PlantCard.tsx
    │   │   ├── PlantForm.tsx
    │   │   ├── PlantList.tsx
    │   │   └── index.ts
    │   ├── hooks/
    │   │   ├── usePlants.ts
    │   │   └── usePlant.ts
    │   ├── services/
    │   │   └── plantService.ts
    │   ├── store/
    │   │   └── plantStore.ts
    │   └── types/
    │       ├── index.ts
    │       └── schemas.ts
    │
    ├── readings/
    │   ├── components/
    │   │   ├── ReadingForm.tsx
    │   │   ├── ReadingList.tsx
    │   │   └── index.ts
    │   ├── hooks/
    │   │   └── useReadings.ts
    │   ├── services/
    │   │   └── readingService.ts
    │   └── types/
    │       ├── index.ts
    │       └── schemas.ts
    │
    ├── soiling/
    │   ├── components/
    │   │   ├── SoilingDashboard.tsx
    │   │   ├── PlantDetailView.tsx
    │   │   ├── SoilingChart.tsx
    │   │   ├── LossesChart.tsx
    │   │   ├── CleaningBadge.tsx
    │   │   ├── CleaningRecommendation.tsx
    │   │   └── index.ts
    │   ├── hooks/
    │   │   └── useSoilingData.ts
    │   └── services/
    │       └── soilingCalculator.ts
    │
    └── irradiance/
        ├── services/
        │   ├── openMeteoClient.ts
        │   └── irradianceService.ts
        └── types/
            └── index.ts
```

---

## Mejoras vs V1

| Aspecto | V1 (Python/FastAPI) | V2 (Next.js + Supabase) |
|---------|---------------------|-------------------------|
| Stack | 2 proyectos (Python + Next.js) | 1 proyecto full-stack |
| Despliegue | 2 servicios independientes | Vercel (1 deploy) |
| Auth | Supabase Auth sin integracion real | Supabase Auth + RLS por user_id |
| Seguridad DB | Sin RLS real | RLS en todas las tablas de usuario |
| Validacion | Pydantic (Python only) | Zod (TypeScript, client+server) |
| Cache irradiancia | Sin cache | `irradiance_cache` table con TTL |
| Dashboard | Single-plant | Multi-planta con grid |
| Graficos | Sin graficos | Recharts (PR, soiling, perdidas) |
| Export | Sin export | CSV descargable |
| Outliers | Sin deteccion | Deteccion + no contamina baseline |
| Tipos | Tipos fragmentados | Tipos TypeScript unificados con DB |
| Testing | Sin tests frontend | Playwright E2E |

---

## Criterios de Aceptacion

### Funcionales

1. **CRUD Plantas**: Crear, editar, eliminar plantas con validacion completa de todos los campos tecnicos
2. **Registro Lectura**: Ingresar kWh reales + fecha -> sistema calcula y persiste kWh teoricos, PR, soiling %, perdidas, recomendacion
3. **Irradiancia Automatica**: Open-Meteo se consulta automaticamente para cada lectura; datos identicos del mismo dia se sirven desde cache
4. **Baseline de PR**: Marcando `is_cleaning_day` el baseline se resetea; el calculo de soiling usa el baseline del ciclo actual
5. **Recomendacion Economica**: Badge de 4 niveles con dias para break-even basados en perdida diaria vs costo de limpieza
6. **Multi-Planta**: Dashboard muestra todas las plantas con su estado de soiling actual
7. **Graficos**: Vista de planta muestra historico de 30/90/180 dias de PR, soiling %, y perdidas
8. **Export CSV**: Todas las lecturas de una planta descargables con todos los campos calculados

### No Funcionales

1. **Seguridad**: Cada Server Action verifica `auth.uid()` antes de cualquier operacion de DB
2. **RLS**: Todas las tablas de usuario tienen RLS habilitado; verificable via `get_advisors`
3. **Tipos**: `npm run typecheck` pasa sin errores ni `any` explicito
4. **Build**: `npm run build` exitoso sin errores de SSR (recharts con dynamic import si necesario)
5. **Rendimiento**: Lista de lecturas paginada (max 50 por pagina); graficos con max 180 puntos
6. **Validacion**: Zod en todos los inputs de usuario; errores de campo mostrados en el formulario

---

## Gotchas

- [ ] **Recharts y SSR**: Recharts usa `window` y necesita `dynamic import` con `ssr: false`. Todos los componentes de grafico deben usar `const SoilingChart = dynamic(() => import('...'), { ssr: false })`
- [ ] **Columnas generadas en Supabase**: `total_power_kw` y `total_area_m2` son GENERATED ALWAYS, no se pueden insertar/actualizar directamente. Omitirlas en los INSERT
- [ ] **Open-Meteo fecha actual**: El endpoint de archivo (`archive-api`) solo tiene datos hasta ayer. Para el dia de hoy usar el endpoint de forecast
- [ ] **Conversion de unidades**: Open-Meteo devuelve `shortwave_radiation_sum` en MJ/m2. Dividir por 3.6 para obtener kWh/m2
- [ ] **Cache key de irradiancia**: Usar lat/lon redondeados a 2 decimales para evitar fragmentacion del cache. `cache_key = \`${lat.toFixed(2)}_${lon.toFixed(2)}_${date}\``
- [ ] **Supabase DOUBLE PRECISION vs JavaScript number**: No hay perdida de precision para los valores del dominio (kWh, %, euros)
- [ ] **Columna `updated_at` en plants**: El trigger `plants_updated_at` la actualiza automaticamente. No incluir en los UPDATE de la aplicacion
- [ ] **RLS y service role**: La tabla `irradiance_cache` no tiene RLS. Para escribir en ella desde Server Actions, verificar si `createClient()` (anon key) tiene permisos o si es necesario `createServiceClient()`

## Anti-Patrones

- NO usar `any` en TypeScript: usar `unknown` y hacer type narrowing
- NO hardcodear umbrales de soiling (3%, 7%, 15%): definirlos como constantes en `soilingCalculator.ts`
- NO llamar a Open-Meteo desde componentes cliente: siempre desde Server Actions o API Routes
- NO omitir la verificacion de ownership de planta en readings (verificar que `plant.user_id === user.id` antes de insertar una lectura)
- NO crear graficos sin manejo de estado vacio (cuando `readings.length === 0`)
- NO olvidar `revalidatePath` despues de cada mutacion para que los Server Components se actualicen

---

## Aprendizajes (Self-Annealing)

> Esta seccion se completara durante la implementacion.

### Formato

```
### [YYYY-MM-DD]: [Titulo]
- **Error**: [Que fallo]
- **Fix**: [Como se arreglo]
- **Aplicar en**: [Donde mas aplica]
```

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
