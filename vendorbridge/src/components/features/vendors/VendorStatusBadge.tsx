import { Badge } from '@/components/ui/badge'
import { cn, getStatusColor } from '@/lib/utils'
import type { VendorStatus } from '@/types'

interface VendorStatusBadgeProps {
  status: VendorStatus
}

export function VendorStatusBadge({ status }: VendorStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('capitalize', getStatusColor(status))}>
      {status}
    </Badge>
  )
}
