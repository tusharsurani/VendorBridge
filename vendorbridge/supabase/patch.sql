-- VendorBridge patch — run if you already applied an older migration.sql
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE where possible)

-- 1. Vendor user_id column
alter table public.vendors add column if not exists user_id uuid references public.profiles(id);

-- 2. Fix demo vendor email
update public.vendors set email = 'vendor@techsupply.com' where email = 'raj@techsupply.com';

-- 3. Helper functions
create or replace function public.is_manager_or_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'));
$$;

create or replace function public.is_vendor()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor');
$$;

create or replace function public.get_vendor_id_for_user()
returns uuid language sql security definer stable set search_path = public as $$
  select v.id from public.vendors v
  where v.user_id = auth.uid()
     or v.email = (select email from public.profiles where id = auth.uid())
  limit 1;
$$;

-- 4. RFQ attachments table
create table if not exists public.rfq_attachments (
  id uuid default gen_random_uuid() primary key,
  rfq_id uuid references public.rfqs(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.rfq_attachments enable row level security;
drop policy if exists "Read rfq_attachments" on public.rfq_attachments;
drop policy if exists "Officer manage rfq_attachments" on public.rfq_attachments;
create policy "Read rfq_attachments" on public.rfq_attachments for select to authenticated using (true);
create policy "Officer manage rfq_attachments" on public.rfq_attachments for all using (public.is_officer_or_admin());

-- 5. Tighten quotations RLS
drop policy if exists "Manage quotations" on public.quotations;
drop policy if exists "Officer manage quotations" on public.quotations;
drop policy if exists "Vendor manage own quotations" on public.quotations;
create policy "Officer manage quotations" on public.quotations for all using (public.is_officer_or_admin());
create policy "Vendor manage own quotations" on public.quotations for all using (
  vendor_id = public.get_vendor_id_for_user()
);

drop policy if exists "Manage quotation_items" on public.quotation_items;
drop policy if exists "Officer manage quotation_items" on public.quotation_items;
drop policy if exists "Vendor manage own quotation_items" on public.quotation_items;
create policy "Officer manage quotation_items" on public.quotation_items for all using (public.is_officer_or_admin());
create policy "Vendor manage own quotation_items" on public.quotation_items for all using (
  exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.vendor_id = public.get_vendor_id_for_user()
  )
);

-- 6. Tighten approvals RLS
drop policy if exists "Manage approvals" on public.approvals;
drop policy if exists "Officer insert approvals" on public.approvals;
drop policy if exists "Manager update approvals" on public.approvals;
drop policy if exists "Admin manage approvals" on public.approvals;
create policy "Officer insert approvals" on public.approvals for insert with check (public.is_officer_or_admin());
create policy "Manager update approvals" on public.approvals for update using (public.is_manager_or_admin());
create policy "Admin manage approvals" on public.approvals for all using (public.is_admin());

-- 7. Vendor-scoped PO/invoice read
drop policy if exists "Read pos" on public.purchase_orders;
drop policy if exists "Officer read pos" on public.purchase_orders;
create policy "Officer read pos" on public.purchase_orders for select using (
  public.is_officer_or_admin() or public.is_admin()
  or (public.is_vendor() and vendor_id = public.get_vendor_id_for_user())
);

drop policy if exists "Read invoices" on public.invoices;
drop policy if exists "Officer read invoices" on public.invoices;
create policy "Officer read invoices" on public.invoices for select using (
  public.is_officer_or_admin() or public.is_admin()
  or (public.is_vendor() and vendor_id = public.get_vendor_id_for_user())
);

-- 8. RPC grants
grant execute on function public.next_rfq_number() to authenticated;
grant execute on function public.next_po_number() to authenticated;
grant execute on function public.next_invoice_number() to authenticated;
grant execute on function public.get_vendor_id_for_user() to authenticated;

-- 9. Realtime (ignore error if already added)
do $$ begin
  alter publication supabase_realtime add table public.activity_logs;
exception when duplicate_object then null;
end $$;

-- 10. Link vendor user_id for demo vendor account (run after creating auth user)
update public.vendors v
set user_id = p.id
from public.profiles p
where v.email = 'vendor@techsupply.com' and p.email = 'vendor@techsupply.com';
