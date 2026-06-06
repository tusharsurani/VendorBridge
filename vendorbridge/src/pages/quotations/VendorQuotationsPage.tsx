import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { RFQStatusBadge } from '@/components/features/rfqs/RFQStatusBadge'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useVendorForCurrentUser } from '@/hooks/useVendorForCurrentUser'
import { formatDate } from '@/lib/utils'
import type { RFQStatus } from '@/types'

export function VendorQuotationsPage() {
  const navigate = useNavigate()
  const { data: vendorRecord, isLoading: loadingVendor } = useVendorForCurrentUser()

  const { data: invites, isLoading } = useQuery({
    queryKey: ['vendor-invites', vendorRecord?.id],
    queryFn: async () => {
      if (!vendorRecord?.id) return []
      const { data, error } = await supabase
        .from('rfq_vendors')
        .select('*, rfq:rfqs(*)')
        .eq('vendor_id', vendorRecord.id)
      if (error) throw error
      return data
    },
    enabled: !!vendorRecord?.id,
  })

  if (loadingVendor || isLoading) {
    return (
      <div>
        <Header title="My Quotations" />
        <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      </div>
    )
  }

  if (!vendorRecord) {
    return (
      <div>
        <Header title="My Quotations" />
        <div className="p-6 text-center text-muted-foreground">
          No vendor profile linked. Ensure your login email matches a vendor record.
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="My Quotations" subtitle={`${vendorRecord.company_name} — RFQ invitations`} />
      <div className="p-6">
        {!invites?.length ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <FileText className="h-16 w-16 opacity-30 mb-4" />
            <p className="text-lg font-medium">No RFQ invitations</p>
            <p className="text-sm">You&apos;ll see RFQs here when invited by procurement</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv: { id: string; rfq_id: string; rfq: { rfq_number: string; title: string; deadline: string; status: RFQStatus } }) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.rfq?.rfq_number}</TableCell>
                    <TableCell>{inv.rfq?.title}</TableCell>
                    <TableCell>{inv.rfq?.deadline ? formatDate(inv.rfq.deadline) : '—'}</TableCell>
                    <TableCell><RFQStatusBadge status={inv.rfq?.status ?? 'draft'} /></TableCell>
                    <TableCell>
                      <Button size="sm" className="bg-navy" onClick={() => navigate(`/quotations/submit/${inv.rfq_id}`)}>
                        Submit Quote
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
