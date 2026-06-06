import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, CheckSquare, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { APP_NAME, APP_TAGLINE, DEMO_ACCOUNTS } from '@/lib/constants'

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const features = [
  { icon: FileText, label: 'RFQ Management', desc: 'Create and publish requests for quotation' },
  { icon: CheckSquare, label: 'Approval Workflows', desc: 'Review quotes and approve vendors' },
  { icon: Receipt, label: 'GST Invoices', desc: 'Generate POs and compliant invoices' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-navy via-navy-700 to-slate-800">
      {/* Hero panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal font-display text-lg font-bold text-navy">
            VB
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">{APP_NAME}</h1>
            <p className="text-white/70 text-sm">{APP_TAGLINE}</p>
          </div>
        </div>
        <p className="text-lg text-white/80 max-w-md leading-relaxed">
          Streamline vendor management, RFQs, approvals, purchase orders, and invoicing — all in one place.
        </p>
        <ul className="mt-10 space-y-5">
          {features.map(({ icon: Icon, label, desc }) => (
            <li key={label} className="flex items-start gap-4">
              <div className="rounded-lg bg-teal/20 p-2.5">
                <Icon className="h-5 w-5 text-teal" />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-white/60">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Login panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">
          <div className="lg:hidden text-center mb-2">
            <h1 className="font-display text-2xl font-bold text-white">{APP_NAME}</h1>
            <p className="text-white/60 text-sm">{APP_TAGLINE}</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} placeholder="you@company.com" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" {...register('password')} placeholder="••••••••" />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full bg-navy hover:bg-navy-600" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <Link to="/forgot-password" className="text-navy hover:underline">Forgot password?</Link>
                {' · '}
                <Link to="/signup" className="text-navy hover:underline">Create account</Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-base">Demo Accounts</CardTitle>
              <p className="text-sm text-muted-foreground">Click to auto-fill credentials</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.email, account.password)}
                  className="rounded-lg border border-slate-200 p-3 text-left hover:border-teal hover:bg-teal/5 transition-colors"
                >
                  <p className="text-lg">{account.emoji}</p>
                  <p className="font-medium text-sm text-navy">{account.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
