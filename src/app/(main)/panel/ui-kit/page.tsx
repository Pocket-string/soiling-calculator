import { requireAdmin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { KpiCard } from '@/components/ui/kpi-card'
import { CleaningLevelBadge } from '@/features/plants/components/CleaningLevelBadge'

export const metadata = { title: 'UI Kit | Soiling Calc' }

/* ─── Color swatch helper ──────────────────────────────────────────────── */

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-12 h-12 rounded-lg border border-border ${className}`} />
      <span className="text-[10px] text-foreground-muted font-mono leading-tight text-center">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default async function UIKitPage() {
  await requireAdmin()

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">UI Kit</h1>
        <p className="text-foreground-secondary mt-1">
          Referencia visual del design system de Soiling Calc. Solo visible para administradores.
        </p>
      </div>

      {/* ── 1. SEMANTIC COLORS ───────────────────────────────────────────── */}
      <Section title="1. Colores semánticos">
        <SubSection title="Fondos y superficies">
          <div className="flex flex-wrap gap-4">
            <Swatch label="background" className="bg-background" />
            <Swatch label="surface" className="bg-surface" />
            <Swatch label="surface-alt" className="bg-surface-alt" />
          </div>
        </SubSection>

        <SubSection title="Texto">
          <div className="flex flex-wrap gap-6">
            <div className="space-y-1">
              <p className="text-foreground font-medium">foreground</p>
              <p className="text-[10px] font-mono text-foreground-muted">text-foreground</p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground-secondary font-medium">foreground-secondary</p>
              <p className="text-[10px] font-mono text-foreground-muted">text-foreground-secondary</p>
            </div>
            <div className="space-y-1">
              <p className="text-foreground-muted font-medium">foreground-muted</p>
              <p className="text-[10px] font-mono text-foreground-muted">text-foreground-muted</p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Bordes">
          <div className="flex flex-wrap gap-4">
            <div className="w-24 h-12 rounded-lg border-2 border-border-light flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">border-light</span>
            </div>
            <div className="w-24 h-12 rounded-lg border-2 border-border flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">border</span>
            </div>
            <div className="w-24 h-12 rounded-lg border-2 border-border-dark flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">border-dark</span>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 2. BRAND PALETTE ─────────────────────────────────────────────── */}
      <Section title="2. Paleta de marca">
        <SubSection title="Primary (Azul Marino)">
          <div className="flex flex-wrap gap-2">
            <Swatch label="50" className="bg-primary-50" />
            <Swatch label="100" className="bg-primary-100" />
            <Swatch label="200" className="bg-primary-200" />
            <Swatch label="300" className="bg-primary-300" />
            <Swatch label="400" className="bg-primary-400" />
            <Swatch label="500" className="bg-primary-500" />
            <Swatch label="600" className="bg-primary-600" />
            <Swatch label="700" className="bg-primary-700" />
            <Swatch label="800" className="bg-primary-800" />
            <Swatch label="900" className="bg-primary-900" />
          </div>
        </SubSection>

        <SubSection title="Secondary (Dorado)">
          <div className="flex flex-wrap gap-2">
            <Swatch label="50" className="bg-secondary-50" />
            <Swatch label="100" className="bg-secondary-100" />
            <Swatch label="200" className="bg-secondary-200" />
            <Swatch label="300" className="bg-secondary-300" />
            <Swatch label="400" className="bg-secondary-400" />
            <Swatch label="500" className="bg-secondary-500" />
            <Swatch label="600" className="bg-secondary-600" />
            <Swatch label="700" className="bg-secondary-700" />
            <Swatch label="800" className="bg-secondary-800" />
            <Swatch label="900" className="bg-secondary-900" />
          </div>
        </SubSection>

        <SubSection title="Accent (Azul Brillante)">
          <div className="flex flex-wrap gap-2">
            <Swatch label="50" className="bg-accent-50" />
            <Swatch label="100" className="bg-accent-100" />
            <Swatch label="200" className="bg-accent-200" />
            <Swatch label="300" className="bg-accent-300" />
            <Swatch label="400" className="bg-accent-400" />
            <Swatch label="500" className="bg-accent-500" />
            <Swatch label="600" className="bg-accent-600" />
            <Swatch label="700" className="bg-accent-700" />
            <Swatch label="800" className="bg-accent-800" />
            <Swatch label="900" className="bg-accent-900" />
          </div>
        </SubSection>

        <SubSection title="Estados">
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground-secondary">Success</p>
              <div className="flex gap-2">
                <Swatch label="50" className="bg-success-50" />
                <Swatch label="100" className="bg-success-100" />
                <Swatch label="500" className="bg-success-500" />
                <Swatch label="600" className="bg-success-600" />
                <Swatch label="700" className="bg-success-700" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground-secondary">Warning</p>
              <div className="flex gap-2">
                <Swatch label="50" className="bg-warning-50" />
                <Swatch label="100" className="bg-warning-100" />
                <Swatch label="500" className="bg-warning-500" />
                <Swatch label="600" className="bg-warning-600" />
                <Swatch label="700" className="bg-warning-700" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground-secondary">Error</p>
              <div className="flex gap-2">
                <Swatch label="50" className="bg-error-50" />
                <Swatch label="100" className="bg-error-100" />
                <Swatch label="500" className="bg-error-500" />
                <Swatch label="600" className="bg-error-600" />
                <Swatch label="700" className="bg-error-700" />
              </div>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 3. TYPOGRAPHY ────────────────────────────────────────────────── */}
      <Section title="3. Tipografía">
        <div className="space-y-4 bg-surface rounded-lg border border-border p-6">
          <p className="text-2xl font-bold text-foreground">Heading 2xl bold</p>
          <p className="text-xl font-bold text-foreground">Heading xl bold</p>
          <p className="text-lg font-semibold text-foreground">Heading lg semibold</p>
          <p className="text-base font-medium text-foreground">Body base medium</p>
          <p className="text-base text-foreground-secondary">Body base secondary</p>
          <p className="text-sm text-foreground-secondary">Body sm secondary</p>
          <p className="text-xs text-foreground-muted">Caption xs muted</p>
          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest">Label uppercase widest</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-foreground">1,234.56 kWh <span className="text-sm font-normal text-foreground-muted">(mono tabular)</span></p>
        </div>
      </Section>

      {/* ── 4. BUTTONS ───────────────────────────────────────────────────── */}
      <Section title="4. Botones">
        <SubSection title="Variantes">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </SubSection>

        <SubSection title="Tamaños">
          <div className="flex flex-wrap gap-3 items-end">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </SubSection>

        <SubSection title="Estados">
          <div className="flex flex-wrap gap-3 items-center">
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. BADGES ────────────────────────────────────────────────────── */}
      <Section title="5. Badges">
        <SubSection title="Badge genérico">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </SubSection>

        <SubSection title="CleaningLevelBadge (status-map.ts)">
          <div className="flex flex-wrap gap-3">
            <CleaningLevelBadge level="OK" soilingPercent={0.5} />
            <CleaningLevelBadge level="WATCH" soilingPercent={2.1} />
            <CleaningLevelBadge level="RECOMMENDED" soilingPercent={5.3} />
            <CleaningLevelBadge level="URGENT" soilingPercent={12.0} />
            <CleaningLevelBadge level={null} soilingPercent={0} />
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            Fuente: <code className="bg-surface-alt px-1 py-0.5 rounded text-[10px]">src/lib/tokens/status-map.ts</code>
          </p>
        </SubSection>
      </Section>

      {/* ── 6. CARDS ─────────────────────────────────────────────────────── */}
      <Section title="6. Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Default</CardTitle>
              <CardDescription>Con shadow-card y borde estándar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-secondary">Contenido de la card con padding md (p-6).</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Acción</Button>
            </CardFooter>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Card Bordered</CardTitle>
              <CardDescription>Sin shadow, border-2</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-secondary">Variante para secciones internas.</p>
            </CardContent>
          </Card>
        </div>

        <SubSection title="KPI Cards">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Performance Ratio" value="82.4%" sub="vs 85% baseline" />
            <KpiCard label="Soiling" value="3.2%" alert sub="Limpieza recomendada" />
            <KpiCard label="Producción" value="42.1 kWh" sub="Hoy" />
            <KpiCard label="Pérdida acum." value="12.50 EUR" sub="Desde última limpieza" />
          </div>
        </SubSection>
      </Section>

      {/* ── 7. FORM ELEMENTS ─────────────────────────────────────────────── */}
      <Section title="7. Formularios">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input label="Input normal" placeholder="Escribe algo..." />
            <Input label="Input con hint" placeholder="ejemplo@email.com" hint="Te enviaremos un enlace de confirmación" />
            <Input label="Input con error" placeholder="..." error="Este campo es obligatorio" />
            <Input label="Input deshabilitado" placeholder="No editable" disabled />
          </div>
          <div className="space-y-4">
            <Select
              label="Select normal"
              options={[
                { value: '', label: 'Selecciona una opción' },
                { value: 'option1', label: 'Opción 1' },
                { value: 'option2', label: 'Opción 2' },
              ]}
            />
            <Select
              label="Select con error"
              error="Selecciona una opción válida"
              options={[
                { value: '', label: 'Selecciona...' },
              ]}
            />
          </div>
        </div>
      </Section>

      {/* ── 8. SPACING & RADIUS ──────────────────────────────────────────── */}
      <Section title="8. Espaciado y bordes">
        <SubSection title="Border radius">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-sm" />
              <span className="text-[10px] font-mono text-foreground-muted">rounded-sm</span>
            </div>
            <div className="space-y-1 text-center">
              <div className="w-16 h-16 bg-primary-500 rounded" />
              <span className="text-[10px] font-mono text-foreground-muted">rounded</span>
            </div>
            <div className="space-y-1 text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-lg" />
              <span className="text-[10px] font-mono text-foreground-muted">rounded-lg</span>
            </div>
            <div className="space-y-1 text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full" />
              <span className="text-[10px] font-mono text-foreground-muted">rounded-full</span>
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-2">
            Estándar del proyecto: <code className="bg-surface-alt px-1 py-0.5 rounded text-[10px]">rounded-lg</code> para cards, inputs, botones.
            No usar rounded-xl ni rounded-2xl.
          </p>
        </SubSection>

        <SubSection title="Shadows">
          <div className="flex flex-wrap gap-4">
            <div className="w-24 h-16 bg-surface rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">shadow-sm</span>
            </div>
            <div className="w-24 h-16 bg-surface rounded-lg shadow-card flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">shadow-card</span>
            </div>
            <div className="w-24 h-16 bg-surface rounded-lg shadow-card-hover flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">card-hover</span>
            </div>
            <div className="w-24 h-16 bg-surface rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-[10px] font-mono text-foreground-muted">shadow-lg</span>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 9. RULES ─────────────────────────────────────────────────────── */}
      <Section title="9. Reglas del design system">
        <div className="bg-surface rounded-lg border border-border p-6 space-y-4 text-sm text-foreground-secondary">
          <div>
            <p className="font-semibold text-foreground">Colores</p>
            <p>Nunca usar grays hardcodeados (text-gray-500). Siempre tokens semánticos (text-foreground-secondary).</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Estados</p>
            <p>CleaningLevel siempre desde <code className="bg-surface-alt px-1 py-0.5 rounded text-xs">status-map.ts</code>. Nunca definir colores localmente.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Border radius</p>
            <p>Estándar: <code className="bg-surface-alt px-1 py-0.5 rounded text-xs">rounded-lg</code>. Prohibido: rounded-xl, rounded-2xl (excepto rounded-full para avatares/dots).</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Copy</p>
            <p>App = tú (informal). Legal = usted (formal). Siempre con tildes.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Auth</p>
            <p>Modelo invite-only. Nunca mostrar enlace a /signup. CTA público: &quot;Solicita acceso&quot;.</p>
          </div>
        </div>
      </Section>
    </div>
  )
}
