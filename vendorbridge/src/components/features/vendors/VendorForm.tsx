import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VENDOR_CATEGORIES } from '@/lib/constants'
import type { Vendor } from '@/types'

const vendorSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_person: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^\d{10}$/, '10 digit Indian phone number required').optional().or(z.literal('')),
  gst_number: z.string().regex(/^[0-9A-Z]{15}$/, '15 character GST number required').optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
})

type VendorFormValues = z.infer<typeof vendorSchema>

interface VendorFormProps {
  vendor?: Vendor
  onSubmit: (data: VendorFormValues) => void
  loading?: boolean
}

export function VendorForm({ vendor, onSubmit, loading }: VendorFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor ? {
      company_name: vendor.company_name,
      contact_person: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone ?? '',
      gst_number: vendor.gst_number ?? '',
      category: vendor.category,
      address: vendor.address ?? '',
      city: vendor.city ?? '',
      state: vendor.state ?? '',
      notes: vendor.notes ?? '',
    } : { category: 'IT Equipment' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Company Name *</Label>
          <Input {...register('company_name')} />
          {errors.company_name && <p className="text-xs text-red-500 mt-1">{errors.company_name.message}</p>}
        </div>
        <div>
          <Label>Contact Person *</Label>
          <Input {...register('contact_person')} />
          {errors.contact_person && <p className="text-xs text-red-500 mt-1">{errors.contact_person.message}</p>}
        </div>
        <div>
          <Label>Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...register('phone')} placeholder="9876543210" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <Label>GST Number</Label>
          <Input {...register('gst_number')} placeholder="27AABCT1332L1ZV" />
          {errors.gst_number && <p className="text-xs text-red-500 mt-1">{errors.gst_number.message}</p>}
        </div>
        <div>
          <Label>Category *</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <Label>City</Label>
          <Input {...register('city')} />
        </div>
        <div>
          <Label>State</Label>
          <Input {...register('state')} />
        </div>
      </div>
      <div>
        <Label>Address</Label>
        <Input {...register('address')} />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea {...register('notes')} rows={3} />
      </div>
      <Button type="submit" className="w-full bg-navy hover:bg-navy-600" disabled={loading}>
        {loading ? 'Saving...' : vendor ? 'Update Vendor' : 'Add Vendor'}
      </Button>
    </form>
  )
}
