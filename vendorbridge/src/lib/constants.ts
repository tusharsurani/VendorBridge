export const APP_NAME = 'VendorBridge'
export const APP_TAGLINE = 'Smart Procurement for Modern Teams'

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  VENDORS: '/vendors',
  VENDOR_DETAIL: '/vendors/:id',
  RFQS: '/rfqs',
  CREATE_RFQ: '/rfqs/create',
  RFQ_DETAIL: '/rfqs/:id',
  RFQ_COMPARE: '/rfqs/:id/compare',
  SUBMIT_QUOTATION: '/quotations/submit/:rfqId',
  APPROVALS: '/approvals',
  PURCHASE_ORDERS: '/purchase-orders',
  PO_DETAIL: '/purchase-orders/:id',
  INVOICES: '/invoices',
  INVOICE_DETAIL: '/invoices/:id',
  ACTIVITY: '/activity',
  REPORTS: '/reports',
} as const

export const GST_RATE = 0.18
export const CGST_RATE = 0.09
export const SGST_RATE = 0.09

export const VENDOR_CATEGORIES = [
  'IT Equipment',
  'Office Supplies',
  'Industrial',
  'Logistics',
  'Facility Management',
  'Raw Materials',
  'Services',
  'Other',
] as const

export const UNITS = ['pcs', 'kg', 'ltr', 'box', 'set', 'hrs', 'sqft', 'mt'] as const

export const DEMO_ACCOUNTS = [
  { label: 'Admin', emoji: '👤', email: 'admin@vendorbridge.com', password: 'demo123', role: 'admin' },
  { label: 'Procurement Officer', emoji: '📋', email: 'officer@vendorbridge.com', password: 'demo123', role: 'procurement_officer' },
  { label: 'Manager', emoji: '✅', email: 'manager@vendorbridge.com', password: 'demo123', role: 'manager' },
  { label: 'Vendor', emoji: '🏪', email: 'vendor@techsupply.com', password: 'demo123', role: 'vendor' },
] as const
