import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { VendorStatusBadge } from '@/components/features/vendors/VendorStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useVendor, useVendorRFQs, useVendorQuotations } from '@/hooks/useVendors'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RFQStatusBadge } from '@/components/features/rfqs/RFQStatusBadge'
import type { RFQStatus } from '@/types'

export function VendorDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: vendor, isLoading } = useVendor(id)
  const { data: rfqInvites } = useVendorRFQs(id)
  const { data: quotations } = useVendorQuotations(id)

  const submitted = (quotations ?? []).filter(q => q.status === 'submitted' || q.status === 'accepted').length
  const won = (quotations ?? []).filter(q => q.status === 'accepted').length
  const winRate = submitted ? Math.round((won / submitted) * 100) : 0
  const avgDelivery = (quotations ?? [])
    .filter(q => q.delivery_days)
    .reduce((sum, q, _, arr) => sum + (q.delivery_days ?? 0) / arr.length, 0)

  if (isLoading) {
    return (
      <div>
        <Header title="Vendor Details" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div>
        <Header title="Vendor Not Found" />
        <div className="p-6 text-center">
          <Button onClick={() => navigate('/vendors')}>Back to Vendors</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title={vendor.company_name} subtitle="Vendor Profile" />
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/vendors')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{vendor.company_name}</CardTitle>
            <VendorStatusBadge status={vendor.status} />
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{vendor.contact_person}</p></div>
            <div><p className="text-muted-foreground">Email</p><p>{vendor.email}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p>{vendor.phone ?? '—'}</p></div>
            <div><p className="text-muted-foreground">GST</p><p>{vendor.gst_number ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Category</p><p>{vendor.category}</p></div>
            <div><p className="text-muted-foreground">Rating</p><p>⭐ {vendor.rating}</p></div>
            <div className="md:col-span-3"><p className="text-muted-foreground">Address</p><p>{[vendor.address, vendor.city, vendor.state].filter(Boolean).join(', ') || '—'}</p></div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-navy">{winRate}%</p><p className="text-sm text-muted-foreground">Win Rate</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-navy">{Math.round(avgDelivery)} days</p><p className="text-sm text-muted-foreground">Avg Delivery</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-navy">{won}/{submitted}</p><p className="text-sm text-muted-foreground">Quotes Won</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">RFQ Invitations</CardTitle></CardHeader>
          <CardContent>
            {!rfqInvites?.length ? <p className="text-sm text-muted-foreground">No RFQ invitations</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>RFQ</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Invited</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rfqInvites.map((inv: { id: string; invited_at: string; rfq: { rfq_number: string; title: string; status: RFQStatus } }) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.rfq?.rfq_number}</TableCell>
                      <TableCell>{inv.rfq?.title}</TableCell>
                      <TableCell><RFQStatusBadge status={inv.rfq?.status ?? 'draft'} /></TableCell>
                      <TableCell>{formatDate(inv.invited_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Quotations Submitted</CardTitle></CardHeader>
          <CardContent>
            {!quotations?.length ? <p className="text-sm text-muted-foreground">No quotations submitted</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>RFQ</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {quotations.map(q => (
                    <TableRow key={q.id}>
                      <TableCell>{q.rfq?.rfq_number}</TableCell>
                      <TableCell>{formatCurrency(q.total_amount)}</TableCell>
                      <TableCell className="capitalize">{q.status}</TableCell>
                      <TableCell>{formatDate(q.created_at)}</TableCell>
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
