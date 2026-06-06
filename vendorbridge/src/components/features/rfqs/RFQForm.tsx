import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Search, Check, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useVendors } from '@/hooks/useVendors'
import { useCreateRFQ } from '@/hooks/useRFQs'
import { useUploadRFQAttachments } from '@/hooks/useRFQAttachments'
import { UNITS } from '@/lib/constants'
import { getMinDeadline, cn } from '@/lib/utils'
import type { Vendor } from '@/types'

const itemSchema = z.object({
  product_name: z.string().min(1, 'Product name required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Min quantity 1'),
  unit: z.string().min(1),
  specifications: z.string().optional(),
})

const rfqSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Deadline required'),
  items: z.array(itemSchema).min(1, 'At least 1 item required'),
})

type RFQFormValues = z.infer<typeof rfqSchema>

export function RFQForm() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const { data: vendors } = useVendors({ status: 'active' })
  const createRFQ = useCreateRFQ()
  const uploadAttachments = useUploadRFQAttachments()

  const { register, handleSubmit, control, formState: { errors } } = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      deadline: getMinDeadline(),
      items: [{ product_name: '', quantity: 1, unit: 'pcs' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const filteredVendors = (vendors ?? []).filter(v =>
    v.company_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  const toggleVendor = (id: string) => {
    setSelectedVendors(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  const onSave = async (data: RFQFormValues, status: 'draft' | 'published') => {
    if (step === 3 && selectedVendors.length === 0) return
    const rfq = await createRFQ.mutateAsync({
      ...data,
      status,
      vendorIds: selectedVendors,
    })
    if (attachments.length > 0) {
      await uploadAttachments.mutateAsync({ rfqId: rfq.id, files: attachments })
    }
    navigate('/rfqs')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024 && /\.(pdf|png|jpe?g|gif|webp)$/i.test(f.name))
    setAttachments(prev => [...prev, ...valid].slice(0, 5))
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const steps = ['Details', 'Line Items', 'Assign Vendors']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          {steps.map((s, i) => (
            <span key={s} className={cn(step >= i + 1 && 'text-navy font-medium')}>{s}</span>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>RFQ Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input {...register('title')} placeholder="Office Equipment Procurement Q1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...register('description')} rows={4} />
            </div>
            <div>
              <Label>Deadline *</Label>
              <Input type="date" {...register('deadline')} min={getMinDeadline()} />
              {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline.message}</p>}
            </div>
            <div>
              <Label>Attachments (optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">PDF or images, max 5MB each, up to 5 files</p>
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" multiple onChange={handleFileChange} />
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((file, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate flex-1">{file.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button className="bg-navy" onClick={() => setStep(2)}>Next: Line Items →</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-3">
                <div className="col-span-3">
                  <Label className="text-xs">Product *</Label>
                  <Input {...register(`items.${index}.product_name`)} />
                  {errors.items?.[index]?.product_name && (
                    <p className="text-xs text-red-500">{errors.items[index]?.product_name?.message}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Qty *</Label>
                  <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Unit</Label>
                  <Controller
                    control={control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Description</Label>
                  <Input {...register(`items.${index}.description`)} />
                </div>
                <div className="col-span-1 pt-5">
                  {fields.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => append({ product_name: '', quantity: 1, unit: 'pcs' })}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button className="bg-navy" onClick={() => setStep(3)}>Next: Assign Vendors →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Assign Vendors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search vendors..." className="pl-9" value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
            </div>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {filteredVendors.map((vendor: Vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => toggleVendor(vendor.id)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors',
                    selectedVendors.includes(vendor.id) ? 'border-navy bg-navy/5' : 'hover:bg-slate-50'
                  )}
                >
                  <div>
                    <p className="font-medium">{vendor.company_name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.category} · ⭐ {vendor.rating}</p>
                  </div>
                  {selectedVendors.includes(vendor.id) && <Check className="h-5 w-5 text-navy" />}
                </div>
              ))}
            </div>
            {selectedVendors.length === 0 && (
              <p className="text-sm text-red-500">Select at least 1 vendor</p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button variant="outline" onClick={handleSubmit(d => onSave(d, 'draft'))} disabled={createRFQ.isPending}>
                Save as Draft
              </Button>
              <Button
                className="bg-teal text-navy hover:bg-teal/90"
                onClick={handleSubmit(d => onSave(d, 'published'))}
                disabled={createRFQ.isPending || selectedVendors.length === 0}
              >
                Publish RFQ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
