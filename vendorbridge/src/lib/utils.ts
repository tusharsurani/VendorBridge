import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format as dateFnsFormat } from 'date-fns'
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFnsFormat(d, 'd MMM yyyy')
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

export async function generateRFQNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_rfq_number')
  if (error || !data) {
    const year = new Date().getFullYear()
    const seq = Math.floor(1000 + Math.random() * 9000)
    return `RFQ-${year}-${seq}`
  }
  return data as string
}

export async function generatePONumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_po_number')
  if (error || !data) {
    const year = new Date().getFullYear()
    const seq = Math.floor(2000 + Math.random() * 9000)
    return `PO-${year}-${seq}`
  }
  return data as string
}

export async function generateInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('next_invoice_number')
  if (error || !data) {
    const year = new Date().getFullYear()
    const seq = Math.floor(3000 + Math.random() * 9000)
    return `INV-${year}-${seq}`
  }
  return data as string
}

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function convertHundreds(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ones[n]
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '')
}

function convertIndian(n: number): string {
  if (n === 0) return ''
  if (n < 1000) return convertHundreds(n)
  if (n < 100000) {
    const thousands = Math.floor(n / 1000)
    const rest = n % 1000
    return convertHundreds(thousands) + ' Thousand' + (rest ? ' ' + convertHundreds(rest) : '')
  }
  if (n < 10000000) {
    const lakhs = Math.floor(n / 100000)
    const rest = n % 100000
    return convertHundreds(lakhs) + ' Lakh' + (rest ? ' ' + convertIndian(rest) : '')
  }
  const crores = Math.floor(n / 10000000)
  const rest = n % 10000000
  return convertHundreds(crores) + ' Crore' + (rest ? ' ' + convertIndian(rest) : '')
}

export function numberToWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let words = 'Rupees ' + (rupees === 0 ? 'Zero' : convertIndian(rupees))
  if (paise > 0) {
    words += ' and ' + convertHundreds(paise) + ' Paise'
  }
  return words + ' Only'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
    submitted: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-100 text-blue-700',
    acknowledged: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    invited: 'bg-purple-100 text-purple-700',
  }
  return colors[status] ?? 'bg-slate-100 text-slate-700'
}

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  entityLabel?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  let userName = 'System'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name ?? user.email ?? 'User'
  }
  await supabase.from('activity_logs').insert({
    user_id: user?.id ?? null,
    user_name: userName,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    entity_label: entityLabel ?? null,
    metadata: metadata ?? null,
  })
}

export function getMinDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().split('T')[0]
}

export function exportToCSV(data: Record<string, string | number>[], filename: string): void {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => `"${row[h]}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
