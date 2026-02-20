/**
 * Portfolio v5 — Authenticated pages screenshot generator
 * Sets Supabase auth cookies directly in the browser.
 * Usage: node scripts/screenshot-auth.mjs
 */
import { chromium } from 'playwright'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', 'portfolio', 'v5')
const BASE = 'http://localhost:3000'
const PLANT_ID = '17a0f33e-a177-4d6a-942e-013890d6075a'

function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local')
  const content = readFileSync(envPath, 'utf-8')
  const vars = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) vars[match[1].trim()] = match[2].trim()
  }
  return vars
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY
const ref = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || ''

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

async function go(page, path) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  } catch {
    console.log(`    (timeout on ${path}, continuing)`)
  }
  await delay(3000)
}

async function snap(page, name, fullPage = false) {
  const fpath = join(OUTPUT_DIR, `${name}.png`)
  await page.screenshot({ path: fpath, fullPage })
  console.log(`  -> ${name}.png`)
}

async function main() {
  // 1. Create session via Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: { users } } = await supabase.auth.admin.listUsers()
  const targetUser = users.find(u => u.email === 'admin@soiling.test') || users[0]
  console.log(`Target: ${targetUser.email}`)

  // Generate magic link and verify OTP
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink', email: targetUser.email,
  })

  const anonSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data: sessionData, error: verifyErr } = await anonSupabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token, type: 'magiclink',
  })
  if (verifyErr) { console.error('OTP verify failed:', verifyErr.message); process.exit(1) }

  const session = sessionData.session
  console.log('Session obtained.')

  // Ensure user has admin access_level in profiles table
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: targetUser.id, access_level: 'admin' }, { onConflict: 'id' })
  if (profileErr) {
    console.log(`Profile upsert warning: ${profileErr.message} (continuing)`)
  } else {
    console.log('Profile set to admin.')
  }

  // 2. Launch browser with cookies
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  // Navigate to set origin (with retry for cold start)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 })
      break
    } catch {
      console.log(`  (attempt ${attempt}/3 timed out, retrying...)`)
      await delay(5000)
    }
  }
  await delay(500)

  // Inject session into localStorage
  const storageKey = `sb-${ref}-auth-token`
  await page.evaluate(([key, val]) => {
    localStorage.setItem(key, val)
  }, [storageKey, JSON.stringify(session)])

  // Set chunked cookies for SSR
  const cookiePayload = JSON.stringify(session)
  const encoded = Buffer.from(cookiePayload).toString('base64')
  const fullValue = `base64-${encoded}`
  const chunkSize = 3500
  const chunks = []
  for (let i = 0; i < fullValue.length; i += chunkSize) {
    chunks.push(fullValue.substring(i, i + chunkSize))
  }
  const cookies = chunks.map((chunk, i) => ({
    name: `sb-${ref}-auth-token.${i}`,
    value: chunk,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }))
  await context.addCookies(cookies)
  console.log(`Set ${cookies.length} cookie chunks.`)

  // 3. Verify auth
  await go(page, '/plants')
  if (page.url().includes('/login')) {
    console.log('Cookie auth failed, trying alternate approach...')
    // Navigate with hash fragment
    await page.goto(`${BASE}/plants#access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&expires_in=${session.expires_in}`, {
      waitUntil: 'domcontentloaded', timeout: 15000
    })
    await delay(5000)
  }

  const isLoggedIn = !page.url().includes('/login')
  console.log(`Auth: ${isLoggedIn ? 'LOGGED IN' : 'FAILED'}`)
  if (!isLoggedIn) { await browser.close(); process.exit(1) }

  // ─── CAPTURE ───────────────────────────────────────────────────────
  console.log('\n[App pages]')

  // Already on /plants
  await snap(page, '12-dashboard-plantas')

  // Plant detail (use known seed plant ID)
  await go(page, `/plants/${PLANT_ID}`)
  await delay(2000) // extra for charts to render
  await snap(page, '14-detalle-planta-hero')
  await snap(page, '15-detalle-planta-full', true)

  // New reading form
  await go(page, `/plants/${PLANT_ID}/readings/new`)
  await snap(page, '16-nueva-lectura')

  // Plant settings
  await go(page, `/plants/${PLANT_ID}/settings`)
  await snap(page, '17-configuracion-planta')

  // New plant form
  await go(page, '/plants/new')
  await snap(page, '13-nueva-planta')

  // Settings
  await go(page, '/settings')
  await snap(page, '18-settings')

  // Admin: Leads
  await go(page, '/admin/leads')
  await delay(1000)
  console.log(`  URL after /admin/leads: ${page.url()}`)
  await snap(page, '19-admin-leads')

  // Admin: Funnel
  await go(page, '/admin/funnel')
  console.log(`  URL after /admin/funnel: ${page.url()}`)
  await snap(page, '20-admin-funnel')

  // Admin: UI Kit
  await go(page, '/admin/ui-kit')
  console.log(`  URL after /admin/ui-kit: ${page.url()}`)
  await snap(page, '21-ui-kit-hero')
  await snap(page, '22-ui-kit-full', true)

  await browser.close()
  console.log('\nDone!')
}

main().catch(console.error)
