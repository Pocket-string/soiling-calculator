/**
 * Portfolio V4 Screenshot Generator
 *
 * Captures the full application after Fase 9 (Marketing & Public Pages Token Migration).
 *
 * Usage: node scripts/portfolio-v4.mjs
 * Requires: dev server running on localhost:3000
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'http://localhost:3000'
const OUTPUT_DIR = join(import.meta.dirname, '..', 'portfolio', 'v4')
const PLANT_ID = '17a0f33e-a177-4d6a-942e-013890d6075a'
const USER_ID = '6d1b95f5-86ae-4ecb-9387-2de8ba0ca8c7'

const SUPABASE_URL = 'https://yduujlxtymhtnxcbwldh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkdXVqbHh0eW1odG54Y2J3bGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTg0NjMsImV4cCI6MjA3ODU3NDQ2M30.JWz-ClcOMMbebdhomZl0V4klS3mhlL_PnRUga3oiTUQ'
const MGMT_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'yduujlxtymhtnxcbwldh'

if (!MGMT_TOKEN) {
  console.error('Error: SUPABASE_ACCESS_TOKEN env var is required.\nRun: node --env-file=.env.local scripts/portfolio-v4.mjs')
  process.exit(1)
}

const VIEWPORT = { width: 1440, height: 900 }
const KNOWN_PASSWORD = 'PortfolioV4_temp!'

mkdirSync(OUTPUT_DIR, { recursive: true })

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Supabase Admin API ──────────────────────────────────────────────

async function getServiceRoleKey() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${MGMT_TOKEN}` }
  })
  if (!res.ok) throw new Error(`Failed to get API keys: ${res.status}`)
  const keys = await res.json()
  const srKey = keys.find(k => k.name === 'service_role')
  if (!srKey) throw new Error('service_role key not found')
  return srKey.api_key
}

async function setUserPassword(serviceRoleKey) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ password: KNOWN_PASSWORD })
  })
  if (!res.ok) throw new Error(`Failed to set password: ${res.status}`)
  console.log('  [OK] Password set for seed user')
}

async function getAuthSession() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: 'admin@soiling.test',
      password: KNOWN_PASSWORD,
    })
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  return await res.json()
}

// ─── Screenshot helpers ──────────────────────────────────────────────

async function safeGoto(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await delay(2500)
  } catch {
    console.log(`  [WARN] Slow load: ${url}`)
    await delay(1500)
  }
}

async function capture(page, name, fullPage = false) {
  const path = join(OUTPUT_DIR, `${name}.png`)
  try {
    await delay(800)
    await page.screenshot({ path, fullPage, timeout: 15000 })
    console.log(`  [OK] ${name}.png`)
    return true
  } catch {
    console.log(`  [FAIL] ${name}.png`)
    return false
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('Portfolio V4 — Screenshot Generator')
  console.log('====================================\n')

  // Step 0: Get a valid session
  console.log('Step 0: Authenticate\n')
  const serviceRoleKey = await getServiceRoleKey()
  await setUserPassword(serviceRoleKey)
  const session = await getAuthSession()
  console.log(`  [OK] Session obtained (expires: ${new Date(session.expires_at * 1000).toISOString()})`)

  const browser = await chromium.launch({ headless: true })

  // Block heavy external resources
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()
  await page.route('**/maps.google.com/**', route => route.abort())
  await page.route('**/maps.googleapis.com/**', route => route.abort())
  await page.route('**/www.google.com/maps/**', route => route.abort())

  // ─── PART 1: Marketing / Public Pages ──────────────────────────

  console.log('\nPart 1: Marketing & Public Pages\n')

  await safeGoto(page, `${BASE_URL}/`)
  await capture(page, '01-landing-hero')

  await safeGoto(page, `${BASE_URL}/`)
  await capture(page, '02-landing-full', true)

  await safeGoto(page, `${BASE_URL}/demo`)
  await delay(2500)
  await capture(page, '03-demo-dashboard')
  await capture(page, '04-demo-full', true)

  await safeGoto(page, `${BASE_URL}/contacto`)
  await capture(page, '05-contacto')

  await safeGoto(page, `${BASE_URL}/servicios`)
  await capture(page, '06-servicios')

  await safeGoto(page, `${BASE_URL}/apply`)
  await capture(page, '07-apply-form')

  // ─── PART 2: Login page ────────────────────────────────────────

  console.log('\nPart 2: Login\n')

  await safeGoto(page, `${BASE_URL}/login`)
  try {
    await page.fill('input[type="email"]', 'admin@soiling.test')
    await page.fill('input[type="password"]', KNOWN_PASSWORD)
  } catch { /* ignore */ }
  await delay(500)
  await capture(page, '08-login')

  // ─── PART 3: Authenticated App ─────────────────────────────────

  console.log('\nPart 3: Authenticated App\n')

  // Authenticate by submitting the login form and waiting for redirect
  try {
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 }),
      page.click('button[type="submit"]'),
    ])
    await delay(2000)
    console.log(`  [OK] Logged in → ${page.url()}`)
  } catch (e) {
    console.log(`  [WARN] Form login did not redirect (${e.message})`)
    console.log('  Trying cookie injection...')

    // Fallback: inject session via cookies
    // The @supabase/ssr library stores the session as a JSON string in cookies
    const cookieName = `sb-${PROJECT_REF}-auth-token`
    const sessionJson = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      token_type: 'bearer',
      expires_in: session.expires_in,
      expires_at: session.expires_at,
      user: session.user,
    })

    // Try chunked cookie format used by @supabase/ssr
    const CHUNK_SIZE = 3180
    const chunks = []
    for (let i = 0; i < sessionJson.length; i += CHUNK_SIZE) {
      chunks.push(sessionJson.substring(i, i + CHUNK_SIZE))
    }

    const cookieBase = {
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }

    if (chunks.length === 1) {
      await context.addCookies([{ ...cookieBase, name: cookieName, value: sessionJson }])
    } else {
      for (let i = 0; i < chunks.length; i++) {
        await context.addCookies([{
          ...cookieBase,
          name: `${cookieName}.${i}`,
          value: chunks[i],
        }])
      }
    }

    console.log(`  Cookie injected (${chunks.length} chunk(s))`)
    await safeGoto(page, `${BASE_URL}/plants`)
    const finalUrl = page.url()
    if (finalUrl.includes('/login')) {
      console.log('  [ERROR] Still redirected to login. Cannot authenticate.')
      console.log('  Authenticated screenshots will be skipped.')
      await browser.close()
      return
    }
    console.log(`  [OK] Cookie auth worked → ${finalUrl}`)
  }

  // 09 - Dashboard / Plants list
  await safeGoto(page, `${BASE_URL}/plants`)
  await capture(page, '09-dashboard-plantas')

  // 10 - Plant detail hero
  await safeGoto(page, `${BASE_URL}/plants/${PLANT_ID}`)
  await delay(3000)
  await capture(page, '10-detalle-planta-hero')

  // 11 - Plant detail full
  await capture(page, '11-detalle-planta-full', true)

  // 12 - Sidebar collapsed
  try {
    const btn = page.locator('aside button').first()
    await btn.click({ timeout: 3000 })
    await delay(800)
    await capture(page, '12-sidebar-colapsado')
    await page.locator('aside button, nav button').first().click({ timeout: 3000 }).catch(() => null)
    await delay(500)
  } catch {
    console.log('  [SKIP] Sidebar collapse')
  }

  // 13 - New reading form
  await safeGoto(page, `${BASE_URL}/plants/${PLANT_ID}/readings/new`)
  await capture(page, '13-nueva-lectura')

  // 14 - Plant settings
  await safeGoto(page, `${BASE_URL}/plants/${PLANT_ID}/settings`)
  await capture(page, '14-configuracion-planta')

  // 15 - Reading history
  await safeGoto(page, `${BASE_URL}/plants/${PLANT_ID}`)
  await delay(2500)
  await page.evaluate(() => {
    const t = document.querySelector('table')
    if (t) t.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
  await delay(500)
  await capture(page, '15-historial-lecturas')

  console.log('\n====================================')
  console.log('Done! Screenshots saved to: portfolio/v4/')

  await browser.close()
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
