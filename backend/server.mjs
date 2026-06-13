import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const PROJECT_ROOT = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'))
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const PORT = Number(process.env.PORT || 5300)

const state = {
  providers: [
    { id: 'HKP-A', name: 'HK Local Partner A', plan: 'growth', reliability: 96, active: true },
    { id: 'HKP-B', name: 'HK Local Partner B', plan: 'launch', reliability: 91, active: true },
  ],
  requests: [
    {
      id: 'HK-IN-24018', agencyCompany: 'Email verified agency', agencyEmail: 'ops@example-agency.in', originCountry: 'India', originCity: 'Mumbai', destination: 'Hong Kong',
      cargoType: 'General cargo', weightKg: 30, volumeCbm: 0.18, shipDate: '2026-06-15', incoterm: 'FOB', serviceNeeded: 'Customs clearance, warehouse receiving, Hong Kong B2B delivery', transportMode: 'Air', cargo: '30 kg electronic components', bidWindowHours: 24, bidDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'open', orderStatus: null, refusalCount: 0, refusalLimit: 3, coolingOffUntil: null, contactUnlockedForBidId: null,
      legalRecord: null,
      bids: [
        { id: 'BID-1001', providerId: 'HKP-A', provider: 'HK Local Partner A', price: 980, leadTime: 'Same day', remarks: 'Pickup HKG cargo terminal before 16:00', valid: true, createdAt: new Date().toISOString() },
        { id: 'BID-1002', providerId: 'HKP-B', provider: 'HK Local Partner B', price: 1120, leadTime: 'Next day', remarks: 'Includes warehouse receiving', valid: true, createdAt: new Date().toISOString() },
      ],
    },
  ],
  plans: [
    { id: 'viewer', name: 'Viewer', priceHkd: 0, bidCredits: 0, canBid: false, alerts: 'sample only' },
    { id: 'launch', name: 'Launch Pilot', priceHkd: 588, bidCredits: 10, canBid: true, alerts: 'email' },
    { id: 'growth', name: 'Growth Partner', priceHkd: 1488, bidCredits: 40, canBid: true, alerts: 'instant' },
    { id: 'enterprise', name: 'Enterprise', priceHkd: null, bidCredits: 120, canBid: true, alerts: 'priority' },
  ],
}

function send(response, statusCode, payload) {
  response.writeHead(statusCode, {'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type'})
  response.end(JSON.stringify(payload, null, 2))
}
async function readJsonFile(file, fallback) { try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch { return fallback } }
async function readBody(request) { const chunks=[]; for await (const chunk of request) chunks.push(chunk); return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {} }
function isValidEmail(email='') { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) }
function providerRank(providerId) { const provider = state.providers.find((item) => item.id === providerId); return provider ? provider.reliability : 0 }
function findRequest(id) { return state.requests.find((row) => row.id === id) }
function publicRequest(request) { return { id: request.id, originCountry: request.originCountry, originCity: request.originCity, destination: request.destination, cargoType: request.cargoType, weightKg: request.weightKg, volumeCbm: request.volumeCbm, shipDate: request.shipDate, incoterm: request.incoterm, serviceNeeded: request.serviceNeeded, transportMode: request.transportMode, cargo: request.cargo, bidWindowHours: request.bidWindowHours, bidDeadline: request.bidDeadline, status: request.status, orderStatus: request.orderStatus, bidCount: request.bids.length, refusalCount: request.refusalCount, refusalLimit: request.refusalLimit, coolingOffUntil: request.coolingOffUntil, sealedBidVisibility: 'providers_cannot_see_competitor_prices', agency: request.agencyEmail ? 'Email verified agency' : 'Email pending' } }
function agencyRequest(request) { return { ...publicRequest(request), agencyEmail: request.agencyEmail, bids: request.bids.map((bid) => ({ ...bid })) } }
function chooseLowestValidBid(request) { return request.bids.filter((bid) => bid.valid && Number.isFinite(Number(bid.price)) && Number(bid.price) > 0).sort((a,b) => Number(a.price) - Number(b.price) || providerRank(b.providerId) - providerRank(a.providerId) || new Date(a.createdAt) - new Date(b.createdAt))[0] || null }
function createLegalRecord(request, bid) { return { requestId: request.id, acceptedBidId: bid.id, acceptedPrice: bid.price, provider: bid.provider, serviceScope: request.serviceNeeded, cargoDeclaration: request.cargo, platformRole: 'workflow_platform_not_carrier_of_record', agencyResponsibility: 'truthful_legal_complete_cargo_information', providerResponsibility: 'pickup_handling_delivery_pod_under_accepted_bid', cancellationRule: 'agency_cooling_off_and_provider_reliability_score_apply', disputeProcess: 'platform_record_review_then_party_resolution', createdAt: new Date().toISOString() } }

async function router(request, response) {
  if (request.method === 'OPTIONS') return send(response, 200, { ok: true })
  const url = new URL(request.url, `http://${request.headers.host}`)
  if (request.method === 'GET' && url.pathname === '/api/health') return send(response, 200, { ok: true, service: 'LBID backend', port: PORT })
  if (request.method === 'GET' && url.pathname === '/api/leads') { const leads = await readJsonFile(path.join(DATA_DIR, 'agency_leads_email_only.json'), []); return send(response, 200, { leads, emailOnly: true, count: leads.length }) }
  if (request.method === 'GET' && url.pathname === '/api/lead-summary') return send(response, 200, await readJsonFile(path.join(DATA_DIR, 'scrape_summary.json'), { totalEmailLeads: 0, emailOnly: true }))
  if (request.method === 'GET' && url.pathname === '/api/requests') return send(response, 200, { requests: state.requests.map(publicRequest) })
  if (request.method === 'GET' && url.pathname === '/api/plans') return send(response, 200, { plans: state.plans })

  if (request.method === 'POST' && url.pathname === '/api/requests') {
    const body = await readBody(request)
    if (!isValidEmail(body.agencyEmail)) return send(response, 400, { error: 'agency_email_required', message: 'A valid agency email is required before publishing.' })
    const bidWindowHours = [24, 48].includes(Number(body.bidWindowHours)) ? Number(body.bidWindowHours) : 24
    const item = { id: `REQ-${randomUUID().slice(0,8).toUpperCase()}`, agencyCompany: body.agencyCompany || 'Unverified agency', agencyEmail: body.agencyEmail, originCountry: body.originCountry || 'Malaysia', originCity: body.originCity || '', destination: body.destination || 'Hong Kong', cargoType: body.cargoType || 'General cargo', weightKg: Number(body.weightKg) || 0, volumeCbm: Number(body.volumeCbm) || 0, shipDate: body.shipDate || '', incoterm: body.incoterm || 'FOB', serviceNeeded: body.serviceNeeded || 'Hong Kong local delivery', transportMode: body.transportMode || 'Air', cargo: body.cargo || '', bidWindowHours, bidDeadline: new Date(Date.now() + bidWindowHours * 60 * 60 * 1000).toISOString(), status: 'manual_review', orderStatus: null, refusalCount: 0, refusalLimit: 3, coolingOffUntil: null, contactUnlockedForBidId: null, legalRecord: null, bids: [] }
    state.requests.unshift(item)
    return send(response, 201, { request: publicRequest(item), nextStep: 'manual_review_before_bid_board' })
  }

  const bidMatch = url.pathname.match(/^\/api\/requests\/([^/]+)\/bids$/)
  if (request.method === 'POST' && bidMatch) {
    const item = findRequest(bidMatch[1]); if (!item) return send(response, 404, { error: 'request_not_found' })
    if (item.status !== 'open') return send(response, 409, { error: 'request_not_open_for_bids' })
    const body = await readBody(request); const price = Number(body.price)
    if (!body.providerId || !body.provider || !Number.isFinite(price) || price <= 0) return send(response, 400, { error: 'provider_and_price_required' })
    if (item.bids.some((bid) => bid.providerId === body.providerId)) return send(response, 409, { error: 'one_shot_bid_already_submitted' })
    const bid = { id: `BID-${randomUUID().slice(0,8).toUpperCase()}`, providerId: body.providerId, provider: body.provider, price, leadTime: body.leadTime || '', remarks: body.remarks || '', valid: price >= 50, createdAt: new Date().toISOString() }
    item.bids.push(bid)
    return send(response, 201, { bid: { id: bid.id, valid: bid.valid, createdAt: bid.createdAt }, visibility: 'sealed_from_other_providers', editable: false })
  }

  const publishMatch = url.pathname.match(/^\/api\/admin\/requests\/([^/]+)\/publish$/)
  if (request.method === 'POST' && publishMatch) {
    const item = findRequest(publishMatch[1]); if (!item) return send(response, 404, { error: 'request_not_found' })
    if (!isValidEmail(item.agencyEmail)) return send(response, 409, { error: 'agency_email_required_before_publish' })
    item.status = 'open'
    item.bidDeadline = new Date(Date.now() + (item.bidWindowHours || 24) * 60 * 60 * 1000).toISOString()
    return send(response, 200, { request: publicRequest(item), published: true, bidWindowHours: item.bidWindowHours || 24 })
  }
  const awardMatch = url.pathname.match(/^\/api\/requests\/([^/]+)\/auto-award$/)
  if (request.method === 'POST' && awardMatch) {
    const item = findRequest(awardMatch[1]); if (!item) return send(response, 404, { error: 'request_not_found' })
    const body = await readBody(request)
    if (new Date(item.bidDeadline) > new Date() && !body.force) return send(response, 409, { error: 'bid_window_still_open' })
    const bid = chooseLowestValidBid(item); if (!bid) return send(response, 409, { error: 'no_valid_bid' })
    item.status = 'bid_accepted'; item.orderStatus = 'Bid Accepted'; item.contactUnlockedForBidId = bid.id; item.legalRecord = createLegalRecord(item, bid)
    return send(response, 200, { winner: { bidId: bid.id, provider: bid.provider, price: bid.price }, contactUnlocked: true, legalRecord: item.legalRecord })
  }

  const refusalMatch = url.pathname.match(/^\/api\/agency\/requests\/([^/]+)\/refuse-award$/)
  if (request.method === 'POST' && refusalMatch) {
    const item = findRequest(refusalMatch[1]); if (!item) return send(response, 404, { error: 'request_not_found' })
    const body = await readBody(request); if (!body.reason) return send(response, 400, { error: 'refusal_reason_required' })
    if (item.refusalCount >= item.refusalLimit) return send(response, 409, { error: 'refusal_limit_reached_manual_review_required' })
    item.refusalCount += 1; item.status = item.refusalCount >= item.refusalLimit ? 'manual_review' : 'open'; item.contactUnlockedForBidId = null; item.legalRecord = null
    return send(response, 200, { refusalCount: item.refusalCount, remaining: item.refusalLimit - item.refusalCount, status: item.status })
  }

  const cancelMatch = url.pathname.match(/^\/api\/agency\/requests\/([^/]+)\/cancel$/)
  if (request.method === 'POST' && cancelMatch) {
    const item = findRequest(cancelMatch[1]); if (!item) return send(response, 404, { error: 'request_not_found' })
    item.status = 'cancelled'; item.coolingOffUntil = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    return send(response, 200, { status: item.status, coolingOffUntil: item.coolingOffUntil, repostBlocked: true })
  }

  return send(response, 404, { error: 'not_found' })
}

const server = http.createServer((request, response) => router(request, response).catch((error) => send(response, 500, { error: 'internal_error', message: error.message })))
server.listen(PORT, '127.0.0.1', () => console.log(`LBID backend listening on http://127.0.0.1:${PORT}`))
