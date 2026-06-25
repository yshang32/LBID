type DemoRequest = {
  id: string
  agent_id?: string
  route: { origin: string; destination: string }
  cargo_details: {
    cargo: string
    cargo_type: string
    mode: string
    weight_kg: number
    cbm: number
  }
  services_needed: string[]
  bid_deadline: string
  status: string
  created_at: string
}

function inMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

function agoHours(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export function getDemoWorkspace() {
  const opportunities: DemoRequest[] = [
    {
      id: "DEMO-SR-HCM-HKG",
      agent_id: "demo-agency-a",
      route: { origin: "Ho Chi Minh City", destination: "Hong Kong" },
      cargo_details: { cargo: "Consumer electronics", cargo_type: "General cargo", mode: "Air", weight_kg: 500, cbm: 3 },
      services_needed: ["Airport pickup", "Import customs", "Local delivery"],
      bid_deadline: inMinutes(13),
      status: "OPEN",
      created_at: agoHours(2),
    },
    {
      id: "DEMO-SR-SHA-SIN",
      agent_id: "demo-agency-b",
      route: { origin: "Shanghai", destination: "Singapore" },
      cargo_details: { cargo: "Retail cartons", cargo_type: "General cargo", mode: "Sea", weight_kg: 2100, cbm: 14 },
      services_needed: ["Freight forwarding", "Warehouse"],
      bid_deadline: inMinutes(260),
      status: "OPEN",
      created_at: agoHours(5),
    },
    {
      id: "DEMO-SR-BKK-TYO",
      agent_id: "demo-agency-c",
      route: { origin: "Bangkok", destination: "Tokyo" },
      cargo_details: { cargo: "Cold chain samples", cargo_type: "Cold chain", mode: "Air", weight_kg: 320, cbm: 2.1 },
      services_needed: ["Cold chain handling", "Airport delivery"],
      bid_deadline: inMinutes(55),
      status: "OPEN",
      created_at: agoHours(1),
    },
    {
      id: "DEMO-SR-SZX-LON",
      agent_id: "demo-agency-d",
      route: { origin: "Shenzhen", destination: "London" },
      cargo_details: { cargo: "Garments", cargo_type: "General cargo", mode: "Sea", weight_kg: 8500, cbm: 42 },
      services_needed: ["Export handling", "Consolidation"],
      bid_deadline: inMinutes(1440),
      status: "OPEN",
      created_at: agoHours(8),
    },
  ]

  return {
    demoMode: true,
    role: "company",
    profile: {
      company_name_en: "Pacific Forward Ltd.",
      company_name_zh: "Pacific Forward Ltd.",
      token_balance_free: 8,
      token_balance_paid: 16,
      onboarding_completed: true,
      can_be_client: true,
      can_be_forwarder: true,
      service_routes: ["Vietnam -> Hong Kong", "Malaysia -> Hong Kong", "India -> Hong Kong"],
      service_types: ["Air Freight", "Sea Freight", "Customs Clearance", "Local Delivery"],
    },
    ownRequests: [
      {
        id: "DEMO-SR-MNL-HKG",
        route: { origin: "Manila", destination: "Hong Kong" },
        cargo_details: { cargo: "Beauty products", cargo_type: "General cargo", mode: "Air", weight_kg: 760, cbm: 5 },
        services_needed: ["Import customs", "Local delivery"],
        bid_deadline: inMinutes(180),
        status: "OPEN",
        created_at: agoHours(3),
      },
      {
        id: "DEMO-SR-KUL-HKG",
        route: { origin: "Kuala Lumpur", destination: "Hong Kong" },
        cargo_details: { cargo: "Spare parts", cargo_type: "General cargo", mode: "Air", weight_kg: 420, cbm: 2.8 },
        services_needed: ["Airport pickup", "Delivery"],
        bid_deadline: inMinutes(-30),
        status: "CLOSED",
        created_at: agoHours(9),
      },
    ],
    opportunities,
    recommendations: [
      {
        id: "DEMO-REC-HCM",
        shipment_request_id: "DEMO-SR-HCM-HKG",
        match_score: 94,
        status: "PUSHED",
        reasons: [
          "Air cargo capacity over 400 kg verified",
          "SGN -> HKG active route on record",
          "4.9 average rating on Hong Kong deliveries",
          "IATA cargo agent certification confirmed",
        ],
        shipment_requests: opportunities[0],
      },
      {
        id: "DEMO-REC-BKK",
        shipment_request_id: "DEMO-SR-BKK-TYO",
        match_score: 78,
        status: "PUSHED",
        reasons: ["Cold chain handling listed in company capabilities", "Fast response history under 20 minutes"],
        shipment_requests: opportunities[2],
      },
    ],
    orders: [
      { id: "DEMO-ORDER-1008", status: "in_transit", created_at: agoHours(22) },
      { id: "DEMO-ORDER-1007", status: "customs_cleared", created_at: agoHours(34) },
    ],
    bids: [
      { id: "DEMO-BID-8801", sr_id: "DEMO-SR-HCM-HKG", price: 24800, currency: "HKD", transit_time: "1 day", submitted_at: agoHours(1) },
      { id: "DEMO-BID-8798", sr_id: "DEMO-SR-BKK-TYO", price: 18200, currency: "HKD", transit_time: "2 days", submitted_at: agoHours(4) },
    ],
    bidCountByRequest: { "DEMO-SR-MNL-HKG": 3, "DEMO-SR-KUL-HKG": 7 },
    documentTypesByOrder: { "DEMO-ORDER-1008": ["invoice", "packing_list"], "DEMO-ORDER-1007": ["awb", "invoice", "packing_list"] },
  }
}

export function isWorkspaceEmpty(workspace: any) {
  if (!workspace) return true
  return !(
    workspace.ownRequests?.length ||
    workspace.opportunities?.length ||
    workspace.orders?.length ||
    workspace.recommendations?.length ||
    workspace.bids?.length
  )
}
