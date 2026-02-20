/**
 * Portfolio v5 screenshot generator
 * Usage: node scripts/screenshot-portfolio.mjs
 */
import { chromium } from 'playwright'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'portfolio', 'v5')
const BASE = 'http://localhost:3000'

const VIEWPORT = { width: 1440, height: 900 }

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function go(page, path) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
  } catch {
    // If domcontentloaded times out, page is probably still usable
    console.log(`    (timeout on ${path}, continuing anyway)`)
  }
  await delay(2500)
}

async function snap(page, name, fullPage = false) {
  const path = join(OUTPUT_DIR, `${name}.png`)
  await page.screenshot({ path, fullPage })
  console.log(`  -> ${name}.png`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  console.log('Portfolio v5 — Capturing screenshots...\n')

  // ─── PUBLIC / MARKETING ────────────────────────────────────────────
  console.log('[Public pages]')

  await go(page, '/')
  await snap(page, '01-landing-hero')
  await snap(page, '02-landing-full', true)

  await go(page, '/servicios')
  await snap(page, '03-servicios')

  await go(page, '/contacto')
  await snap(page, '04-contacto')

  await go(page, '/equipo')
  await snap(page, '05-equipo')

  await go(page, '/apply')
  await snap(page, '06-apply-form')

  await go(page, '/demo')
  await delay(1000) // extra for charts
  await snap(page, '07-demo-hero')
  await snap(page, '08-demo-full', true)

  // ─── AUTH ──────────────────────────────────────────────────────────
  console.log('[Auth pages]')

  await go(page, '/login')
  await snap(page, '09-login')

  await go(page, '/forgot-password')
  await snap(page, '10-forgot-password')

  await go(page, '/check-email')
  await snap(page, '11-check-email')

  // ─── APP (logged in) ──────────────────────────────────────────────
  console.log('[App pages — attempting login]')
  await go(page, '/login')

  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first()

  let loggedIn = false
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill('admin@soiling.test')
    await passwordInput.fill('admin123')
    await page.locator('button[type="submit"]').first().click()
    await delay(4000)
    loggedIn = !page.url().includes('/login')
  }
  console.log(`  Login: ${loggedIn ? 'SUCCESS' : 'FAILED (skipping app pages)'}`)

  if (loggedIn) {
    await go(page, '/plants')
    await snap(page, '12-dashboard-plantas')

    await go(page, '/plants/new')
    await snap(page, '13-nueva-planta')

    // Find first plant
    await go(page, '/plants')
    const plantLink = page.locator('a[href^="/plants/"]').first()
    if (await plantLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      const href = await plantLink.getAttribute('href')
      if (href && !href.includes('/new')) {
        await go(page, href)
        await delay(1000) // extra for charts
        await snap(page, '14-detalle-planta-hero')
        await snap(page, '15-detalle-planta-full', true)

        await go(page, `${href}/readings/new`)
        await snap(page, '16-nueva-lectura')

        await go(page, `${href}/settings`)
        await snap(page, '17-configuracion-planta')
      }
    }

    await go(page, '/settings')
    await snap(page, '18-settings')

    await go(page, '/admin/leads')
    await snap(page, '19-admin-leads')

    await go(page, '/admin/funnel')
    await snap(page, '20-admin-funnel')

    await go(page, '/admin/ui-kit')
    await snap(page, '21-ui-kit-hero')
    await snap(page, '22-ui-kit-full', true)
  }

  // ─── LEGAL ─────────────────────────────────────────────────────────
  console.log('[Legal pages]')

  await go(page, '/terminos')
  await snap(page, '23-terminos')

  await go(page, '/privacidad')
  await snap(page, '24-privacidad')

  await browser.close()
  console.log('\nDone! Screenshots saved to portfolio/v5/')
}

main().catch(console.error)
