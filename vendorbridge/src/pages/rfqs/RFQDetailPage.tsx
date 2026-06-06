import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GitCompare, Paperclip, Download } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { RFQStatusBadge } from '@/components/features/rfqs/RFQStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRFQ } from '@/hooks/useRFQs'
import { useRFQAttachments, useDownloadAttachment } from '@/hooks/useRFQAttachments'
import { formatDate, getStatusColor, cn } from '@/lib/utils'

export function RFQDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: rfq, isLoading } = useRFQ(id)
  const { data: attachments, isLoading: loadingAttachments } = useRFQAttachments(id)
  const downloadAttachment = useDownloadAttachment()

  if (isLoading) {
    return (
      <div>
        <Header title="RFQ Details" />
        <div className="p-6"><Skeleton className="h-64 w-full" /></div>
      </div>
    )
  }

  if (!rfq) {
    return (
      <div>
        <Header title="RFQ Not Found" />
        <div className="p-6"><Button onClick={() => navigate('/rfqs')}>Back</Button></div>
      </div>
    )
  }

  const submittedQuotes = (rfq.quotations ?? []).filter(q => q.status === 'submitted')

  return (
    <div>
      <Header title={rfq.title} subtitle={rfq.rfq_number} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/rfqs')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {submittedQuotes.length > 0 && (
            <Button className="bg-navy" onClick={() => navigate(`/rfqs/${id}/compare`)}>
              <GitCompare className="mr-2 h-4 w-4" /> Compare Quotes
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle>RFQ Information</CardTitle>
            <RFQStatusBadge status={rfq.status} />
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Deadline</p><p className="font-medium">{formatDate(rfq.deadline)}</p></div>
            <div><p className="text-muted-foreground">Created</p><p>{formatDate(rfq.created_at)}</p></div>
            <div><p className="text-muted-foreground">Items</p><p>{rfq.items?.length ?? 0}</p></div>
            {rfq.description && <div className="md:col-span-3"><p className="text-muted-foreground">Description</p><p>{rfq.description}</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rfq.items ?? []).map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.description ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {(loadingAttachments || (attachments && attachments.length > 0)) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
            <CardContent>
              {loadingAttachments ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <ul className="space-y-2">
                  {(attachments ?? []).map(att => (
                    <li key={att.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span>{att.file_name}</span>
                        {att.file_size && (
                          <span className="text-muted-foreground">({Math.round(att.file_size / 1024)} KB)</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment.mutate(att)}
                        disabled={downloadAttachment.isPending}
                      >
                        <Download className="mr-1 h-3 w-3" /> Download
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Invited Vendors</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quotation Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rfq.vendors ?? []).map(rv => {
                  const quote = (rfq.quotations ?? []).find(q => q.vendor_id === rv.vendor_id)
                  const quoteStatus = quote?.status === 'submitted' ? 'Submitted' : 'Pending'
                  return (
                    <TableRow key={rv.id}>
                      <TableCell>{rv.vendor?.company_name}</TableCell>
                      <TableCell>{rv.vendor?.category}</TableCell>
                      <TableCell>
                        <Badge className={cn(getStatusColor(quoteStatus.toLowerCase()))}>{quoteStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {submittedQuotes.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Submitted Quotations ({submittedQuotes.length})</CardTitle></CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate(`/rfqs/${id}/compare`)}>
                View Comparison Table →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
