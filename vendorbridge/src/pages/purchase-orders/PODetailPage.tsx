import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { PODetailView } from '@/components/features/purchase-orders/PODetail'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePurchaseOrder, useUpdatePOStatus, useGenerateInvoiceFromPO, usePOInvoice } from '@/hooks/usePurchaseOrders'
import { useAuthStore } from '@/store/authStore'

export function PODetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const isOfficer = profile?.role === 'admin' || profile?.role === 'procurement_officer'
  const { data: po, isLoading } = usePurchaseOrder(id)
  const { data: existingInvoice } = usePOInvoice(id)
  const updateStatus = useUpdatePOStatus()
  const generateInvoice = useGenerateInvoiceFromPO()

  if (isLoading) {
    return (
      <div>
        <Header title="Purchase Order" />
        <div className="p-6"><Skeleton className="h-64 w-full" /></div>
      </div>
    )
  }

  if (!po) {
    return (
      <div>
        <Header title="PO Not Found" />
        <div className="p-6"><Button onClick={() => navigate(-1)}>Back</Button></div>
      </div>
    )
  }

  const handleGenerateInvoice = async () => {
    try {
      const invoice = await generateInvoice.mutateAsync(po)
      navigate(`/invoices/${invoice.id}`)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const nextStatus = po.status === 'sent' ? 'acknowledged' : po.status === 'acknowledged' ? 'completed' : null

  return (
    <div>
      <Header title={po.po_number} subtitle="Purchase Order Details" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 no-print">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          {isOfficer && po.status === 'draft' && (
            <Button variant="outline" onClick={() => updateStatus.mutate({ id: po.id, status: 'sent', po_number: po.po_number })}>
              Mark as Sent
            </Button>
          )}
          {isOfficer && nextStatus && (
            <Button
              variant="outline"
              onClick={() => updateStatus.mutate({ id: po.id, status: nextStatus, po_number: po.po_number })}
              disabled={updateStatus.isPending}
            >
              Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
            </Button>
          )}
          {isOfficer && existingInvoice ? (
            <Button variant="outline" onClick={() => navigate(`/invoices/${existingInvoice.id}`)}>
              View Invoice ({existingInvoice.invoice_number})
            </Button>
          ) : isOfficer ? (
            <Button className="bg-navy" onClick={handleGenerateInvoice} disabled={generateInvoice.isPending}>
              Generate Invoice
            </Button>
          ) : null}
        </div>
        <PODetailView po={po} />
      </div>
    </div>
  )
}
