import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { ChartDataPoint } from '@/types'

interface SpendChartProps {
  data: ChartDataPoint[]
  loading?: boolean
  title?: string
}

export function SpendChart({ data, loading, title = 'Monthly Spend' }: SpendChartProps) {
  if (loading) return <Skeleton className="h-64 w-full" />

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
            No spend data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Spend']} />
              <Bar dataKey="value" fill="#0B3D6B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
