import { Header } from '@/components/layout/Header'
import { VendorTable } from '@/components/features/vendors/VendorTable'

export function VendorsPage() {
  return (
    <div>
      <Header title="Vendors" subtitle="Manage your vendor network" />
      <div className="p-6">
        <VendorTable />
      </div>
    </div>
  )
}
