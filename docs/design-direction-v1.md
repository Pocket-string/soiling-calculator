# Design Direction v1 — SoilingCalc

> **Direccion:** Panel de Instrumentos Industrial
> **Fecha:** 2026-02-19
> **Aplica a:** Area autenticada (`/plants`, `/admin`, `/settings`)

---

## 1. Principios de Diseno

| # | Principio | Descripcion |
|---|-----------|-------------|
| 1 | **Datos primero** | Numeros grandes, labels pequenas, sin decoracion innecesaria |
| 2 | **Densidad controlada** | Compact spacing, tabular nums, info-dense pero no cluttered |
| 3 | **Jerarquia clara** | KPI → tendencias → tabla → drill-down |
| 4 | **Estados como informacion** | Colores semanticos solo para decision (OK/WATCH/RECOMMEND/URGENT) |
| 5 | **Monocromo + 1 acento** | Neutrales (slate) + amber como unico acento primario |
| 6 | **Instrumental, no marketing** | Sin gradients, glassmorphism, sombras pesadas ni hero CTAs en /app |

---

## 2. Tokens

### 2.1 Colores

**Sistema simplificado** (eliminar navy/gold del template legal):

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--bg` | slate-50 | slate-950 | Fondo de pagina |
| `--surface` | white | slate-900 | Cards, panels |
| `--surface-alt` | slate-50 | slate-800 | Filas alternadas, hover |
| `--border` | slate-200 | slate-800 | Bordes de cards, inputs |
| `--text` | slate-900 | slate-50 | Texto principal |
| `--text-muted` | slate-500 | slate-400 | Labels, secundario |
| `--accent` | amber-500 | amber-400 | Acento primario (sidebar, CTAs) |

**Estados (semanticos, no decorativos):**

| Estado | Color | Uso |
|--------|-------|-----|
| OK | green-500 | Soiling < 3%, PR alto |
| WATCH | amber-500 | Soiling 3-5%, degradacion leve |
| RECOMMENDED | orange-500 | Soiling 5-8%, limpieza recomendada |
| URGENT | red-500 | Soiling > 8%, perdidas significativas |

**Charts:**

| Elemento | Color | Nota |
|----------|-------|------|
| Grid lines | slate-200 (light) / slate-700 (dark) | Muy sutil |
| Axis labels | slate-500 | Mono, small |
| Soiling line | amber-500 | Acento primario |
| PR line | blue-500 | Secundario tecnico |
| Losses bars | red-400 | Semantico: perdida |
| Theoretical line | slate-400 dashed | Referencia |
| Cleaning markers | green-500 dots | Evento positivo |

### 2.2 Tipografia

**Una sola familia + monospace para datos:**

| Rol | Font | Size | Weight | Uso |
|-----|------|------|--------|-----|
| H1 | Inter | 1.5rem (24px) | 600 | Titulos de pagina |
| H2 | Inter | 1.125rem (18px) | 600 | Titulos de seccion |
| Body | Inter | 0.875rem (14px) | 400 | Texto general |
| Small | Inter | 0.75rem (12px) | 400 | Labels, captions |
| KPI | System mono | 2rem (32px) | 700 | Numeros destacados |
| Data | System mono | 0.875rem (14px) | 400 | Tablas, valores inline |
| Code | System mono | 0.8125rem (13px) | 400 | IDs, slugs tecnicos |

**Eliminar:** DM Sans (no aporta diferenciacion real en area autenticada)

### 2.3 Spacing

**Escala base 4px:**

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Gap entre icon y label |
| sm | 8px | Padding interno badges |
| md | 12px | Gap entre elementos inline |
| base | 16px | Card padding compact |
| lg | 20px | Card padding default |
| xl | 24px | Section gap, page padding |
| 2xl | 32px | Separacion entre secciones mayores |

### 2.4 Border Radius

| Elemento | Valor | Token |
|----------|-------|-------|
| Cards, inputs, buttons, badges | 8px | `rounded-lg` |
| Avatares, dots de estado | 9999px | `rounded-full` |
| Todo lo demas | 8px | `rounded-lg` |

**Eliminar:** rounded-xl, rounded-2xl, rounded-3xl en componentes (unificar a rounded-lg)

### 2.5 Sombras

**Solo 2 niveles:**

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-card` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Cards, surface elements |
| `shadow-elevated` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Popovers, dropdowns, modals |

**Eliminar:** shadow-glass, shadow-modal, sombras decorativas

---

## 3. UI Map por Pagina

### `/plants` (Portfolio)
- Header: titulo + count badge + boton crear (compact, inline)
- Grid de PlantCards: stats inline (no stacked), monospace para numeros
- Empty state: minimal, sin ilustracion pesada

### `/plants/[id]` (Plant Dashboard — pagina principal)
- Header: nombre planta + specs inline (kWp, modulos, tilt) + acciones
- Fila KPI: 4 cards compactas en row
  - Soiling % (con dot de estado)
  - Performance Ratio (con comparacion vs baseline)
  - Perdida diaria (kWh + EUR)
  - Break-even (dias restantes)
- Charts: 2 columnas, fondo neutro, grid sutil, reference lines para umbrales
- Tabla lecturas: compact, headers sticky, monospace nums, alternating rows

### `/plants/[id]/readings/new` (Data Entry)
- Formulario limpio, campos bien espaciados
- Sin decoracion excesiva
- Feedback inline (errores Zod debajo del campo)

### `/admin/funnel` (Admin Analytics)
- Funnel horizontal con barras proporcionales (no solo pills)
- Metrics tables compactas, monospace nums
- Recent events timeline

### `/settings` (Config)
- Cards apiladas verticalmente
- Formularios simples, sin wizards

---

## 4. Checklist Do/Don't

### DO

- [ ] Usar tokens del design system (no hardcodear colores)
- [ ] `font-mono tabular-nums` para todos los numeros (KPIs, tablas, charts)
- [ ] Compact spacing en componentes de datos
- [ ] Status colors (green/amber/orange/red) solo para informar decision
- [ ] Labels en `text-xs uppercase tracking-wide text-muted` para categorias
- [ ] Tooltips para terminos tecnicos (PR, soiling, baseline, NOCT)
- [ ] `rounded-lg` como unico border-radius (excepto avatares/dots)
- [ ] Bordes sutiles (`border border-slate-200`) en vez de sombras decorativas
- [ ] Alternating row colors en tablas densas

### DON'T

- [ ] Gradients, glassmorphism, sombras decorativas en /app
- [ ] Emojis en UI (excepto empty states si es necesario)
- [ ] Hero CTAs, marketing language en area autenticada
- [ ] Colores decorativos sin significado (azul/morado por "bonito")
- [ ] Bordes decorativos (gold-accent, gradient borders)
- [ ] Mas de 2 font families en area autenticada
- [ ] rounded-xl, rounded-2xl, rounded-3xl (unificar a rounded-lg)
- [ ] shadow-glass, shadow-modal (solo shadow-card y shadow-elevated)
- [ ] Padding > 24px en cards de datos (mantener densidad)
- [ ] `text-2xl` o mayor para labels/descriptions (solo para KPI numeros)

---

## 5. Componentes a Crear/Refactorizar (Fases 2-4)

| Componente | Estado | Prioridad | Notas |
|------------|--------|-----------|-------|
| Design tokens CSS | Nuevo | Fase 2 | Variables CSS centralizadas |
| ThemeProvider | Nuevo | Fase 2 | Dark mode toggle |
| AppShell (sidebar+header) | Refactor | Fase 3 | Responsive, collapsed state |
| KPICard | Nuevo | Fase 4 | Numero mono + label + status dot |
| DataTable | Nuevo | Fase 4 | Compact, sort, sticky headers |
| StatusBadge | Refactor | Fase 4 | Solo 4 estados semanticos |
| ChartContainer | Nuevo | Fase 5 | Wrapper con tokens de chart |
| SoilingChart | Refactor | Fase 5 | Usar chart tokens |
| LossesChart | Refactor | Fase 5 | Usar chart tokens |

---

## Changelog

| Fecha | Version | Cambio |
|-------|---------|--------|
| 2026-02-19 | v1.0 | Documento inicial — principios, tokens, UI map, checklist |
