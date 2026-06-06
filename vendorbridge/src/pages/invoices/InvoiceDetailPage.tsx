import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer, Mail, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { InvoiceDetailView } from '@/components/features/invoices/InvoiceDetail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useInvoice, useSendInvoiceEmail, useUpdateInvoiceStatus } from '@/hooks/useInvoices'

export function InvoiceDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: invoice, isLoading } = useInvoice(id)
  const sendEmail = useSendInvoiceEmail()
  const updateStatus = useUpdateInvoiceStatus()
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', cc: '', subject: '', message: '' })

  if (isLoading) {
    return (
      <div>
        <Header title="Invoice" />
        <div className="p-6"><Skeleton className="h-96 w-full" /></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div>
        <Header title="Invoice Not Found" />
        <div className="p-6"><Button onClick={() => navigate('/invoices')}>Back</Button></div>
      </div>
    )
  }

  const handleDownloadPDF = async () => {
    const [{ pdf }, { InvoicePDF }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('@/components/features/invoices/InvoicePDF'),
    ])
    const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoice.invoice_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  const openEmailDialog = () => {
    setEmailForm({
      to: invoice.vendor?.email ?? '',
      cc: '',
      subject: `Invoice ${invoice.invoice_number} from VendorBridge Corp`,
      message: `Dear ${invoice.vendor?.company_name},\n\nPlease find invoice ${invoice.invoice_number} for ${invoice.total_amount}.\n\nRegards,\nVendorBridge Corp`,
    })
    setEmailOpen(true)
  }

  const handleSendEmail = async () => {
    const mailto = [
      `mailto:${encodeURIComponent(emailForm.to)}`,
      `?subject=${encodeURIComponent(emailForm.subject)}`,
      emailForm.cc ? `&cc=${encodeURIComponent(emailForm.cc)}` : '',
      `&body=${encodeURIComponent(emailForm.message)}`,
    ].join('')
    window.location.href = mailto

    await sendEmail.mutateAsync({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      to: emailForm.to,
      cc: emailForm.cc,
      subject: emailForm.subject,
    })
    if (invoice.status === 'draft') {
      await updateStatus.mutateAsync({ id: invoice.id, status: 'sent', invoice_number: invoice.invoice_number })
    }
    setEmailOpen(false)
    toast.success('Email client opened — invoice activity logged')
  }

  const handleMarkPaid = async () => {
    await updateStatus.mutateAsync({ id: invoice.id, status: 'paid', invoice_number: invoice.invoice_number })
  }

  return (
    <div>
      <Header title={invoice.invoice_number} subtitle="Invoice Details" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 no-print">
          <Button variant="ghost" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button className="bg-navy" onClick={openEmailDialog}>
            <Mail className="mr-2 h-4 w-4" /> Send via Email
          </Button>
          {invoice.status !== 'paid' && (
            <Button variant="outline" className="text-green-700 border-green-200" onClick={handleMarkPaid} disabled={updateStatus.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
            </Button>
          )}
        </div>
        <InvoiceDetailView invoice={invoice} />
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Invoice via Email</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Opens your email client with prefilled details (demo mode).</p>
          <div className="space-y-3">
            <div><Label>To</Label><Input value={emailForm.to} onChange={e => setEmailForm(f => ({ ...f, to: e.target.value }))} /></div>
            <div><Label>CC</Label><Input value={emailForm.cc} onChange={e => setEmailForm(f => ({ ...f, cc: e.target.value }))} /></div>
            <div><Label>Subject</Label><Input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div><Label>Message</Label><Textarea rows={4} value={emailForm.message} onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))} /></div>
            <Button className="w-full bg-navy" onClick={handleSendEmail} disabled={sendEmail.isPending || !emailForm.to}>Open Email Client</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
