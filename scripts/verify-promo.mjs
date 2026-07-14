/**
 * Drive the promo homepage headlessly and capture proof screenshots.
 *
 * Usage: node scripts/verify-promo.mjs <baseUrl> <outDir>
 * Captures the journey at key scroll positions (forward + reverse), checks the
 * Login button stays visible, that no login form exists on the homepage, and
 * that clicking Login opens the auth interface.
 */
import fs from "node:fs"
import path from "node:path"
import { chromium } from "playwright"

const baseUrl = process.argv[2] ?? "http://127.0.0.1:5301"
const outDir = process.argv[3] ?? "promo-verify"
fs.mkdirSync(outDir, { recursive: true })

const positions = [
  ["01-hero", 0],
  ["02-air", 0.14],
  ["03-air-ocean-seam", 0.27],
  ["04-ocean", 0.36],
  ["05-ocean-road-seam", 0.49],
  ["06-road", 0.58],
  ["07-road-warehouse-seam", 0.7],
  ["08-warehouse", 0.82],
  ["09-cta", 0.985],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text())
})
page.on("pageerror", (err) => errors.push(String(err)))

await page.goto(baseUrl + "/zh", { waitUntil: "networkidle" })
await page.waitForSelector("canvas", { timeout: 15000 })

// No login form on the promo homepage.
const pwFields = await page.locator("input[type=password], input[type=email]").count()
console.log("login form fields on homepage:", pwFields)

// Warm the frame cache, then wait for buffering to settle.
await page.mouse.wheel(0, 200)
await page.waitForTimeout(6000)
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(1200)

async function scrollHeight() {
  return page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
}

const max = await scrollHeight()
const loginChecks = []
for (const [name, p] of positions) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(max * p))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(outDir, `${name}.png`) })
  const box = await page.locator("[data-testid=promo-login]").boundingBox()
  loginChecks.push(`${name}: login ${box ? `visible @ ${Math.round(box.x)},${Math.round(box.y)}` : "MISSING"}`)
}

// Reverse journey: bottom → middle → top.
for (const [name, p] of [
  ["10-reverse-road", 0.58],
  ["11-reverse-ocean", 0.36],
  ["12-reverse-hero", 0],
]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(max * p))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(outDir, `${name}.png`) })
}

console.log(loginChecks.join("\n"))

// Login interface only appears after clicking Login.
await page.locator("[data-testid=promo-login]").click()
await page.locator('[role="dialog"]').waitFor({ state: "visible", timeout: 20000 })
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(outDir, "13-after-login-click.png") })
console.log("auth dialog visible:", await page.locator('[role="dialog"]').isVisible())

console.log("console errors:", errors.length ? errors.join("\n") : "none")
await browser.close()
