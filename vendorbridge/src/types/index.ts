export type UserRole = 'admin' | 'procurement_officer' | 'manager' | 'vendor'
export type VendorStatus = 'active' | 'inactive' | 'pending'
export type RFQStatus = 'draft' | 'published' | 'closed' | 'cancelled'
export type QuotationStatus = 'draft' | 'submitted' | 'accepted' | 'rejected'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type POStatus = 'draft' | 'sent' | 'acknowledged' | 'completed'
export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  company_name: string | null
  phone: string | null
  created_at: string
}

export interface Vendor {
  id: string
  company_name: string
  contact_person: string
  email: string
  phone: string | null
  gst_number: string | null
  category: string
  address: string | null
  city: string | null
  state: string | null
  status: VendorStatus
  rating: number
  notes: string | null
  user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RFQ {
  id: string
  rfq_number: string
  title: string
  description: string | null
  deadline: string
  status: RFQStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RFQItem {
  id: string
  rfq_id: string
  product_name: string
  description: string | null
  quantity: number
  unit: string
  specifications: string | null
}

export interface RFQVendor {
  id: string
  rfq_id: string
  vendor_id: string
  invited_at: string
  status: string
  vendor?: Vendor
}

export interface Quotation {
  id: string
  rfq_id: string
  vendor_id: string
  total_amount: number
  delivery_days: number | null
  validity_days: number
  notes: string | null
  status: QuotationStatus
  submitted_at: string | null
  created_at: string
  vendor?: Vendor
  rfq?: RFQ
}

export interface QuotationItem {
  id: string
  quotation_id: string
  rfq_item_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Approval {
  id: string
  rfq_id: string | null
  quotation_id: string | null
  approver_id: string | null
  status: ApprovalStatus
  remarks: string | null
  requested_at: string
  decided_at: string | null
  quotation?: Quotation & { vendor?: Vendor; items?: QuotationItem[] }
  rfq?: RFQ
}

export interface PurchaseOrder {
  id: string
  po_number: string
  rfq_id: string | null
  quotation_id: string | null
  vendor_id: string | null
  subtotal: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  status: POStatus
  delivery_address: string | null
  payment_terms: string
  created_by: string | null
  created_at: string
  vendor?: Vendor
  rfq?: RFQ
  quotation?: Quotation & { items?: QuotationItem[] }
}

export interface Invoice {
  id: string
  invoice_number: string
  po_id: string | null
  vendor_id: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  status: InvoiceStatus
  due_date: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  vendor?: Vendor
  purchase_order?: PurchaseOrder
}

export interface ActivityLog {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_label: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
  hideFor?: UserRole[]
}

export interface KPIData {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend?: string
}

export interface ComparisonRow {
  product_name: string
  rfq_item_id: string
  quantities: Record<string, number>
  prices: Record<string, number>
  lowestVendorId: string | null
}

export interface ChartDataPoint {
  name: string
  value: number
  month?: string
}

export interface VendorFormData {
  company_name: string
  contact_person: string
  email: string
  phone?: string
  gst_number?: string
  category: string
  address?: string
  city?: string
  state?: string
  notes?: string
}

export interface RFQFormItem {
  product_name: string
  description?: string
  quantity: number
  unit: string
  specifications?: string
}

export interface RFQWithDetails extends RFQ {
  items?: RFQItem[]
  vendors?: RFQVendor[]
  quotations?: Quotation[]
  quote_count?: number
}

export interface VendorPerformance {
  vendor_id: string
  company_name: string
  quotes_submitted: number
  quotes_won: number
  win_rate: number
  avg_delivery: number
  total_spend: number
}

export interface RFQAttachment {
  id: string
  rfq_id: string
  file_name: string
  file_path: string
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}
