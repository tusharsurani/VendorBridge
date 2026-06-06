import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { QuotationForm } from '@/components/features/quotations/QuotationForm'
import { Skeleton } from '@/components/ui/skeleton'
import { useRFQ } from '@/hooks/useRFQs'
import { useQuotationByVendorRFQ } from '@/hooks/useQuotations'
import { useVendorForCurrentUser } from '@/hooks/useVendorForCurrentUser'

export function SubmitQuotationPage() {
  const { rfqId = '' } = useParams()
  const { data: vendorRecord, isLoading: loadingVendor } = useVendorForCurrentUser()
  const vendorId = vendorRecord?.id ?? ''
  const { data: rfq, isLoading: loadingRfq } = useRFQ(rfqId)
  const { data: existing } = useQuotationByVendorRFQ(rfqId, vendorId)

  if (loadingVendor || loadingRfq || !rfq) {
    return (
      <div>
        <Header title="Submit Quotation" />
        <div className="p-6"><Skeleton className="h-64 w-full" /></div>
      </div>
    )
  }

  if (!vendorId) {
    return (
      <div>
        <Header title="Submit Quotation" />
        <div className="p-6 text-center text-muted-foreground">
          No vendor profile linked to your account. Contact admin to link your email to a vendor record.
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Submit Quotation" subtitle={rfq.rfq_number} />
      <div className="p-6 max-w-4xl">
        <QuotationForm
          rfqId={rfqId}
          vendorId={vendorId}
          rfqTitle={rfq.title}
          rfqDescription={rfq.description}
          deadline={rfq.deadline}
          items={rfq.items ?? []}
          existing={existing}
        />
      </div>
    </div>
  )
}
