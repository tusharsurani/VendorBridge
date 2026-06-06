import type { UserRole } from '@/types'

export const ROLE_GROUPS = {
  officer: ['admin', 'procurement_officer', 'manager'] as UserRole[],
  vendor: ['vendor'] as UserRole[],
  approver: ['admin', 'manager'] as UserRole[],
  admin: ['admin'] as UserRole[],
  all: ['admin', 'procurement_officer', 'manager', 'vendor'] as UserRole[],
}
