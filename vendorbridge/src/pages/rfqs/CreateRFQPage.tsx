import { Header } from '@/components/layout/Header'
import { RFQForm } from '@/components/features/rfqs/RFQForm'

export function CreateRFQPage() {
  return (
    <div>
      <Header title="Create RFQ" subtitle="3-step wizard" />
      <div className="p-6">
        <RFQForm />
      </div>
    </div>
  )
}
