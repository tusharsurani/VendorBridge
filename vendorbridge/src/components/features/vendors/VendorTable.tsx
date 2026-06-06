import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { VendorForm } from './VendorForm'
import { VendorStatusBadge } from './VendorStatusBadge'
import { useVendors, useCreateVendor, useUpdateVendor, useToggleVendorStatus } from '@/hooks/useVendors'
import { VENDOR_CATEGORIES } from '@/lib/constants'
import type { Vendor } from '@/types'

export function VendorTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | undefined>()

  const { data: vendors, isLoading } = useVendors({
    search,
    category: category && category !== 'all' ? category : undefined,
    status: status && status !== 'all' ? status : undefined,
  })
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const toggleStatus = useToggleVendorStatus()

  const handleSubmit = async (data: Parameters<typeof createVendor.mutateAsync>[0]) => {
    if (editVendor) {
      await updateVendor.mutateAsync({ ...data, id: editVendor.id })
    } else {
      await createVendor.mutateAsync(data)
    }
    setDialogOpen(false)
    setEditVendor(undefined)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VENDOR_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button className="bg-navy hover:bg-navy-600" onClick={() => { setEditVendor(undefined); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {!vendors?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white py-16">
          <Building2Icon />
          <p className="mt-4 text-lg font-medium text-navy">No vendors found</p>
          <p className="text-sm text-muted-foreground">Add your first vendor to get started</p>
          <Button className="mt-4 bg-navy" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Vendor
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map(vendor => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.company_name}</TableCell>
                  <TableCell>{vendor.contact_person}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.category}</TableCell>
                  <TableCell className="text-xs">{vendor.gst_number ?? '—'}</TableCell>
                  <TableCell><VendorStatusBadge status={vendor.status} /></TableCell>
                  <TableCell>⭐ {vendor.rating}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditVendor(vendor); setDialogOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus.mutate({
                        id: vendor.id,
                        status: vendor.status === 'active' ? 'inactive' : 'active',
                        company_name: vendor.company_name,
                      })}>
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          </DialogHeader>
          <VendorForm
            vendor={editVendor}
            onSubmit={handleSubmit}
            loading={createVendor.isPending || updateVendor.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Building2Icon() {
  return (
    <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
