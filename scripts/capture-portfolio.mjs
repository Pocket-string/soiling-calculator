/**
 * Captures portfolio screenshots from the live site using Puppeteer.
 * Usage: node scripts/capture-portfolio.mjs
 */

import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'portfolio')
const BASE = 'https://soilingcalc.com'

const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }

async function main() {
  await mkdir(outDir, { recursive: true })

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  // Helper: full-page screenshot
  async function snap(url, name, viewport = DESKTOP, fullPage = true) {
    try {
      await page.setViewport(viewport)
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)))
      const path = resolve(outDir, `${name}.png`)
      await page.screenshot({ path, fullPage })
      console.log(`  OK: ${name}.png`)
    } catch (err) {
      console.log(`  FAIL: ${name} — ${err.message}`)
    }
  }

  // Helper: scroll to element and capture a region via clip
  async function snapSection(url, selector, name, viewport = DESKTOP) {
    try {
      await page.setViewport(viewport)
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
      await page.evaluate(() => new Promise(r => setTimeout(r, 1500)))

      const box = await page.evaluate((sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return {
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
          width: rect.width,
          height: rect.height,
        }
      }, selector)

      if (box && box.width > 0 && box.height > 0) {
        const path = resolve(outDir, `${name}.png`)
        await page.screenshot({ path, clip: box })
        console.log(`  OK: ${name}.png (section)`)
      } else {
        console.log(`  SKIP: ${name} — selector "${selector}" not found or empty`)
      }
    } catch (err) {
      console.log(`  FAIL: ${name} — ${err.message}`)
    }
  }

  console.log('Capturing portfolio screenshots...\n')

  // 1. Landing page
  console.log('Landing page:')
  await snap(BASE, '01-landing-desktop')
  await snap(BASE, '02-landing-mobile', MOBILE)

  // 2. Demo page — full
  console.log('\nDemo page:')
  await snap(`${BASE}/demo`, '03-demo-full-desktop')
  await snap(`${BASE}/demo`, '04-demo-full-mobile', MOBILE)

  // 3. Demo — above the fold (viewport only)
  await snap(`${BASE}/demo`, '05-demo-hero-desktop', DESKTOP, false)

  // 4. Demo — charts section
  console.log('\nDemo sections:')
  await snapSection(`${BASE}/demo`, '.grid.grid-cols-1.lg\\:grid-cols-2', '06-demo-charts')

  // 5. Demo — readings table container
  await snapSection(`${BASE}/demo`, '.overflow-x-auto', '07-demo-readings-table')

  // 6. Apply page
  console.log('\nApply page:')
  await snap(`${BASE}/apply`, '08-apply-desktop')
  await snap(`${BASE}/apply`, '09-apply-mobile', MOBILE)

  await browser.close()
  console.log(`\nDone! Screenshots saved to: ${outDir}`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
