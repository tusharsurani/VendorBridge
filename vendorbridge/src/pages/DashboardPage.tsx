import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Clock, FileText, ShoppingCart, IndianRupee, Package } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { KPICard } from '@/components/features/dashboard/KPICard'
import { SpendChart } from '@/components/features/dashboard/SpendChart'
import { RFQStatusBadge } from '@/components/features/rfqs/RFQStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { usePendingApprovalsCount } from '@/hooks/useAnalytics'
import { useRecentRFQs } from '@/hooks/useRFQs'
import { useRecentInvoices } from '@/hooks/useInvoices'
import { useMonthlySpend, usePOCount, useMonthlySpendTotal, useRecentPOs, useVendorPOs } from '@/hooks/usePurchaseOrders'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useVendorForCurrentUser } from '@/hooks/useVendorForCurrentUser'
import { useVendorRFQs, useVendorQuotations } from '@/hooks/useVendors'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, cn, getStatusColor } from '@/lib/utils'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function VendorDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { data: vendor, isLoading: loadingVendor } = useVendorForCurrentUser()
  const { data: invites, isLoading: loadingInvites } = useVendorRFQs(vendor?.id ?? '')
  const { data: quotations, isLoading: loadingQuotes } = useVendorQuotations(vendor?.id ?? '')
  const { data: vendorPOs, isLoading: loadingPOs } = useVendorPOs(vendor?.id ?? '', 5)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const pendingQuotes = (invites ?? []).filter(inv => {
    const quote = (quotations ?? []).find(q => q.rfq_id === inv.rfq_id)
    return !quote || quote.status === 'draft'
  }).length
  const submittedQuotes = (quotations ?? []).filter(q => q.status === 'submitted').length

  if (loadingVendor) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="border-l-4 border-l-teal border-slate-100 shadow-sm">
        <CardContent className="py-5">
          <p className="font-display text-xl font-semibold text-navy">
            {getGreeting()}, {firstName}!
          </p>
          <p className="text-sm text-muted-foreground mt-1">{today} — {vendor?.company_name ?? 'Vendor portal'}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="RFQ Invitations" value={invites?.length ?? 0} icon={FileText} color="bg-blue-500" />
        <KPICard label="Pending Quotes" value={pendingQuotes} icon={Clock} color="bg-teal" />
        <KPICard label="Submitted Quotes" value={submittedQuotes} icon={Package} color="bg-green-500" />
      </div>

      <Button className="bg-navy hover:bg-navy-600" onClick={() => navigate('/quotations')}>
        View My Quotations
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle className="text-base">Invited RFQs</CardTitle></CardHeader>
          <CardContent>
            {loadingInvites || loadingQuotes ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : !invites?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No RFQ invitations yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Quote Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.slice(0, 5).map(inv => {
                    const quote = (quotations ?? []).find(q => q.rfq_id === inv.rfq_id)
                    const status = quote?.status === 'submitted' ? 'Submitted' : quote?.status === 'accepted' ? 'Accepted' : quote ? 'Draft' : 'Pending'
                    return (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/quotations/submit/${inv.rfq_id}`)}
                      >
                        <TableCell className="font-mono text-xs">{inv.rfq?.rfq_number}</TableCell>
                        <TableCell className="truncate max-w-[120px]">{inv.rfq?.title}</TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', getStatusColor(status.toLowerCase()))}>{status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle className="text-base">My Purchase Orders</CardTitle></CardHeader>
          <CardContent>
            {loadingPOs ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : !vendorPOs?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No purchase orders yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO#</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorPOs.map(po => (
                    <TableRow key={po.id} className="cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                      <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
                      <TableCell>{formatCurrency(po.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getStatusColor(po.status))}>{po.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const isVendor = profile?.role === 'vendor'

  const { data: pendingApprovals = 0, isLoading: loadingApprovals } = usePendingApprovalsCount()
  const { activeRFQCount } = useAnalytics()
  const { data: poCount = 0, isLoading: loadingPOs } = usePOCount()
  const { data: monthlySpend = 0, isLoading: loadingSpend } = useMonthlySpendTotal()
  const { data: chartData = [], isLoading: loadingChart } = useMonthlySpend(6)
  const { data: recentRFQs, isLoading: loadingRFQs } = useRecentRFQs(5)
  const { data: recentInvoices, isLoading: loadingInvoices } = useRecentInvoices(5)
  const { data: recentPOs, isLoading: loadingRecentPOs } = useRecentPOs(5)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const today = format(new Date(), 'EEEE, d MMMM yyyy')

  if (isVendor) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Vendor portal" />
        <VendorDashboard />
      </div>
    )
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Procurement overview" />
      <div className="p-6 space-y-6">
        <Card className="border-l-4 border-l-teal border-slate-100 shadow-sm">
          <CardContent className="py-5">
            <p className="font-display text-xl font-semibold text-navy">
              {getGreeting()}, {firstName}!
            </p>
            <p className="text-sm text-muted-foreground mt-1">{today} — Here&apos;s your procurement snapshot.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingApprovals ? <Skeleton className="h-28" /> : (
            <KPICard label="Pending Approvals" value={pendingApprovals} icon={Clock} color="bg-teal" />
          )}
          {activeRFQCount.isLoading ? <Skeleton className="h-28" /> : (
            <KPICard label="Active RFQs" value={activeRFQCount.data ?? 0} icon={FileText} color="bg-blue-500" />
          )}
          {loadingPOs ? <Skeleton className="h-28" /> : (
            <KPICard label="Total POs" value={poCount} icon={ShoppingCart} color="bg-green-500" />
          )}
          {loadingSpend ? <Skeleton className="h-28" /> : (
            <KPICard label="Monthly Spend" value={formatCurrency(monthlySpend)} icon={IndianRupee} color="bg-purple-500" />
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="bg-navy hover:bg-navy-600" onClick={() => navigate('/rfqs/create')}>+ Create RFQ</Button>
          <Button variant="outline" onClick={() => navigate('/vendors')}>+ Add Vendor</Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>View Reports</Button>
        </div>

        <SpendChart data={chartData} loading={loadingChart} title="Spend — Last 6 Months" />

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-base">Recent RFQs</CardTitle></CardHeader>
            <CardContent>
              {loadingRFQs ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : !recentRFQs?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No RFQs yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RFQ#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRFQs.map(rfq => (
                      <TableRow key={rfq.id} className="cursor-pointer" onClick={() => navigate(`/rfqs/${rfq.id}`)}>
                        <TableCell className="font-mono text-xs">{rfq.rfq_number}</TableCell>
                        <TableCell className="truncate max-w-[100px]">{rfq.title}</TableCell>
                        <TableCell><RFQStatusBadge status={rfq.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-base">Recent Purchase Orders</CardTitle></CardHeader>
            <CardContent>
              {loadingRecentPOs ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : !recentPOs?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No POs yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO#</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPOs.map(po => (
                      <TableRow key={po.id} className="cursor-pointer" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                        <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
                        <TableCell className="truncate max-w-[100px]">{po.vendor?.company_name}</TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', getStatusColor(po.status))}>{po.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader><CardTitle className="text-base">Recent Invoices</CardTitle></CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              ) : !recentInvoices?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No invoices yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice#</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map(inv => (
                      <TableRow key={inv.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                        <TableCell>{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell>
                          <Badge className={cn('capitalize', getStatusColor(inv.status))}>{inv.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
