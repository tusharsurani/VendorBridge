import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { QuotationCompare } from '@/components/features/quotations/QuotationCompare'
import { Button } from '@/components/ui/button'
import { useRFQ } from '@/hooks/useRFQs'

export function QuotationComparePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: rfq } = useRFQ(id)

  return (
    <div>
      <Header title="Compare Quotations" subtitle={rfq?.rfq_number ?? ''} />
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/rfqs/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to RFQ
        </Button>
        <QuotationCompare rfqId={id} />
      </div>
    </div>
  )
}
