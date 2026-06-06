import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { RFQTable } from '@/components/features/rfqs/RFQTable'
import { Button } from '@/components/ui/button'

export function RFQsPage() {
  const navigate = useNavigate()
  return (
    <div>
      <Header title="RFQs" subtitle="Request for Quotations" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Button className="bg-navy" onClick={() => navigate('/rfqs/create')}>+ Create RFQ</Button>
        </div>
        <RFQTable />
      </div>
    </div>
  )
}
