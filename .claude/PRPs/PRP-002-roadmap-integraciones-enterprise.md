# PRP-002: Roadmap — Integraciones + Enterprise

> **Estado:** Pendiente (documentado como roadmap futuro)
> **Fecha:** 2026-02-19
> **Prerequisito:** APIs de inversores disponibles para testing
> **Dependencias completadas:** Fases SaaS 0-6 (MVP funcional)

---

## 1. CSV Import + Public API

### Problema
Los usuarios tienen datos historicos de produccion en sus plataformas de monitoreo (SolarEdge, Huawei FusionSolar, Enphase, Fronius). Actualmente deben introducir lecturas una a una manualmente.

### Solucion propuesta

#### 1a. CSV Import (Completado)

**Estado:** Implementado (revisado 2026-02-21)

**Endpoint:** `POST /api/plants/[id]/import`

**Flujo:**
1. Usuario sube CSV con columnas: `fecha, kwh_real, tipo_lectura, dia_limpieza`
2. Server valida formato + parsea filas con Zod
3. Por cada fila, ejecuta la logica de `createReading()` (irradiancia, NOCT, soiling)
4. Retorna resumen: N importadas, N errores, N duplicadas

**Formatos soportados:**
- CSV generico (fecha + kwh)
- SolarEdge export format
- Huawei FusionSolar export format
- Template descargable desde la app

**Tabla nueva:** Ninguna (usa `production_readings` existente)

**Consideraciones:**
- Procesamiento asincrono para >30 filas (job queue o chunked)
- Rate limit: max 1 import por planta cada 5 minutos
- Validar que las fechas no excedan el rango de Open-Meteo (2 dias atras)

#### 1b. Public API con API Keys (prioridad media)

**Tablas nuevas:**
```sql
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,  -- SHA-256 del key
  prefix text NOT NULL,            -- primeros 8 chars para identificacion
  scopes text[] NOT NULL DEFAULT '{"readings:write","plants:read"}',
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Endpoints REST:**
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/v1/plants` | Listar plantas del usuario |
| GET | `/api/v1/plants/:id` | Detalle de planta |
| POST | `/api/v1/plants/:id/readings` | Crear lectura |
| GET | `/api/v1/plants/:id/readings` | Listar lecturas |
| POST | `/api/v1/plants/:id/import` | Import CSV |

**Autenticacion:** Header `Authorization: Bearer sk_live_xxxx`

**Rate limits por plan:**
| Plan | Requests/hora | Readings/dia |
|------|---------------|--------------|
| free | 60 | 10 |
| founding | 300 | 100 |
| paid | 1000 | 500 |

---

## 2. Notificaciones + Webhooks

### Problema
Los usuarios no reciben alertas cuando el soiling supera umbrales criticos. Deben revisar el dashboard manualmente.

### Solucion propuesta

#### 2a. Email Alerts (prioridad alta)

**Tabla nueva:**
```sql
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',  -- 'email', 'webhook'
  soiling_threshold_warning numeric DEFAULT 5.0,
  soiling_threshold_urgent numeric DEFAULT 10.0,
  enabled boolean DEFAULT true,
  webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel)
);
```

**Trigger:** Despues de cada `createReading()`, si `soiling_percent` supera el umbral del usuario:
- `>= warning_threshold`: Email "Soiling alcanza X% en [planta]"
- `>= urgent_threshold`: Email urgente "Limpieza recomendada: soiling X%"

**Cooldown:** Max 1 email por planta cada 24h (evitar spam en readings diarias)

**Integracion:** Reutilizar `src/lib/email/resend.ts` para envio

#### 2b. Webhooks (prioridad baja)

**Para integraciones externas (Zapier, Make, n8n):**
- El usuario configura una URL de webhook en Settings
- En cada lectura que supere umbral, se envia POST con payload JSON:
```json
{
  "event": "soiling_alert",
  "plant_id": "...",
  "plant_name": "...",
  "soiling_percent": 8.5,
  "recommendation": "RECOMMENDED",
  "reading_date": "2026-02-19",
  "cumulative_loss_eur": 45.2
}
```

---

## 3. Multi-Org + Billing

### Problema
Actualmente cada usuario es independiente. No hay soporte para equipos (empresa de O&M con multiples plantas de distintos clientes) ni para cobro automatizado.

### Solucion propuesta

#### 3a. Organizaciones (prioridad media)

**Tablas nuevas:**
```sql
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  max_members integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','admin','editor','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
```

**Cambios en `plants`:**
- Agregar columna `org_id uuid REFERENCES organizations(id)`
- RLS: si planta tiene org_id, verificar membership del usuario
- Si no tiene org_id, comportamiento actual (user_id owner)

**Roles:**
| Rol | Ver plantas | Crear lecturas | Crear plantas | Gestionar miembros |
|-----|-------------|----------------|---------------|-------------------|
| viewer | Si | No | No | No |
| editor | Si | Si | No | No |
| admin | Si | Si | Si | Si |
| owner | Si | Si | Si | Si + billing |

#### 3b. Billing con Stripe (prioridad baja)

**Integracion propuesta:**
- Stripe Checkout para upgrades (founding → paid)
- Webhook `/api/webhooks/stripe` para procesar pagos
- Actualizar `profiles.access_level` y `profiles.max_plants` on success
- Portal de cliente Stripe para gestionar suscripcion

**Planes propuestos:**
| Plan | Precio/mes | Plantas | Lecturas/dia | API | Miembros |
|------|-----------|---------|--------------|-----|----------|
| Free | 0 | 1 | 1 | No | 1 |
| Pro | 19 | 5 | Ilimitado | Si | 3 |
| Business | 49 | 20 | Ilimitado | Si | 10 |
| Enterprise | Custom | Ilimitado | Ilimitado | Si | Ilimitado |

**Dependencia externa:** Stripe account + Stripe SDK (`stripe` npm package)

---

## Orden de implementacion sugerido

```
Fase 7a: CSV Import (COMPLETADO)
  ↓
Fase 7b: Email Alerts + Notification Preferences (1-2 dias)
  ↓
Fase 7c: Public API + API Keys (2-3 dias)
  ↓
Fase 7d: Webhooks (1 dia)
  ↓
Fase 7e: Organizaciones (2-3 dias)
  ↓
Fase 7f: Stripe Billing (2-3 dias)
```

---

## Dependencias externas necesarias

| Dependencia | Para | Status |
|-------------|------|--------|
| APIs inversores (SolarEdge, Huawei, etc.) | CSV format templates | Pendiente |
| Stripe account | Billing | Pendiente |
| Dominio verificado en Resend | Email alerts | Ya configurado |
| Open-Meteo API | Ya integrado | Activo |

---

## Notas tecnicas

- **CSV Import** reutiliza toda la logica de `createReading()` — no duplicar calculo
- **API Keys** se almacenan hasheados (SHA-256), nunca en texto plano
- **Webhooks** son fire-and-forget con retry (max 3 intentos, backoff exponencial)
- **Organizaciones** requiere refactor de RLS en `plants` y `production_readings`
- **Stripe webhooks** deben verificar firma (`stripe.webhooks.constructEvent`)
