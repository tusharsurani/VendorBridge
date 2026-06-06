import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4 text-center">
      <p className="font-display text-8xl font-bold text-navy/20">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-navy">Page Not Found</h1>
      <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button className="mt-6 bg-navy" onClick={() => navigate('/dashboard')}>
        <Home className="mr-2 h-4 w-4" /> Go Home
      </Button>
    </div>
  )
}
