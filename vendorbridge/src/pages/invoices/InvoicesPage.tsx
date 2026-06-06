import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Plus, Search, FileText, Clock, CheckCircle2,
  IndianRupee, Trash2, Filter, X
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useInvoices, useCreateInvoice, useDeleteInvoice, useInvoiceStats,
  type CreateInvoiceInput
} from '@/hooks/useInvoices'
import { useVendors } from '@/hooks/useVendors'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types'

const EMPTY_FORM: CreateInvoiceInput = {
  vendor_id: '',
  subtotal: 0,
  tax_rate: 18,
  due_date: '',
  notes: '',
}

function getDefaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export function InvoicesPage() {
  const navigate = useNavigate()
  const { data: invoices, isLoading } = useInvoices()
  const { data: stats, isLoading: statsLoading } = useInvoiceStats()
  const { data: vendors } = useVendors()
  const createInvoice = useCreateInvoice()
  const deleteInvoice = useDeleteInvoice()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, number: string} | null>(null)
  const [form, setForm] = useState<CreateInvoiceInput>({ ...EMPTY_FORM, due_date: getDefaultDueDate() })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const activeVendors = useMemo(
    () => (vendors ?? []).filter(v => v.status === 'active'),
    [vendors]
  )

  const filteredInvoices = useMemo(() => {
    if (!invoices) return []
    return invoices.filter(inv => {
      const matchesSearch = !search || 
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (inv.vendor?.company_name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  const taxAmount = (form.subtotal * form.tax_rate) / 100
  const totalAmount = form.subtotal + taxAmount

  const handleCreate = async () => {
    if (!form.vendor_id || form.subtotal <= 0 || !form.due_date) return
    await createInvoice.mutateAsync(form)
    setCreateOpen(false)
    setForm({ ...EMPTY_FORM, due_date: getDefaultDueDate() })
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    await deleteInvoice.mutateAsync(deleteConfirmId)
    setDeleteConfirmId(null)
  }

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats?.total ?? 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Pending',
      value: stats ? stats.draft + stats.sent : 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      sub: stats ? formatCurrency(stats.pendingAmount) : '—',
    },
    {
      label: 'Paid',
      value: stats?.paid ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      sub: stats ? formatCurrency(stats.paidAmount) : '—',
    },
    {
      label: 'Total Revenue',
      value: stats ? formatCurrency(stats.totalAmount) : '—',
      icon: IndianRupee,
      color: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-700',
    },
  ]

  return (
    <div>
      <Header title="Invoices" subtitle="GST Invoices" />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <Card key={card.label} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  <div className={cn('rounded-xl p-3', card.bgLight)}>
                    <card.icon className={cn('h-5 w-5', card.textColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                    {statsLoading ? (
                      <Skeleton className="h-7 w-16 mt-1" />
                    ) : (
                      <>
                        <p className="text-xl font-bold text-slate-900 truncate">{card.value}</p>
                        {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
                      </>
                    )}
                  </div>
                </div>
                <div className={cn('h-1 bg-gradient-to-r', card.color)} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:ml-auto">
            <Button className="bg-navy hover:bg-navy/90" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !filteredInvoices.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-slate-100 p-4 mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700">
                {invoices?.length ? 'No matching invoices' : 'No invoices yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {invoices?.length
                  ? 'Try adjusting your search or filter'
                  : 'Create your first invoice or generate one from a purchase order'}
              </p>
              {!invoices?.length && (
                <Button className="bg-navy" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice#</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map(inv => {
                  const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date()
                  return (
                    <TableRow key={inv.id} className="group hover:bg-slate-50/50">
                      <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.vendor?.company_name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(inv.subtotal)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatCurrency(inv.tax_amount)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getStatusColor(inv.status))}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.due_date ? (
                          <span className={cn('text-sm', isOverdue && 'text-red-600 font-medium')}>
                            {formatDate(inv.due_date)}
                            {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {inv.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setDeleteConfirmId({ id: inv.id, number: inv.invoice_number })}
                              title="Delete invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              Showing {filteredInvoices.length} of {invoices?.length ?? 0} invoices
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Vendor <span className="text-red-500">*</span></Label>
              <Select value={form.vendor_id} onValueChange={v => setForm(f => ({ ...f, vendor_id: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {activeVendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subtotal (₹) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.subtotal || ''}
                  onChange={e => setForm(f => ({ ...f, subtotal: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>GST Rate (%)</Label>
                <Select
                  value={String(form.tax_rate)}
                  onValueChange={v => setForm(f => ({ ...f, tax_rate: parseFloat(v) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tax breakdown preview */}
            {form.subtotal > 0 && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(form.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST @ {form.tax_rate / 2}%</span>
                  <span>{formatCurrency(taxAmount / 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST @ {form.tax_rate / 2}%</span>
                  <span>{formatCurrency(taxAmount / 2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1 mt-1">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            <div>
              <Label>Due Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              className="w-full bg-navy"
              onClick={handleCreate}
              disabled={createInvoice.isPending || !form.vendor_id || form.subtotal <= 0 || !form.due_date}
            >
              {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete invoice <strong>{deleteConfirmId?.number}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
