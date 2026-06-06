-- ============================================================
-- VendorBridge — Patch: Add manager role to RLS helper functions
-- ============================================================
-- Run this in Supabase SQL Editor to fix manager access to
-- Purchase Orders, Invoices, and other officer-level tables.
-- ============================================================

-- Update is_officer_or_admin to include manager role
create or replace function public.is_officer_or_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'procurement_officer', 'manager'));
$$;

-- Also update RLS policies for purchase_orders to explicitly allow manager read
drop policy if exists "Officer read pos" on purchase_orders;
create policy "Officer read pos" on purchase_orders for select using (
  public.is_officer_or_admin() or public.is_admin()
  or (public.is_vendor() and vendor_id = public.get_vendor_id_for_user())
);

drop policy if exists "Manage pos" on purchase_orders;
create policy "Manage pos" on purchase_orders for all using (public.is_officer_or_admin());

-- Update RLS policies for invoices
drop policy if exists "Officer read invoices" on invoices;
create policy "Officer read invoices" on invoices for select using (
  public.is_officer_or_admin() or public.is_admin()
  or (public.is_vendor() and vendor_id = public.get_vendor_id_for_user())
);

drop policy if exists "Manage invoices" on invoices;
create policy "Manage invoices" on invoices for all using (public.is_officer_or_admin());
