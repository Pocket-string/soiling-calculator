# Reporte de Factibilidad: Integracion con APIs de Inversores Solares

**Fecha:** 2026-02-23
**Contexto:** Soiling Calculator SaaS — Fase 7d+ del roadmap
**Objetivo:** Evaluar la viabilidad tecnica y comercial de integrar APIs de los principales fabricantes de inversores para automatizar la ingesta de datos de produccion.

---

## 1. Resumen Ejecutivo

La integracion con APIs de inversores permitiria a los usuarios de Soiling Calculator **automatizar el envio de lecturas de produccion**, eliminando la entrada manual. Se evaluaron 6 fabricantes principales. La factibilidad varia significativamente entre marcas.

### Veredicto rapido

| Marca | Factibilidad | Prioridad | Razon |
|-------|-------------|-----------|-------|
| **SolarEdge** | Alta | 1 (MVP) | API publica, documentada, gratuita, REST simple |
| **Fronius** | Alta | 2 | REST API bien documentada, dos APIs (local + cloud) |
| **Huawei** | Media | 3 | API Northbound disponible, pero rate limits estrictos y acceso via instalador |
| **SMA** | Media | 4 | Developer portal completo con OAuth2, pero pricing por sistema |
| **GoodWe** | Baja-Media | 5 | API existe pero requiere cuenta organizacion, documentacion limitada |
| **Growatt** | Baja | 6 | Sin API oficial publica; integraciones via reverse engineering |

---

## 2. Analisis por Fabricante

### 2.1 SolarEdge — PRIORIDAD 1 (Recomendado para MVP)

**Market share:** Lider en segmento residencial/comercial en Americas y Europa.

| Aspecto | Detalle |
|---------|---------|
| **API** | [SolarEdge Monitoring Server API](https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf) |
| **Tipo** | REST API publica (HTTPS) |
| **Autenticacion** | API Key (por cuenta o por sitio) via parametro URL `api_key` |
| **Formatos** | JSON, XML, CSV |
| **Rate limits** | 300 req/dia por API key + 300 req/dia por site ID. Max 3 concurrentes por IP |
| **Granularidad** | 15 min, hora, dia, semana, mes, ano |
| **Costo** | Gratuito |
| **Documentacion** | [PDF completo](https://solaredge.com/sites/default/files/se_monitoring_api.pdf) — excelente calidad |

**Endpoints relevantes para Soiling Calculator:**
- `GET /site/{siteId}/energy` — produccion por periodo (kWh)
- `GET /site/{siteId}/power` — potencia en tiempo real (W)
- `GET /site/{siteId}/energyDetails` — desglose consumo/exportacion/importacion
- `GET /site/{siteId}/overview` — resumen del sitio
- `GET /site/{siteId}/inventory` — equipos instalados

**Restricciones temporales:**
- `timeUnit=DAY` → max 1 ano por request
- `timeUnit=QUARTER_OF_AN_HOUR` → max 1 mes por request

**Complejidad de integracion:** BAJA
- REST simple con API key en URL
- No requiere OAuth
- Librerias Python/JS disponibles en GitHub
- [Guia para obtener API key](https://medium.com/energy311/how-to-get-your-solaredge-api-details-664b45abb55a)

**Veredicto:** Mejor opcion para primera integracion. API madura, gratuita, bien documentada, con la granularidad diaria que necesitamos para calcular soiling.

---

### 2.2 Fronius — PRIORIDAD 2

**Market share:** Fuerte en Europa, presencia creciente en LATAM. Popular en instalaciones residenciales/comerciales.

| Aspecto | Detalle |
|---------|---------|
| **APIs** | [Solar.web Query API](https://www.fronius.com/en/solarweb-query-api) (cloud) + [Fronius Solar API JSON](https://www.fronius.com/en/solar-energy/installers-partners/products/all-products/system-monitoring/open-interfaces/fronius-solar-api-json-) (local) |
| **Tipo** | REST API (cloud) + HTTP JSON (local, en red LAN) |
| **Autenticacion** | JWT (cloud) / Sin auth (local) |
| **Rate limits** | No publicados |
| **Granularidad** | 5 min (local), variable (cloud: 5min a anual) |
| **Costo** | Pay-per-use (cloud API). API local gratuita |
| **Documentacion** | [Documentacion de interfaz](https://www.fronius.com/~/downloads/Solar%20Energy/User%20Information/SE_UI_API_InterfaceDocumentation_EN.pdf) |

**Dos opciones de integracion:**

1. **Solar.web Query API (cloud):** Requiere contrato con Fronius, modelo pay-per-use por data points consultados. Acceso requiere orden firmada activada por empleado de Fronius.

2. **Fronius Solar API (local):** Gratuita, accesible via HTTP en la red local del inversor. Read-only. Requiere que el usuario exponga el endpoint (o use un proxy).

**Complejidad de integracion:** MEDIA
- Cloud API requiere proceso comercial + JWT
- Local API requiere acceso a red del inversor (complejo para SaaS cloud)
- [Librerias comunitarias](https://github.com/topics/fronius-solar-api) disponibles

**Veredicto:** Cloud API viable pero requiere acuerdo comercial. Local API no es practica para un SaaS. Segunda prioridad por la calidad de la documentacion y la popularidad de la marca.

---

### 2.3 Huawei FusionSolar — PRIORIDAD 3

**Market share:** #1 global con ~21% market share en 2024. Lider en utility-scale, creciendo en residencial.

| Aspecto | Detalle |
|---------|---------|
| **API** | [FusionSolar Northbound API](https://support.huawei.com/enterprise/en/doc/EDOC1100440661/356f0ec1/fusionsolar-northbound-api-integration) |
| **Tipo** | REST API (HTTPS) |
| **Autenticacion** | Login con credenciales → Token de sesion. Una sola sesion activa a la vez |
| **Endpoint base** | `https://intl.fusionsolar.huawei.com/thirdData/` (varia por region) |
| **Rate limits** | Estrictos. Limita logins, no hits. Solo 1 sesion activa simultanea |
| **Granularidad** | 5 min (real-time KPIs), dia, mes |
| **Costo** | Gratuito |
| **Documentacion** | [Portal Huawei Enterprise](https://support.huawei.com/enterprise/en/doc/EDOC1100376962) |

**Endpoints relevantes:**
- `getStationList` / `/thirdData/stations` — listar plantas
- `getStationRealKpi` — datos en tiempo real de planta
- `getDevList` — listar dispositivos
- `getDevRealKpi` — datos en tiempo real por dispositivo (String inverter, Grid meter, etc.)
- `getKpiStationDay` / `getKpiStationMonth` — KPIs historicos

**Limitaciones criticas:**
- Requiere cuenta Northbound API creada por el **instalador** (no el propietario)
- Solo 1 sesion activa → no se puede compartir entre usuarios
- Rate limits basados en logins, no requests
- Diferentes URLs por region (eu5, intl, etc.)

**Complejidad de integracion:** MEDIA-ALTA
- Requiere session management (login/reuse/refresh)
- Una sesion por cuenta (complejo para multi-tenant)
- [Libreria Python](https://pypi.org/project/fusion-solar-py/) disponible
- Best practice: cachear `stationCode` y `devId` al inicio, luego solo consultar KPIs

**Veredicto:** API funcional pero con restricciones de sesion que complican la arquitectura multi-tenant. El market share de Huawei lo hace imprescindible a mediano plazo, pero no ideal para MVP.

---

### 2.4 SMA — PRIORIDAD 4

**Market share:** Top 3 global. Fuerte en Europa y proyectos comerciales/utility.

| Aspecto | Detalle |
|---------|---------|
| **API** | [SMA Developer Portal](https://developer.sma.de/sma-apis) — Monitoring API |
| **Tipo** | REST API con OAuth2 |
| **Autenticacion** | OAuth2 Authorization Code Grant (GDPR compliant) |
| **Rate limits** | Desde 01.07.2025: limite por credencial en intervalos de 5 minutos |
| **Granularidad** | 5 min (Data Manager upload interval) |
| **Costo** | **De pago** — pricing por sistema de 50kWac. Facturacion trimestral/anual (min 1000 EUR) |
| **Documentacion** | [Swagger/OpenAPI](https://developer.sma.de/sma-apis), [Sandbox](https://developer.sma.de/sma-sandbox-apis) |

**Caracteristicas destacadas:**
- OAuth2 completo con user consent (el propietario autoriza el acceso)
- Sandbox para testing sin datos de produccion
- Swagger/OpenAPI bien documentado
- Consentimiento revocable por el propietario del sistema

**Limitaciones:**
- **Pricing significativo** — factura minima de 1000 EUR
- Requiere consentimiento explicito del propietario (flujo OAuth complejo)
- Rate limits nuevos desde julio 2025
- Contacto necesario para credenciales sandbox: api-developer-support@sma.de

**Complejidad de integracion:** MEDIA-ALTA
- OAuth2 requiere flujo de autorizacion completo (redirect, tokens, refresh)
- GDPR compliance agrega complejidad
- Buena documentacion compensa parcialmente

**Veredicto:** API profesional y bien disenada, pero el modelo de pricing la hace inviable para un SaaS temprano. Reservar para fase enterprise.

---

### 2.5 GoodWe (SEMS) — PRIORIDAD 5

**Market share:** Crecimiento fuerte en LATAM (especialmente Chile y Brasil). Precio competitivo.

| Aspecto | Detalle |
|---------|---------|
| **API** | [GoodWe OpenAPI](https://community.goodwe.com/solution/PV%20System%20Solution/API-introduction) (via SEMS Portal) |
| **Tipo** | REST (HTTPS) + KAFKA (real-time) |
| **Autenticacion** | Cuenta de organizacion SEMS requerida |
| **Rate limits** | No publicados |
| **Granularidad** | Real-time (via KAFKA), historico variable |
| **Costo** | No publicado (requiere contacto con equipo SEMS) |
| **Documentacion** | [PDF tecnico](https://community.goodwe.com/static/images/2024-08-20597794.pdf) — limitada |

**Tipos de API disponibles:**
1. **OpenAPI** — HTTPS, requiere cuenta organizacion. Interfaces: planta, dispositivo, control remoto, datalogger
2. **Real-time Data Monitoring API** — datos en tiempo real desde multiples inversores
3. **Batch Remote Control** — control remoto (no relevante para nuestro caso)

**Limitaciones criticas:**
- API solo accesible para cuentas de **organizacion** SEMS (no usuarios finales)
- Documentacion publica muy limitada
- Requiere contacto directo con equipo GoodWe
- [Integraciones comunitarias](https://github.com/TimSoethout/goodwe-sems-home-assistant) usan APIs no oficiales

**Complejidad de integracion:** ALTA
- Proceso de acceso opaco
- Sin documentacion publica completa
- Alternativa: usar [pygoodwe](https://pypi.org/project/pygoodwe/) (no oficial)

**Veredicto:** API existe pero el acceso es restrictivo y la documentacion insuficiente. Relevante por market share en Chile pero no viable sin contacto directo con GoodWe.

---

### 2.6 Growatt — PRIORIDAD 6

**Market share:** #4 global. Muy popular en residencial por precio bajo. Presencia en LATAM.

| Aspecto | Detalle |
|---------|---------|
| **API** | No hay API publica oficial |
| **Tipo** | REST (no oficial, reverse-engineered) |
| **Autenticacion** | API token via ShinePhone app o web |
| **Rate limits** | Restrictivos (API no oficial) |
| **Granularidad** | Variable |
| **Costo** | N/A (no oficial) |
| **Documentacion** | [PDF no oficial](https://growatt.pl/wp-content/uploads/2020/01/Growatt-Server-API-Guide.pdf) |

**Estado real:**
- Growatt **no ha publicado una API oficial** para terceros
- Las integraciones existentes ([growattServer PyPI](https://pypi.org/project/growattServer/), [npm growatt](https://www.npmjs.com/package/growatt)) son reverse-engineering del portal web
- V1 API (mas reciente) soporta dispositivos MIN y SPH con mejor seguridad
- API token disponible en ShinePhone → Settings → Account Management → API Key

**Limitaciones criticas:**
- API no oficial = puede romperse sin aviso
- Sin SLA ni soporte
- Rate limits estrictos no documentados
- [Grott](https://github.com/johanmeijer/grott) como alternativa local (intercepta datos del datalogger)

**Complejidad de integracion:** ALTA
- API no oficial = riesgo de rotura
- Sin documentacion estable
- Requiere mantenimiento constante si Growatt cambia endpoints

**Veredicto:** No recomendado para producto. Solo viable como integracion experimental/community-driven.

---

## 3. Mercado Solar en Chile y LATAM

### Capacidad instalada en Chile
| Ano | Acumulado (GW) | Adicion anual (GW) |
|-----|---------------|---------------------|
| 2022 | ~7.3 | ~2.1 |
| 2023 | ~10.2 | ~2.9 |
| 2024 (est.) | ~13-14 | ~3-4 |

- Meta Chile: 40 GW renovables para 2030 (60%+ solar)
- CAGR 2020-2024: ~35-40%
- Segmento PMGD (1-9 MW) es **exclusivo de Chile** y sweet spot para monitoreo de soiling

### Contexto de mercado
- Mercado de inversores en LATAM: **USD 525.61M** (2024), CAGR 5.4%
- Mercado de inversores centrales en Chile: **USD 48.64M** (2024), CAGR 13%
- Chile es el mayor mercado solar per capita de LATAM y segundo en terminos absolutos (tras Brasil)

### Market share global (2024)
1. **Huawei** — ~30-35% (lider global)
2. **Sungrow** — ~15-20%
3. **SMA** — ~5-8%
4. **GoodWe** — ~5-7%
5. **Growatt** — ~5-7% (#4 en shipments)
6. **SolarEdge** — ~4-6%
7. **Ginlong/Solis** — ~4-5%
8. **Fronius** — ~3-5%

### Popularidad en Chile por segmento

**Utility-scale (>9 MW):**
- Huawei (~40-50%), Sungrow (~20-25%), SMA (~10-15%)

**Comercial (50 kW - 9 MW):**
- Huawei (~30-35%), Fronius (~15-20%), SMA (~10-15%), GoodWe (~10-12%)

**Residencial (<50 kW):**
- Fronius (~20-25% — "favorito de instaladores"), Huawei (~15-20%), GoodWe (~15-18%), Growatt (~12-15%), SolarEdge (~5-8%)

### Notas especificas Chile
- **Fronius** tiene presencia directa via Fronius Chile. Reputacion de calidad y servicio post-venta
- **Huawei** domina utility-scale, especialmente proyectos PMGD en Atacama
- **GoodWe y Growatt** son las marcas de mayor crecimiento en residencial/comercial
- **SolarEdge** tiene penetracion limitada — la arquitectura con optimizadores agrega costo
- **Certificacion SEC** obligatoria para conexion a red (barrera de entrada para marcas menores)
- Clientes enterprise potenciales: mineras (Codelco, BHP, Antofagasta Minerals) con grandes instalaciones solares

---

## 4. Arquitectura de Integracion Propuesta

### Patron: Polling con sync programado

```
Usuario configura integracion en Settings
           |
           v
  [Cron Job / Edge Function]
           |
           v
  Fetch produccion diaria via API del inversor
           |
           v
  Mapear a formato `production_readings`
           |
           v
  Insertar via createReading() pipeline
  (incluye calculo soiling automatico)
           |
           v
  Notificar si umbral superado (7b)
```

### Tabla propuesta: `inverter_integrations`

```sql
CREATE TABLE inverter_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  provider text NOT NULL,           -- 'solaredge', 'fronius', 'huawei', etc.
  credentials jsonb NOT NULL,       -- encrypted: { api_key, site_id, ... }
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'pending', -- 'ok', 'error', 'pending'
  last_error text,
  created_at timestamptz DEFAULT now()
);
```

### Flujo por marca

| Marca | Auth del usuario | Dato que necesitamos | Frecuencia |
|-------|-----------------|---------------------|------------|
| SolarEdge | Pega su API key + site ID | `GET /site/{id}/energy?timeUnit=DAY` | 1x/dia |
| Fronius | JWT cloud API | Energy flow diario | 1x/dia |
| Huawei | Login Northbound | `getKpiStationDay` | 1x/dia |
| SMA | OAuth2 flow | Monitoring API energy | 1x/dia |

---

## 5. Estrategia de Implementacion Recomendada

### Fase 1 — MVP (SolarEdge)
- **Esfuerzo:** ~2-3 dias
- **Scope:** Integracion SolarEdge via API key
- **UI:** Campo "API Key" + "Site ID" en Settings de la planta
- **Backend:** Cron job diario que fetch produccion y crea readings automaticamente
- **Valor:** Elimina entrada manual para usuarios con SolarEdge

### Fase 2 — Fronius (Cloud API)
- **Esfuerzo:** ~3-5 dias (incluye gestion JWT + proceso comercial)
- **Requisito:** Acuerdo con Fronius para acceso cloud API
- **Alternativa:** Si el usuario tiene Fronius Datalogger en red local, ofrecer instrucciones para script de push via nuestra Public API (7c)

### Fase 3 — Huawei FusionSolar
- **Esfuerzo:** ~5-7 dias (session management complejo)
- **Requisito:** Usuarios necesitan pedir cuenta Northbound a su instalador
- **Riesgo:** Restriccion de 1 sesion activa complica multi-tenant

### Fase 4 — SMA (Enterprise)
- **Esfuerzo:** ~5-7 dias (OAuth2 completo)
- **Requisito:** Acuerdo comercial + presupuesto para fees de API
- **Target:** Solo clientes enterprise con presupuesto

### Alternativa transversal: Push via Public API
Para marcas sin API accesible (Growatt, GoodWe), el usuario puede:
1. Usar nuestra **Public API** (Fase 7c ya implementada)
2. Configurar un script local (Python/Node.js) que lea de su inversor y haga POST a `/api/v1/plants/:id/readings`
3. Integrar via n8n/Zapier/Make usando nuestra API

---

## 6. Matriz de Decision

| Criterio (peso) | SolarEdge | Fronius | Huawei | SMA | GoodWe | Growatt |
|-----------------|-----------|---------|--------|-----|--------|---------|
| API calidad (25%) | 5 | 4 | 3 | 5 | 2 | 1 |
| Acceso gratuito (20%) | 5 | 2 | 5 | 1 | 3 | 5 |
| Documentacion (15%) | 5 | 4 | 3 | 4 | 2 | 1 |
| Market share Chile (20%) | 3 | 3 | 5 | 3 | 4 | 4 |
| Facilidad integracion (20%) | 5 | 3 | 2 | 3 | 2 | 1 |
| **Score ponderado** | **4.55** | **3.25** | **3.55** | **3.15** | **2.65** | **2.30** |

---

## 7. Conclusiones y Recomendaciones

1. **Comenzar con SolarEdge** — API gratuita, REST simple, bien documentada. Menor riesgo tecnico.

2. **Nuestra Public API (7c) ya cubre el caso generico** — Usuarios con cualquier inversor pueden usar scripts + nuestra API REST para automatizar. Esto reduce la urgencia de integrar cada marca.

3. **Huawei es imprescindible a mediano plazo** por su market share dominante, pero sus restricciones de sesion requieren arquitectura especial.

4. **SMA y Fronius requieren acuerdos comerciales** — evaluar cuando el volumen de usuarios lo justifique.

5. **GoodWe y Growatt no son viables para integracion directa** actualmente. Mejor estrategia: documentar como usar nuestra Public API con scripts de ejemplo para estas marcas.

6. **Estrategia hibrida recomendada:**
   - Integraciones nativas para SolarEdge + Huawei (80% del mercado)
   - Public API + templates de scripts para el resto
   - OAuth2 con SMA cuando haya volumen enterprise

---

## Fuentes

- [SolarEdge Monitoring API Documentation (PDF)](https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf)
- [How to Get SolarEdge API Details](https://medium.com/energy311/how-to-get-your-solaredge-api-details-664b45abb55a)
- [Fronius Solar.web Query API](https://www.fronius.com/en/solarweb-query-api)
- [Fronius Solar API JSON (Local)](https://www.fronius.com/en/solar-energy/installers-partners/products/all-products/system-monitoring/open-interfaces/fronius-solar-api-json-)
- [Huawei FusionSolar Northbound API](https://support.huawei.com/enterprise/en/doc/EDOC1100440661/356f0ec1/fusionsolar-northbound-api-integration)
- [Huawei Northbound API Account Setup](https://support.huawei.com/enterprise/en/doc/EDOC1100376962)
- [SMA Developer Portal](https://developer.sma.de/sma-apis)
- [SMA API Pricing Model](https://developer.sma.de/api-plans)
- [GoodWe API Technical Document](https://community.goodwe.com/static/images/2024-08-20597794.pdf)
- [GoodWe API Introduction](https://community.goodwe.com/solution/PV%20System%20Solution/API-introduction)
- [Growatt Server API Guide (PDF)](https://growatt.pl/wp-content/uploads/2020/01/Growatt-Server-API-Guide.pdf)
- [growattServer Python Library](https://pypi.org/project/growattServer/)
- [Latin America Solar Inverter Market 2024-2030](https://mobilityforesights.com/product/latin-america-solar-inverter-market)
- [Huawei leads global inverter market 2024](https://www.pv-magazine.com/2025/07/11/huawei-leads-global-inverter-market-as-shipments-hit-589-gw-in-2024/)
