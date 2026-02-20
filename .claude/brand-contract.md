# Brand Contract — Soiling Calculator SaaS

> Documento generado por Fase 0: Auditoria completa.
> Fecha: 2026-02-19
> Estado: VIGENTE — toda modificacion visual debe respetar este contrato.

---

## 1. Identidad Visual

### Paleta de colores

| Rol | Token Tailwind | Valor Light | Valor Dark |
|-----|---------------|-------------|------------|
| Fondo pagina | `bg-background` | `#FAFBFC` | `#020617` |
| Superficie (cards) | `bg-surface` | `#FFFFFF` | `#0F172A` |
| Superficie alt | `bg-surface-alt` | `#F8FAFC` | `#1E293B` |
| Texto principal | `text-foreground` | `#0F172A` | `#F8FAFC` |
| Texto secundario | `text-foreground-secondary` | `#64748B` | `#94A3B8` |
| Texto muted | `text-foreground-muted` | `#94A3B8` | `#64748B` |
| Borde default | `border-border` | `#E2E8F0` | `#1E293B` |
| Borde light | `border-border-light` | `#F1F5F9` | `#0F172A` |
| Borde dark | `border-border-dark` | `#CBD5E1` | `#334155` |

### Paleta de marca

| Rol | Token | Hex |
|-----|-------|-----|
| Primary (azul marino) | `primary-500` | `#1E3A5F` |
| Secondary (dorado) | `secondary-500` | `#D4A853` |
| Accent (azul brillante) | `accent-500` | `#2563EB` |

### Regla de uso de color
- **NUNCA** usar clases hardcodeadas de Tailwind (`text-gray-600`, `bg-white`, `border-gray-200`)
- **SIEMPRE** usar tokens semanticos (`text-foreground-secondary`, `bg-surface`, `border-border`)
- **Excepciones unicas**: secciones dark intencionales (Footer `bg-slate-900`, HeroSection gradients) con transparencias (`bg-white/10`, `bg-white/20`)

---

## 2. Tipografia

| Contexto | Font Family | Token |
|----------|-------------|-------|
| App (todo el dashboard) | Inter | `font-sans` |
| Marketing headings | DM Sans | `font-heading` |
| Codigo / datos | System mono | `font-mono` |

### Escala tipografica

| Nivel | Token | Uso |
|-------|-------|-----|
| Display 2XL | `text-display-2xl` | Hero principal landing |
| Display XL | `text-display-xl` | Secciones hero secundarias |
| Display LG | `text-display-lg` | Titulos de seccion marketing |
| Display MD | `text-display-md` | Subtitulos marketing |
| Display SM | `text-display-sm` | Cards marketing grandes |
| Display XS | `text-display-xs` | Titulos de pagina app |
| Body XL | `text-body-xl` | Texto destacado |
| Body LG | `text-body-lg` | Texto de lead |
| Body MD | `text-body-md` | Texto base |
| Body SM | `text-body-sm` | Texto secundario, labels |
| Body XS | `text-body-xs` | Texto auxiliar, badges |

### Regla tipografica
- Marketing: `font-heading` para h1/h2, tokens `text-display-*`
- App: `font-sans` para todo, tamanos con tokens `text-body-*` o utilidades estandar (`text-sm`, `text-lg`)
- **NUNCA** mezclar DM Sans en la app ni Inter sin tokens en marketing

---

## 3. Bordes y sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-lg` | 0.5rem | Borde por defecto de cards, inputs, buttons |
| `rounded-md` | 0.375rem | Badges, chips |
| `rounded-full` | 9999px | Avatares, iconos circulares |
| `shadow-card` | `var(--shadow-card)` | Cards en reposo |
| `shadow-card-hover` | Definido en config | Cards en hover |
| `shadow-elevated` | `var(--shadow-elevated)` | Dropdowns, modals |
| `shadow-modal` | Definido en config | Modal overlay |

### Regla de bordes
- **NUNCA** usar `rounded-xl` o `rounded-2xl` — el sistema usa `rounded-lg` como maximo
- Excepcion: `rounded-full` para elementos circulares

---

## 4. Layout y Navegacion

### Estructura de rutas

| Grupo | Layout | Header | Footer | Uso |
|-------|--------|--------|--------|-----|
| `(marketing)` | MarketingLayout | MarketingNav | MarketingFooter | Landing, apply, thanks, waitlist |
| `(public)` | PublicLayout | MarketingNav | Footer (4-col) | Contacto, servicios, equipo, legal |
| `(auth)` | AuthLayout | Ninguno | Ninguno | Login (split-screen) |
| `(main)` | MainLayout | Sidebar colapsable | Ninguno | Dashboard, plants, readings, settings |

> **Fase 1+2 completada**: TopBar y Navbar duplicada eliminados. Todas las paginas publicas usan MarketingNav.

---

## 5. Sistema de Estados (CleaningLevel)

### Estado actual (RESUELTO — Fase 3)

| Estado | Badge | Dot | Pill |
|--------|-------|-----|------|
| OK | `bg-success-50 text-success-700 border-success-100` | `bg-success-500` | `bg-success-50 text-success-700` |
| WATCH | `bg-warning-50 text-warning-700 border-warning-100` | `bg-warning-500` | `bg-warning-50 text-warning-700` |
| RECOMMENDED | `bg-orange-50 text-orange-700 border-orange-200` | `bg-orange-500` | `bg-orange-50 text-orange-700` |
| URGENT | `bg-error-50 text-error-700 border-error-100` | `bg-error-500` | `bg-error-50 text-error-700` |

**Unica fuente de verdad**: `src/lib/tokens/status-map.ts` (labels + messages + colores)
Consumidores migrados: CleaningLevelBadge, DemoKPIs, DemoReadingTable, CleaningRecommendationCard, ReadingList.
0 colores de estado definidos inline.

---

## 6. Auth — Modelo Invite-Only

### Estado actual (RESUELTO — Fase 1+2)
- Login page muestra "Acceso solo por invitacion. Solicitar acceso → /apply"
- `/signup` redirige a `/apply` (mantenido como fallback)
- Auth layout: Solo login + recovery. Sin signup visible
- Logos auth migrados de `bg-amber-400` a `bg-primary-500`
- Copy "Registrate" reemplazado por "Solicita acceso" en CTAs publicos

---

## 7. Animaciones

| Token | Duracion | Easing | Uso |
|-------|----------|--------|-----|
| `animate-fade-in` | 300ms | ease-out | Entrada de contenido |
| `animate-slide-up` | 300ms | ease-out | Listas, cards nuevas |
| `animate-slide-down` | 300ms | ease-out | Dropdowns, menus |
| `animate-scale-in` | 200ms | ease-out | Modals, tooltips |
| `animate-slide-in-right` | 300ms | ease-out | Menu mobile |

---

## 8. Espaciado

| Contexto | Padding/Gap |
|----------|-------------|
| Page container | `p-6 max-w-7xl mx-auto` |
| Section spacing | `py-16` (marketing), `mb-6` (app) |
| Card padding | `p-4` o `p-6` |
| Grid gap | `gap-4` o `gap-6` |
| Form fields | `space-y-4` |

---

## 9. Componentes reutilizables (no duplicar)

| Necesidad | Componente | Ubicacion |
|-----------|-----------|-----------|
| Status badge | `CleaningLevelBadge` | `src/features/plants/components/` |
| KPI card | `MetricCard` | `src/features/soiling/components/` |
| Loading | `LoadingSpinner` | `src/components/ui/` |
| Page heading | `SectionHeading` | `src/components/public/` |
| Button primario | shadcn `Button` | `src/components/ui/button.tsx` |
| Form input | shadcn `Input` | `src/components/ui/input.tsx` |

---

## 10. Health Score (actualizado Fase 5)

| Dimensión | Score | Detalle |
|-----------|-------|---------|
| Tokens semánticos | 9/10 | App + marketing + public 100% migrados |
| Tipografía | 8/10 | Tokens definidos, consistente en app, UI Kit documenta escalas |
| Estado/colores | 10/10 | Fuente única: `status-map.ts`, 0 definiciones locales |
| Layout | 9/10 | MarketingNav unificado en todas las páginas públicas |
| Auth coherencia | 10/10 | Invite-only consistente, 0 referencias a /signup o "Regístrate" |
| Copy/microcopy | 9/10 | Tildes corregidas en ~40 archivos, español correcto |
| UI Kit | 10/10 | Página interna en `/admin/ui-kit` con 9 secciones |
| **Promedio** | **9.3/10** | **OBJETIVO ALCANZADO** |

---

## 11. Reglas de copy (Fase 5)

### Tono
- **App autenticada**: tú (informal) — "Tu planta", "Inicia sesión"
- **Legal (términos, privacidad)**: usted (formal) — "Usted acepta", "su información"
- **Marketing**: tú (informal) — "Monitorea tus paneles"
- **Formulario contacto**: usted (formal) — "Nos pondremos en contacto con usted"

### Tildes obligatorias (palabras frecuentes)
| Incorrecto | Correcto |
|------------|----------|
| sesion | sesión |
| contraseña | contraseña |
| configuracion | configuración |
| instalacion | instalación |
| produccion | producción |
| ubicacion | ubicación |
| recomendacion | recomendación |
| calculo/calculos | cálculo/cálculos |
| parametros | parámetros |
| periodo | período |
| modulo | módulo |
| automaticamente | automáticamente |
| invitacion | invitación |
| pagina | página |

### Excepciones (no tocar)
- URL paths (`/terminos`, `/privacidad`) — sin tildes por convención web
- CSV headers (`recomendacion`, `dias_break_even`) — formato de datos, no UI
- Variable names en código — siempre ASCII

---

## Resumen de fases

| Fase | Estado | Archivos tocados |
|------|--------|-----------------|
| 0 | COMPLETADA | Auditoría + brand-contract.md |
| 1+2 | COMPLETADA | ~15 archivos (layouts + auth) |
| 3 | COMPLETADA | ~6 archivos (status system) |
| 4 | COMPLETADA | ~40 archivos (color tokens) |
| 5 | COMPLETADA | ~40 archivos (tildes + microcopy) |
| 6 | COMPLETADA | 1 archivo: `src/app/(main)/admin/ui-kit/page.tsx` |
| 7 | COMPLETADA | 0 archivos (validación: build + grep audit) |

### UI Kit page
- Ruta: `/admin/ui-kit` (requiere admin)
- Secciones: colores semánticos, paleta de marca, tipografía, botones, badges, cards, KPI cards, formularios, espaciado/radius, reglas
