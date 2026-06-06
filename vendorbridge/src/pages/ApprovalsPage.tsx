import { Header } from '@/components/layout/Header'
import { ApprovalCard } from '@/components/features/approvals/ApprovalCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useApprovals } from '@/hooks/useApprovals'
import { CheckSquare } from 'lucide-react'

export function ApprovalsPage() {
  const pending = useApprovals('pending')
  const approved = useApprovals('approved')
  const rejected = useApprovals('rejected')

  return (
    <div>
      <Header title="Approvals" subtitle="Review and approve vendor quotations" />
      <div className="p-6">
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          {(['pending', 'approved', 'rejected'] as const).map(status => {
            const query = status === 'pending' ? pending : status === 'approved' ? approved : rejected
            return (
              <TabsContent key={status} value={status} className="mt-4 space-y-3">
                {query.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                ) : !query.data?.length ? (
                  <div className="flex flex-col items-center py-16 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mb-3 opacity-30" />
                    <p>No {status} approvals</p>
                  </div>
                ) : (
                  query.data.map(approval => <ApprovalCard key={approval.id} approval={approval} />)
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}
