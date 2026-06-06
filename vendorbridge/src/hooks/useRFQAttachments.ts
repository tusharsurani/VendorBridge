import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RFQAttachment } from '@/types'
import toast from 'react-hot-toast'

const BUCKET = 'rfq-attachments'

export function useRFQAttachments(rfqId: string) {
  return useQuery({
    queryKey: ['rfq-attachments', rfqId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rfq_attachments')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as RFQAttachment[]
    },
    enabled: !!rfqId,
  })
}

export function useUploadRFQAttachments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rfqId, files }: { rfqId: string; files: File[] }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const uploaded: RFQAttachment[] = []

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} exceeds 5MB limit`)
        }
        const path = `${rfqId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
        if (uploadError) throw uploadError

        const { data, error } = await supabase.from('rfq_attachments').insert({
          rfq_id: rfqId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          uploaded_by: user?.id,
        }).select().single()
        if (error) throw error
        uploaded.push(data as RFQAttachment)
      }
      return uploaded
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['rfq-attachments', vars.rfqId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export async function getAttachmentUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async (attachment: RFQAttachment) => {
      const { data, error } = await supabase.storage.from(BUCKET).download(attachment.file_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
