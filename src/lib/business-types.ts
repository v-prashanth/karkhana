export type BusinessType =
  | 'water_heating'
  | 'solar'
  | 'hvac'
  | 'interior'
  | 'machine_shop'
  | 'electrical'
  | 'generic_service'

export type BusinessTypeConfig = {
  id: BusinessType
  label: string
  description: string
  icon: string
  modules: string[]
  primaryWorkflow: string
}

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
  {
    id: 'water_heating',
    label: 'Water Heating & Plumbing',
    description: 'Geysers, heat pumps, water treatment',
    icon: '💧',
    modules: [
      'leads', 'quotations', 'invoices',
      'installations', 'warranty', 'amc',
      'service_requests'
    ],
    primaryWorkflow: 'Lead → Site Visit → Quote → Install → Warranty → AMC'
  },
  {
    id: 'solar',
    label: 'Solar Energy',
    description: 'Solar panels, inverters, batteries',
    icon: '☀️',
    modules: [
      'leads', 'quotations', 'invoices',
      'installations', 'warranty', 'amc'
    ],
    primaryWorkflow: 'Lead → Survey → Quote → Install → Warranty → AMC'
  },
  {
    id: 'hvac',
    label: 'HVAC / Air Conditioning',
    description: 'AC installation, maintenance, repair',
    icon: '❄️',
    modules: [
      'leads', 'quotations', 'invoices',
      'installations', 'warranty',
      'service_requests'
    ],
    primaryWorkflow: 'Lead → Site Visit → Quote → Install → Service'
  },
  {
    id: 'interior',
    label: 'Interior Design / Contracting',
    description: 'Interior fit-out, renovation, design',
    icon: '🏠',
    modules: [
      'leads', 'quotations', 'invoices',
      'projects', 'stages', 'handover'
    ],
    primaryWorkflow: 'Lead → Design → Quote → Execute → Handover'
  },
  {
    id: 'machine_shop',
    label: 'Machine Shop / Fabrication',
    description: 'Precision machining, fabrication, CNC',
    icon: '⚙️',
    modules: [
      'orders', 'delivery_challans',
      'invoices', 'payments'
    ],
    primaryWorkflow: 'Order → Production → DC → Invoice'
  },
  {
    id: 'electrical',
    label: 'Electrical Contracting',
    description: 'Wiring, panels, industrial electrical',
    icon: '⚡',
    modules: [
      'leads', 'quotations', 'invoices',
      'installations', 'certificates'
    ],
    primaryWorkflow: 'Lead → Survey → Quote → Install → Certificate'
  },
  {
    id: 'generic_service',
    label: 'Other Service Business',
    description: 'Any service-based or project business',
    icon: '🔧',
    modules: [
      'leads', 'quotations',
      'invoices', 'payments'
    ],
    primaryWorkflow: 'Lead → Quote → Execute → Invoice'
  }
]

export function getBusinessType(id: BusinessType): BusinessTypeConfig {
  return BUSINESS_TYPES.find(t => t.id === id)
    ?? BUSINESS_TYPES[BUSINESS_TYPES.length - 1]
}
