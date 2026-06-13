import fs from 'node:fs/promises'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'))
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const PUBLIC_DATA_DIR = path.join(PROJECT_ROOT, 'public', 'data')

const sources = [
  ['India', 'IN', 'https://fiata.org/directory/in/'],
  ['Malaysia', 'MY', 'https://fiata.org/directory/my/'],
  ['Indonesia', 'ID', 'https://fiata.org/directory/id/'],
  ['Philippines', 'PH', 'https://fiata.org/directory/ph/'],
  ['Vietnam', 'VN', 'https://fiata.org/directory/vn/'],
  ['Cambodia', 'KH', 'https://fiata.org/directory/kh/'],
  ['Bangladesh', 'BD', 'https://fiata.org/directory/bd/'],
]

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
  return [key, value]
}))
const perCountryLimit = Number(args.get('per-country-limit') || 80)

function normalizeWhitespace(value = '') {
  return value.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function decodeEntities(value = '') {
  return normalizeWhitespace(value)
    .replace(/&#64;|&#x40;/gi, '@')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#160;/g, ' ')
}

function decodeCfEmail(encoded = '') {
  if (!/^[a-f0-9]+$/i.test(encoded) || encoded.length < 4) return ''
  const key = parseInt(encoded.slice(0, 2), 16)
  let email = ''
  for (let index = 2; index < encoded.length; index += 2) {
    email += String.fromCharCode(parseInt(encoded.slice(index, index + 2), 16) ^ key)
  }
  return email.toLowerCase()
}

function stripTags(html = '') {
  return decodeEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?|<\/p>|<\/div>|<\/li>|<\/h\d>|<\/dd>|<\/dt>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
}

function extractEmails(raw = '') {
  const decoded = decodeEntities(raw)
  const candidates = new Set()
  for (const match of decoded.matchAll(/data-cfemail=["']([a-f0-9]+)["']/gi)) {
    const email = decodeCfEmail(match[1])
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.includes('@fiata.org')) candidates.add(email)
  }
  for (const match of decoded.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = match[0].toLowerCase().replace(/[),.;:]+$/g, '')
    if (!email.includes('example.') && !email.includes('@fiata.org')) candidates.add(email)
  }
  for (const match of decoded.matchAll(/mailto:([^"'\s>]+)/gi)) {
    const email = decodeURIComponent(match[1]).split('?')[0].toLowerCase()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.includes('@fiata.org')) candidates.add(email)
  }
  return [...candidates]
}

function extractFirst(pattern, text) {
  const match = text.match(pattern)
  return match ? normalizeWhitespace(match[1]) : ''
}

function scoreLead(lead) {
  let score = 50
  if (lead.email) score += 30
  if (lead.website) score += 10
  if (lead.phone) score += 5
  if (lead.city) score += 5
  if (/^(info|sales|cs|enquiry|inquiry|ops|operation|contact|admin|export|import|patricia|marketing)@/i.test(lead.email)) score += 5
  return Math.min(score, 100)
}

function parseFiata(html, country, countryCode, sourceUrl) {
  const cardBlocks = [...html.matchAll(/<li[\s\S]*?<\/li>/gi)].map((match) => match[0])
  const blocks = cardBlocks.length ? cardBlocks : html.split(/<h3[^>]*>|###/i).slice(1)
  const leads = []

  for (const block of blocks) {
    const emails = extractEmails(block)
    if (emails.length === 0) continue

    const h3Match = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)
    const text = stripTags(block)
    const lines = text.split('\n').map(normalizeWhitespace).filter(Boolean)
    const company = normalizeWhitespace(stripTags(h3Match ? h3Match[1] : (lines[0] || '')))
    if (!company || /responsible persons|postal address|members in|email|call|website/i.test(company)) continue

    const website = extractFirst(/website\s+((?:https?:\/\/|www\.)[^\s]+)/i, text)
    const phone = extractFirst(/(?:tel\.|phone|call)\s+([+()0-9\s-]{7,})/i, text)
    const cityLine = lines.find((line) => /\b[A-Z][A-Z\s-]{2,}\b/.test(line) && !/email|website|postal address|responsible|individual members|association members/i.test(line)) || ''
    const lead = {
      id: `${countryCode}-${company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}`,
      company,
      country,
      countryCode,
      city: cityLine.slice(0, 80),
      email: emails[0],
      allEmails: emails.join('; '),
      website: website.replace(/^http:\/\/Https:\/\//i, 'https://'),
      phone,
      source: 'FIATA members directory',
      sourceUrl,
      serviceFit: 'Freight forwarding / logistics agency',
      hasEmail: true,
      emailGate: 'passed',
      complianceStatus: 'ready_for_manual_review',
      quality: 0,
      lastCheckedAt: new Date().toISOString(),
    }
    lead.quality = scoreLead(lead)
    leads.push(lead)
  }

  return leads
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'ForwardFlowLeadResearch/0.1 (+manual-review; no-email-send)',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.text()
}

function dedupe(leads) {
  const seen = new Map()
  for (const lead of leads) {
    const key = lead.email || `${lead.countryCode}:${lead.company.toLowerCase()}`
    const existing = seen.get(key)
    if (!existing || lead.quality > existing.quality) seen.set(key, lead)
  }
  return [...seen.values()].sort((a, b) => b.quality - a.quality || a.country.localeCompare(b.country))
}

function toCsv(rows) {
  const headers = ['company','country','city','email','allEmails','website','phone','quality','source','sourceUrl','serviceFit','complianceStatus','lastCheckedAt']
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n')
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true })

  const allLeads = []
  const sourceSummary = []
  for (const [country, countryCode, url] of sources) {
    try {
      const html = await fetchText(url)
      const parsed = parseFiata(html, country, countryCode, url).slice(0, perCountryLimit)
      allLeads.push(...parsed)
      sourceSummary.push({ country, countryCode, sourceUrl: url, leadsWithEmail: parsed.length, status: 'ok' })
      console.log(`${country}: ${parsed.length} email leads`)
      await new Promise((resolve) => setTimeout(resolve, 800))
    } catch (error) {
      sourceSummary.push({ country, countryCode, sourceUrl: url, leadsWithEmail: 0, status: 'error', error: error.message })
      console.error(`${country}: ${error.message}`)
    }
  }

  const leads = dedupe(allLeads)
  const summary = {
    generatedAt: new Date().toISOString(),
    totalEmailLeads: leads.length,
    countries: Object.fromEntries(sources.map(([country]) => [country, leads.filter((lead) => lead.country === country).length])),
    emailOnly: true,
    sources: sourceSummary,
  }

  await fs.writeFile(path.join(DATA_DIR, 'agency_leads_email_only.json'), JSON.stringify(leads, null, 2))
  await fs.writeFile(path.join(DATA_DIR, 'agency_leads_email_only.csv'), toCsv(leads))
  await fs.writeFile(path.join(DATA_DIR, 'scrape_summary.json'), JSON.stringify(summary, null, 2))
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'agency_leads.json'), JSON.stringify(leads, null, 2))
  await fs.writeFile(path.join(PUBLIC_DATA_DIR, 'lead_summary.json'), JSON.stringify(summary, null, 2))

  console.log(`Saved ${leads.length} email-only leads`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})