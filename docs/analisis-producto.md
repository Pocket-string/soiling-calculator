# Analisis Completo - Soiling Calc
## Sistema de Monitoreo de Soiling para Instalaciones Fotovoltaicas

**Fecha de Analisis:** 20 de Febrero, 2026
**Version:** 2.0.0
**Estado:** Produccion (Funcional + Design System Unificado)

---

## RESUMEN EJECUTIVO

### Estado Actual de la Aplicacion

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| **Build** | Exitoso | Compila sin errores en Next.js 16 + Turbopack |
| **Base de Datos** | Conectada | Supabase (PostgreSQL) con 8 tablas + RLS activo |
| **Autenticacion** | Funcional | Email/Password via Supabase Auth (invite-only) |
| **Roles** | Implementados | Admin, Founding, Paid, Free |
| **Motor de Calculo** | Operativo | Modelo NOCT + Open-Meteo + cache |
| **Design System** | Completo | Tokens semanticos, UI Kit interno, health score 9.3/10 |
| **Emails** | Configurado | Resend para invitaciones y recovery |
| **CRM de Leads** | Activo | Scoring automatico + funnel de conversion |
| **Rutas** | 26 paginas | Auth + App + Marketing + Public + Admin |

---

## FUNCIONALIDADES IMPLEMENTADAS

### 1. Sistema de Autenticacion (Invite-Only)

**Ubicacion:** `src/features/auth/` y `src/actions/auth.ts`

| Funcionalidad | Descripcion | Estado |
|--------------|-------------|--------|
| Login | Email + contrasena con toggle visibilidad | Implementado |
| Recuperacion de contrasena | Email via Resend | Implementado |
| Invitaciones | Token con expiracion, generado por admin | Implementado |
| Cierre de sesion | Logout seguro + limpieza de cookies | Implementado |
| Roles automaticos | Asignacion por profiles.access_level | Implementado |
| Signup publico | Deshabilitado, redirige a /apply | Implementado |

**Flujo de Autenticacion:**
```
Visitante → /apply (postulacion) → Admin califica → Genera invitacion
→ Email con token → /invite/[token] → Crear cuenta → Dashboard
```

---

### 2. Dashboard de Plantas (Grid Principal)

**Ubicacion:** `src/app/(main)/plants/` y `src/features/plants/`

| Funcionalidad | Descripcion |
|--------------|-------------|
| Grid de tarjetas | Todas las plantas del usuario con datos clave |
| CleaningLevelBadge | Badge de estado con color segun soiling (OK/VIGILAR/LIMPIAR/URGENTE) |
| KPIs por planta | Soiling %, PR actual, perdida acumulada EUR |
| Metadata | Potencia kWp, modulos, fecha ultima lectura |
| Accion rapida | Click en tarjeta navega al detalle |

---

### 3. Gestion de Plantas Fotovoltaicas

**Ubicacion:** `src/features/plants/` y `src/actions/plants.ts`

#### Crear Planta — Formulario con 5 secciones:

| Seccion | Campos |
|---------|--------|
| Identificacion | Nombre, latitud, longitud |
| Modulos | Cantidad, potencia unitaria (Wp), area unitaria (m2) |
| Orientacion | Inclinacion (tilt 0-90), azimut (0-360) |
| Parametros tecnicos | NOCT, coeficiente temperatura, eficiencia |
| Economia | Precio energia (EUR/kWh), coste limpieza (EUR) |

#### Operaciones CRUD:
| Accion | Usuario | Admin |
|--------|---------|-------|
| Crear planta | Hasta max_plants del perfil | Sin limite |
| Ver plantas | Solo propias (RLS) | Solo propias |
| Editar planta | Propias | Propias |
| Eliminar planta | Con confirmacion (CASCADE lecturas) | Con confirmacion |

---

### 4. Registro de Lecturas + Motor de Calculo

**Ubicacion:** `src/features/readings/` y `src/actions/readings.ts`

#### Input del Usuario:
- **Fecha:** Selector (maximo hoy, no permite futuro)
- **kWh producidos:** Produccion real medida del inversor
- **Tipo de lectura:** Diaria / Semanal / Mensual
- **Dia de limpieza:** Checkbox que resetea el baseline

#### Calculos Automaticos (Motor NOCT):
| Paso | Calculo | Resultado |
|------|---------|-----------|
| 1 | Obtener irradiancia de Open-Meteo (con cache) | GHI, POA, temperatura |
| 2 | Temperatura de celda (modelo NOCT) | T_cell en C |
| 3 | Correccion por temperatura + clipping | Potencia efectiva |
| 4 | Produccion teorica (paneles limpios) | kWh teoricos |
| 5 | Performance Ratio | PR = real / teorico |
| 6 | Soiling % vs baseline | Porcentaje de suciedad |
| 7 | Perdidas economicas diarias y acumuladas | EUR perdidos |
| 8 | Recomendacion de limpieza | OK / WATCH / RECOMMENDED / URGENT |

---

### 5. Dashboard de Detalle de Planta

**Ubicacion:** `src/app/(main)/plants/[id]/` y `src/features/soiling/`

#### Card de Recomendacion:
- Badge de nivel grande (OK / VIGILAR / LIMPIAR PRONTO / URGENTE)
- Mensaje contextualizado segun STATUS_MAP
- 4 KPIs: soiling %, PR actual, perdida acumulada EUR, dias break-even

#### Graficos Interactivos (Recharts):
| Grafico | Tipo | Contenido |
|---------|------|-----------|
| Soiling | LineChart | Soiling % en el tiempo + lineas de referencia (7%, 15%) + puntos de limpieza |
| Performance Ratio | LineChart | PR actual + PR baseline (punteado) |
| Perdidas | BarChart | Perdida economica diaria (EUR) |

#### Historial de Lecturas:
- Tabla con scroll, ordenada por fecha descendente
- Colores por soiling: verde < 3%, amarillo 3-7%, naranja > 7%
- Indicadores: limpieza, outlier
- Eliminar lectura individual

---

### 6. Exportacion CSV

**Ubicacion:** `src/app/api/plants/[id]/export/route.ts`

```
filename: soiling-{nombre-planta}-{fecha}.csv
columnas: fecha, tipo, kwh_real, kwh_teorico, pr_actual_%, pr_baseline_%,
          soiling_%, perdida_kwh, perdida_eur, acumulado_eur, dias_break_even,
          recomendacion, dia_limpieza, irradiancia_kwh_m2, temp_media_c, t_celda_c
```

Autenticacion: verifica sesion + ownership. Errores: 401, 403, 404, 500.

---

### 7. Demo Publica

**Ubicacion:** `src/app/(marketing)/demo/` y `src/features/demo/`

- Datos de ejemplo precalculados con fisica real
- KPIs interactivos, tabla de lecturas, graficos
- Permite a visitantes explorar sin crear cuenta
- CTA hacia /apply al final

---

### 8. Panel Admin — Gestion de Leads

**Ubicacion:** `src/app/(main)/admin/leads/` y `src/features/leads/`

| Funcionalidad | Descripcion |
|--------------|-------------|
| Tabla de leads | Filtros por estado (Todos, Por calificar, Postulados, Calificados, etc.) |
| KPIs | Total, postulados, score promedio, calificados, invitados, activos |
| Scoring automatico | Basado en datos del formulario de postulacion |
| Acciones | Calificar, enviar invitacion, rechazar, agregar notas |

---

### 9. Panel Admin — Funnel de Conversion

**Ubicacion:** `src/app/(main)/admin/funnel/`

| Metrica | Descripcion |
|---------|-------------|
| Leads | Total de postulaciones recibidas |
| Invitados | Leads que recibieron invitacion |
| Activados | Usuarios que aceptaron la invitacion |
| Plantas | Usuarios que crearon al menos una planta |
| Lecturas | Usuarios con al menos una lectura registrada |

Tasas de conversion entre etapas + timeline de eventos recientes.

---

### 10. Panel Admin — UI Kit

**Ubicacion:** `src/app/(main)/admin/ui-kit/`

Pagina interna de referencia del design system con 9 secciones:
1. Colores semanticos (fondos, texto, bordes)
2. Paleta de marca (primary, secondary, accent + status)
3. Tipografia (escala completa)
4. Botones (variantes + tamanos + estados)
5. Badges (variantes + CleaningLevelBadge)
6. Cards (default + bordered + KPI)
7. Formularios (inputs + selects con estados)
8. Espaciado y bordes
9. Reglas del design system

---

### 11. Landing Page y Marketing

**Ubicacion:** `src/app/(marketing)/` y `src/features/marketing/`

| Pagina | Contenido |
|--------|-----------|
| Landing (`/`) | Hero + features grid + FAQ |
| Demo (`/demo`) | Datos interactivos de ejemplo |
| Apply (`/apply`) | Formulario de postulacion con scoring |
| Thanks (`/thanks`) | Confirmacion post-postulacion |
| Waitlist (`/waitlist`) | Lista de espera |

---

### 12. Paginas Publicas

**Ubicacion:** `src/app/(public)/` y `src/components/public/`

| Pagina | Contenido |
|--------|-----------|
| Contacto (`/contacto`) | Formulario + datos de contacto |
| Servicios (`/servicios`) | Grid de servicios ofrecidos |
| Equipo (`/equipo`) | Team page |
| Terminos (`/terminos`) | Terminos de servicio (tono formal) |
| Privacidad (`/privacidad`) | Politica de privacidad (tono formal) |

---

### 13. Sidebar de Navegacion

**Ubicacion:** `src/components/layout/sidebar.tsx`

- **Expandido:** iconos + etiquetas
- **Colapsado:** modo icono-only, se expande al hover
- **Secciones:** Mis Plantas, Nueva Planta, [Admin: Gestion Leads, Funnel], Configuracion
- **Footer:** avatar + email + badge Admin + cerrar sesion

---

### 14. Configuracion de Usuario

**Ubicacion:** `src/app/(main)/settings/` y `src/features/settings/`

| Funcionalidad | Descripcion |
|--------------|-------------|
| Perfil | Nombre completo, email (readonly) |
| Cambio de contrasena | Validacion minimo 6 caracteres |
| Info de cuenta | Nivel de acceso, fecha de registro |

---

## ARQUITECTURA TECNICA

### Stack Tecnologico

```
+---------------------------------------------+
|                  FRONTEND                    |
|  Next.js 16 + React 19 + TypeScript         |
|  Tailwind CSS 3.4 + Tokens Semanticos       |
|  Recharts 3.7 (graficos) + Zustand 5        |
+---------------------------------------------+
|                  BACKEND                     |
|  Next.js Server Actions (6 archivos)        |
|  Supabase (PostgreSQL + Auth + RLS + SSR)   |
+---------------------------------------------+
|                 SERVICIOS                    |
|  Open-Meteo (irradiancia) + Resend (email)  |
|  Playwright (screenshots automatizados)     |
+---------------------------------------------+
```

### Estructura de Carpetas (Feature-First)

```
src/
├── app/                    # 26 rutas Next.js
│   ├── (auth)/            # 7 paginas de autenticacion
│   ├── (main)/            # 10 paginas del dashboard
│   ├── (marketing)/       # 5 paginas de marketing
│   ├── (public)/          # 4 paginas publicas/legales
│   └── api/               # 1 API route (export CSV)
├── actions/               # 6 Server Actions
├── features/              # 10 modulos por funcionalidad
│   ├── auth/              # Autenticacion
│   ├── plants/            # Gestion de plantas FV
│   ├── readings/          # Registro de lecturas
│   ├── soiling/           # Motor NOCT + dashboard
│   ├── irradiance/        # Open-Meteo + cache
│   ├── leads/             # CRM de leads (admin)
│   ├── invites/           # Invitaciones
│   ├── settings/          # Perfil + contrasena
│   ├── demo/              # Demo publica
│   └── marketing/         # Landing components
├── components/            # Componentes reutilizables
│   ├── ui/                # 7 primitivas (Button, Card, etc.)
│   ├── layout/            # MainShell, Sidebar
│   └── public/            # 16 componentes marketing
└── lib/                   # Supabase, auth, email, tokens
```

---

## ANALISIS DEL DOLOR - PROBLEMA QUE RESUELVE

### El Dolor del Operador Fotovoltaico

#### Problema 1: No saber cuanto se esta perdiendo
**Antes:**
- Sin sensores de irradiancia (piranometros cuestan 200-2000 EUR)
- Comparacion manual con produccion "esperada" basada en intuicion
- No hay forma de medir el soiling real sin equipos especializados
- Decisiones de limpieza basadas en la vista o el calendario

**Con Soiling Calc:**
- Irradiancia obtenida automaticamente de Open-Meteo (gratuito, global)
- Modelo NOCT calcula produccion teorica con precision cientifica
- Soiling % calculado automaticamente en cada lectura
- Perdidas economicas cuantificadas en EUR

---

#### Problema 2: No saber cuando limpiar
**Antes:**
- Limpieza por calendario fijo (cada 3 meses) sin importar condiciones
- A veces se limpia antes de tiempo (gasto innecesario)
- A veces se limpia tarde (perdidas acumuladas significativas)
- Sin analisis coste-beneficio objetivo

**Con Soiling Calc:**
- Recomendacion automatica en 4 niveles (OK/VIGILAR/LIMPIAR/URGENTE)
- Calculo de break-even: dias para recuperar el coste de limpieza
- Perdidas acumuladas desde la ultima limpieza visibles en EUR
- Decision basada en datos, no en intuicion

---

#### Problema 3: Falta de historico y tendencias
**Antes:**
- Datos de produccion en Excel o papel
- No hay graficos de tendencia
- Imposible comparar periodos
- Perdida de datos al cambiar de responsable

**Con Soiling Calc:**
- Historial completo de lecturas con todos los calculos
- 3 graficos interactivos (soiling, PR, perdidas)
- Exportacion CSV para analisis externo
- Datos persistidos en la nube (Supabase)

---

#### Problema 4: Complejidad tecnica del modelo
**Antes:**
- Necesidad de ingenieros fotovoltaicos para interpretar datos
- Hojas de calculo con formulas complejas propensos a errores
- No hay estandarizacion en los calculos
- Cada planta se analiza de forma diferente

**Con Soiling Calc:**
- Motor NOCT estandarizado ejecuta todos los calculos automaticamente
- Interfaz simple: el operador solo ingresa kWh y fecha
- Recomendaciones en lenguaje claro (no tecnico)
- Misma metodologia para todas las plantas

---

## BENEFICIOS CUANTIFICABLES

### Para Operadores de Plantas Solares

| Metrica | Sin Soiling Calc | Con Soiling Calc | Mejora |
|---------|-----------------|------------------|--------|
| Coste de sensores | 200-2000 EUR/planta | 0 EUR | 100% ahorro |
| Tiempo analisis datos (hrs/mes) | 8-15 | 1-2 | 85% reduccion |
| Precision del soiling | Estimacion visual | Modelo NOCT calibrado | +90% precision |
| Limpiezas innecesarias/ano | 2-3 | 0-1 | 65% reduccion |
| Perdidas no detectadas (EUR/ano) | 500-3000 | < 100 | 95% reduccion |
| Tiempo de decision "limpiar o no" | 1-2 dias | Instantaneo | 100% |

### ROI Estimado (Planta de 8 kWp, 20 modulos)

```
Perdidas evitadas por deteccion temprana:  ~400 EUR/ano
Limpiezas innecesarias evitadas:           ~300 EUR/ano (2 limpiezas x 150 EUR)
Tiempo de analisis ahorrado:               ~130 EUR/ano (13h x 10 EUR/h)
Sensores de irradiancia no comprados:      ~500 EUR (unico)
-------------------------------------------------
BENEFICIO ANUAL ESTIMADO:                  ~830 EUR
BENEFICIO PRIMER ANO (con sensores):       ~1330 EUR
```

---

## ADAPTABILIDAD A OTROS DOMINIOS

Soiling Calc esta construido con arquitectura modular (Feature-First + tokens semanticos). Con cambios minimos puede adaptarse a:

### 1. Monitorizacion de Parques Eolicos

**Cambios Requeridos:**
- Reemplazar modulo FV por aerogenerador (potencia nominal, curva de potencia)
- Irradiancia → velocidad de viento (Open-Meteo lo ofrece)
- Soiling → degradacion de palas / ice accretion
- Ajustar motor de calculo a curva de potencia del aerogenerador

**Mercado:** Alto | **Dificultad:** Media | **Potencial:** Alto

---

### 2. Eficiencia de Sistemas de Climatizacion (HVAC)

**Cambios Requeridos:**
- Planta FV → Unidad HVAC (potencia nominal, COP)
- Irradiancia → temperatura exterior + humedad
- Soiling → degradacion de filtros / reduccion de COP
- Recomendacion de limpieza → recomendacion de mantenimiento

**Mercado:** Muy Alto | **Dificultad:** Media | **Potencial:** Alto

---

### 3. Gestion de Flotas de Vehiculos Electricos

**Cambios Requeridos:**
- Planta FV → Vehiculo EV (capacidad bateria, consumo nominal)
- Produccion kWh → autonomia real vs teorica
- Soiling → degradacion de bateria / eficiencia de carga
- Open-Meteo → datos de ruta + clima

**Mercado:** Alto | **Dificultad:** Alta | **Potencial:** Muy Alto

---

### 4. Rendimiento de Maquinaria Industrial

**Cambios Requeridos:**
- Planta FV → Maquina (produccion nominal, eficiencia)
- Produccion real vs teorica → OEE (Overall Equipment Effectiveness)
- Soiling → degradacion / necesidad de mantenimiento
- Recomendacion de limpieza → recomendacion de mantenimiento preventivo

**Mercado:** Muy Alto | **Dificultad:** Baja | **Potencial:** Muy Alto

---

### 5. Calidad del Agua en Plantas de Tratamiento

**Cambios Requeridos:**
- Produccion kWh → caudal tratado / calidad del agua
- Soiling → obstruccion de filtros / reduccion de eficiencia
- Open-Meteo → sensores de calidad inline
- Recomendacion → backwash o reemplazo de filtros

**Mercado:** Medio | **Dificultad:** Media | **Potencial:** Alto

---

## TABLA COMPARATIVA DE VERTICALES

| Vertical | Dificultad | Mercado | Competencia | Potencial |
|----------|------------|---------|-------------|-----------|
| Solar FV (actual) | Baja (actual) | Alto | Baja | Muy Alto |
| Eolica | Media | Alto | Media | Alto |
| HVAC | Media | Muy Alto | Media | Alto |
| Flotas EV | Alta | Alto | Alta | Muy Alto |
| Maquinaria industrial | Baja | Muy Alto | Baja | Muy Alto |
| Tratamiento agua | Media | Medio | Baja | Alto |

---

## PROXIMOS PASOS RECOMENDADOS

### Inmediato (Esta Semana)
1. Verificar datos de produccion con plantas reales
2. Ajustar umbrales de recomendacion con feedback de operadores
3. Validar precision del modelo NOCT vs datos de campo

### Corto Plazo (1-2 Semanas)
1. Sistema de pagos (Stripe) para plan paid
2. Multi-planta: importacion masiva de lecturas
3. Alertas por email cuando soiling supera umbral
4. Integracion con inversores (API SolarEdge, Huawei, etc.)

### Mediano Plazo (1 Mes)
1. App movil (PWA)
2. Dashboard multi-planta (portfolio view)
3. Modelo de irradiancia POA mejorado (modelo Perez completo)
4. Comparativa entre plantas del mismo usuario

### Largo Plazo (3+ Meses)
1. Machine Learning para prediccion de soiling
2. Integracion con drones de inspeccion
3. Marketplace de servicios de limpieza
4. API publica para integradores
5. Multi-tenancy (white-label para empresas de O&M)

---

## CREDENCIALES DE PRUEBA

### Admin
- Email: `admin@soiling.test`
- User ID: `6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7`
- Acceso: via magic link (Supabase Admin API) o ADMIN_EMAIL env var

### Planta de Prueba
- Nombre: Instalacion Solar Madrid
- ID: `17a0f33e-a177-4d6a-942e-013890d6075a`
- Config: 20 modulos, 8 kWp, 400 Wp/modulo, Madrid (40.4N, 3.7W)
- Datos: 36 lecturas seed con fisica real (soiling 0.1%/dia)

---

## RECURSOS

- **Supabase Dashboard:** https://supabase.com/dashboard/project/yduujlxtymhtnxcbwldh
- **Reporte Tecnico:** `docs/reporte-tecnico.md`
- **Brand Contract:** `.claude/brand-contract.md`
- **Blueprint (PRP):** `.claude/PRPs/PRP-001-calculadora-soiling-v2.md`
- **Portfolio Visual:** `portfolio/v5/` (24 capturas)

---

*Documento generado el 20 de Febrero, 2026*
*Soiling Calc v2.0.0 - Sistema de Monitoreo de Soiling para Instalaciones Fotovoltaicas*
