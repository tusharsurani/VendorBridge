import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({ email: z.string().email('Valid email required') })

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-navy">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-green-600">Check your email for a reset link.</p>
              <Link to="/login"><Button variant="outline">Back to Login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-navy" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <p className="text-center text-sm">
                <Link to="/login" className="text-navy hover:underline">Back to login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
