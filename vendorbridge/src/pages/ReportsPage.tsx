import { useState } from 'react'
import { Download } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Header } from '@/components/layout/Header'
import { KPICard } from '@/components/features/dashboard/KPICard'
import { SpendChart } from '@/components/features/dashboard/SpendChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useMonthlySpend, usePurchaseOrders } from '@/hooks/usePurchaseOrders'
import { formatCurrency, exportToCSV } from '@/lib/utils'
import { IndianRupee, ShoppingCart, Building2, TrendingUp } from 'lucide-react'

const PIE_COLORS = ['#0B3D6B', '#F59E0B', '#10B981', '#6366F1', '#EF4444']

export function ReportsPage() {
  const [months, setMonths] = useState<3 | 6 | 12>(12)
  const { ytdSpend, totalPOs, totalVendors, avgPOValue, vendorPerformance, topVendorsBySpend } = useAnalytics()
  const { data: monthlySpend, isLoading: loadingSpend } = useMonthlySpend(months)
  const { data: purchaseOrders, isLoading: loadingPOs } = usePurchaseOrders()

  const handleExportVendorCSV = () => {
    const data = (vendorPerformance.data ?? []).map(v => ({
      Vendor: v.company_name,
      'Quotes Submitted': v.quotes_submitted,
      'Quotes Won': v.quotes_won,
      'Win Rate %': v.win_rate.toFixed(1),
      'Avg Delivery Days': v.avg_delivery,
      'Total Spend': v.total_spend.toFixed(2),
    }))
    exportToCSV(data, 'vendor-performance.csv')
  }

  const handleExportSpendCSV = () => {
    const data = (monthlySpend ?? []).map(m => ({
      Month: m.name,
      Spend: m.value.toFixed(2),
    }))
    exportToCSV(data, `monthly-spend-${months}mo.csv`)
  }

  const handleExportPOCSV = () => {
    const data = (purchaseOrders ?? []).map(po => ({
      'PO Number': po.po_number,
      Vendor: po.vendor?.company_name ?? '',
      RFQ: po.rfq?.rfq_number ?? '',
      Status: po.status,
      Subtotal: po.subtotal,
      'Total Amount': po.total_amount,
      'Created At': po.created_at,
    }))
    exportToCSV(data, 'purchase-orders-summary.csv')
  }

  return (
    <div>
      <Header title="Reports" subtitle="Analytics & insights" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ytdSpend.isLoading ? <Skeleton className="h-28" /> : (
            <KPICard label="Total Spend YTD" value={formatCurrency(ytdSpend.data ?? 0)} icon={IndianRupee} color="bg-navy" />
          )}
          {totalPOs.isLoading ? <Skeleton className="h-28" /> : (
            <KPICard label="Total POs" value={totalPOs.data ?? 0} icon={ShoppingCart} color="bg-green-500" />
          )}
          {totalVendors.isLoading ? <Skeleton className="h-28" /> : (
            <KPICard label="Active Vendors" value={totalVendors.data ?? 0} icon={Building2} color="bg-blue-500" />
          )}
          {avgPOValue.isLoading ? <Skeleton className="h-28" /> : (
            <KPICard label="Avg PO Value" value={formatCurrency(avgPOValue.data ?? 0)} icon={TrendingUp} color="bg-purple-500" />
          )}
        </div>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Monthly Spend</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={String(months)} onValueChange={v => setMonths(Number(v) as 3 | 6 | 12)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportSpendCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SpendChart data={monthlySpend ?? []} loading={loadingSpend} title={`Spend — Last ${months} Months`} />
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Purchase Orders Summary</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportPOCSV} disabled={loadingPOs}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {loadingPOs ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO#</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(purchaseOrders ?? []).slice(0, 10).map(po => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-xs">{po.po_number}</TableCell>
                      <TableCell>{po.vendor?.company_name}</TableCell>
                      <TableCell className="capitalize">{po.status}</TableCell>
                      <TableCell>{formatCurrency(po.total_amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Vendor Performance</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportVendorCSV}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {vendorPerformance.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Quotes Submitted</TableHead>
                    <TableHead>Quotes Won</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Avg Delivery</TableHead>
                    <TableHead>Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(vendorPerformance.data ?? []).map(v => (
                    <TableRow key={v.vendor_id}>
                      <TableCell className="font-medium">{v.company_name}</TableCell>
                      <TableCell>{v.quotes_submitted}</TableCell>
                      <TableCell>{v.quotes_won}</TableCell>
                      <TableCell>{v.win_rate.toFixed(1)}%</TableCell>
                      <TableCell>{v.avg_delivery} days</TableCell>
                      <TableCell>{formatCurrency(v.total_spend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader><CardTitle className="text-base">Top Vendors by Spend</CardTitle></CardHeader>
          <CardContent>
            {topVendorsBySpend.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !(topVendorsBySpend.data ?? []).length ? (
              <p className="text-center text-muted-foreground py-8">No spend data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={topVendorsBySpend.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {(topVendorsBySpend.data ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
