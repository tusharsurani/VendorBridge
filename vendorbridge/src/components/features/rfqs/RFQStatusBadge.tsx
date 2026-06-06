import { Badge } from '@/components/ui/badge'
import { cn, getStatusColor } from '@/lib/utils'
import type { RFQStatus } from '@/types'

export function RFQStatusBadge({ status }: { status: RFQStatus }) {
  return (
    <Badge variant="secondary" className={cn('capitalize', getStatusColor(status))}>
      {status}
    </Badge>
  )
}
