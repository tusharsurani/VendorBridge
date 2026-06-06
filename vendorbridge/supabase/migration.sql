-- ============================================================
-- VendorBridge — Supabase Migration
-- ============================================================
-- SETUP NOTES:
--   • FRESH project: run this entire file once in SQL Editor
--   • ALREADY applied an older migration? Run patch.sql instead — NOT this file
--   1. Create demo users via Dashboard → Authentication → Users → Add user
--      (Auto Confirm ON — do NOT insert into auth.users via SQL)
--   2. Set .env: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (eyJ... anon key)
--   3. Create Storage bucket "rfq-attachments" (public read) in Dashboard → Storage
-- Demo accounts (password: demo123) — create via Dashboard only (not SQL):
--   admin@vendorbridge.com       role: admin
--   officer@vendorbridge.com     role: procurement_officer
--   manager@vendorbridge.com     role: manager
--   vendor@techsupply.com        role: vendor
-- ============================================================

-- ENUMS (skip if already exist)
do $$ begin create type user_role as enum ('admin', 'procurement_officer', 'manager', 'vendor');
exception when duplicate_object then null; end $$;
do $$ begin create type vendor_status as enum ('active', 'inactive', 'pending');
exception when duplicate_object then null; end $$;
do $$ begin create type rfq_status as enum ('draft', 'published', 'closed', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type quotation_status as enum ('draft', 'submitted', 'accepted', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin create type approval_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin create type po_status as enum ('draft', 'sent', 'acknowledged', 'completed');
exception when duplicate_object then null; end $$;
do $$ begin create type invoice_status as enum ('draft', 'sent', 'paid');
exception when duplicate_object then null; end $$;

-- PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role user_role not null default 'procurement_officer',
  company_name text,
  phone text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;

-- Helper functions (SECURITY DEFINER bypasses RLS to prevent infinite recursion)
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_officer_or_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'procurement_officer', 'manager'));
$$;

create or replace function public.is_manager_or_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'));
$$;

create or replace function public.is_vendor()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'vendor');
$$;

drop policy if exists "Users see own profile" on profiles;
drop policy if exists "Users update own profile" on profiles;
drop policy if exists "Admin sees all" on profiles;
create policy "Users see own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Admin sees all" on profiles for all using (public.is_admin());

-- VENDORS
create table if not exists vendors (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  contact_person text not null,
  email text not null unique,
  phone text,
  gst_number text,
  category text not null,
  address text,
  city text,
  state text,
  status vendor_status default 'pending',
  rating numeric(3,2) default 0,
  notes text,
  user_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table vendors add column if not exists user_id uuid references profiles(id);
alter table vendors enable row level security;
drop policy if exists "Authenticated users read vendors" on vendors;
drop policy if exists "Officers manage vendors" on vendors;
create policy "Authenticated users read vendors" on vendors for select to authenticated using (true);
create policy "Officers manage vendors" on vendors for all using (public.is_officer_or_admin());

create or replace function public.get_vendor_id_for_user()
returns uuid language sql security definer stable set search_path = public as $$
  select v.id from public.vendors v
  where v.user_id = auth.uid()
     or v.email = (select email from public.profiles where id = auth.uid())
  limit 1;
$$;

-- RFQs
create table if not exists rfqs (
  id uuid default gen_random_uuid() primary key,
  rfq_number text unique not null,
  title text not null,
  description text,
  deadline date not null,
  status rfq_status default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table rfqs enable row level security;
drop policy if exists "Read rfqs" on rfqs;
drop policy if exists "Officer create rfqs" on rfqs;
drop policy if exists "Officer update rfqs" on rfqs;
create policy "Read rfqs" on rfqs for select to authenticated using (true);
create policy "Officer create rfqs" on rfqs for insert with check (public.is_officer_or_admin());
create policy "Officer update rfqs" on rfqs for update using (public.is_officer_or_admin());

-- RFQ ITEMS
create table if not exists rfq_items (
  id uuid default gen_random_uuid() primary key,
  rfq_id uuid references rfqs(id) on delete cascade,
  product_name text not null,
  description text,
  quantity numeric not null,
  unit text not null default 'pcs',
  specifications text
);
alter table rfq_items enable row level security;
drop policy if exists "Read rfq_items" on rfq_items;
drop policy if exists "Officer manage rfq_items" on rfq_items;
create policy "Read rfq_items" on rfq_items for select to authenticated using (true);
create policy "Officer manage rfq_items" on rfq_items for all using (public.is_officer_or_admin());

-- RFQ VENDORS (invitations)
create table if not exists rfq_vendors (
  id uuid default gen_random_uuid() primary key,
  rfq_id uuid references rfqs(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  invited_at timestamptz default now(),
  status text default 'invited',
  unique(rfq_id, vendor_id)
);
alter table rfq_vendors enable row level security;
drop policy if exists "Read rfq_vendors" on rfq_vendors;
drop policy if exists "Officer manage rfq_vendors" on rfq_vendors;
create policy "Read rfq_vendors" on rfq_vendors for select to authenticated using (true);
create policy "Officer manage rfq_vendors" on rfq_vendors for all using (public.is_officer_or_admin());

-- QUOTATIONS
create table if not exists quotations (
  id uuid default gen_random_uuid() primary key,
  rfq_id uuid references rfqs(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete cascade,
  total_amount numeric(12,2) not null default 0,
  delivery_days integer,
  validity_days integer default 30,
  notes text,
  status quotation_status default 'draft',
  submitted_at timestamptz,
  created_at timestamptz default now()
);
alter table quotations enable row level security;
drop policy if exists "Read quotations" on quotations;
drop policy if exists "Manage quotations" on quotations;
drop policy if exists "Officer manage quotations" on quotations;
drop policy if exists "Vendor manage own quotations" on quotations;
create policy "Read quotations" on quotations for select to authenticated using (true);
create policy "Officer manage quotations" on quotations for all using (public.is_officer_or_admin());
create policy "Vendor manage own quotations" on quotations for all using (
  vendor_id = public.get_vendor_id_for_user()
);

-- QUOTATION ITEMS
create table if not exists quotation_items (
  id uuid default gen_random_uuid() primary key,
  quotation_id uuid references quotations(id) on delete cascade,
  rfq_item_id uuid references rfq_items(id),
  product_name text not null,
  quantity numeric not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) generated always as (quantity * unit_price) stored
);
alter table quotation_items enable row level security;
drop policy if exists "Read quotation_items" on quotation_items;
drop policy if exists "Manage quotation_items" on quotation_items;
drop policy if exists "Officer manage quotation_items" on quotation_items;
drop policy if exists "Vendor manage own quotation_items" on quotation_items;
create policy "Read quotation_items" on quotation_items for select to authenticated using (true);
create policy "Officer manage quotation_items" on quotation_items for all using (public.is_officer_or_admin());
create policy "Vendor manage own quotation_items" on quotation_items for all using (
  exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.vendor_id = public.get_vendor_id_for_user()
  )
);

-- APPROVALS
create table if not exists approvals (
  id uuid default gen_random_uuid() primary key,
  rfq_id uuid references rfqs(id),
  quotation_id uuid references quotations(id),
  approver_id uuid references profiles(id),
  status approval_status default 'pending',
  remarks text,
  requested_at timestamptz default now(),
  decided_at timestamptz
);
alter table approvals enable row level security;
drop policy if exists "Read approvals" on approvals;
drop policy if exists "Manage approvals" on approvals;
drop policy if exists "Officer insert approvals" on approvals;
drop policy if exists "Manager update approvals" on approvals;
drop policy if exists "Admin manage approvals" on approvals;
create policy "Read approvals" on approvals for select to authenticated using (true);
create policy "Officer insert approvals" on approvals for insert with check (public.is_officer_or_admin());
create policy "Manager update approvals" on approvals for update using (public.is_manager_or_admin());
create policy "Admin manage approvals" on approvals for all using (public.is_admin());

-- PURCHASE ORDERS
create table if not exists purchase_orders (
  id uuid default gen_random_uuid() primary key,
  po_number text unique not null,
  rfq_id uuid references rfqs(id),
  quotation_id uuid references quotations(id),
  vendor_id uuid references vendors(id),
  subtotal numeric(12,2) not null,
  cgst_amount numeric(12,2) default 0,
  sgst_amount numeric(12,2) default 0,
  igst_amount numeric(12,2) default 0,
  total_amount numeric(12,2) not null,
  status po_status default 'draft',
  delivery_address text,
  payment_terms text default 'Net 30',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table purchase_orders enable row level security;
drop policy if exists "Read pos" on purchase_orders;
drop policy if exists "Officer read pos" on purchase_orders;
drop policy if exists "Manage pos" on purchase_orders;
create policy "Officer read pos" on purchase_orders for select using (
  public.is_officer_or_admin() or public.is_admin()
  or (public.is_vendor() and vendor_id = public.get_vendor_id_for_user())
);
create policy "Manage pos" on purchase_orders for all using (public.is_officer_or_admin());

-- INVOICES
create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  invoice_number text unique not null,
  po_id uuid references purchase_orders(id),
  vendor_id uuid references vendors(id),
  subtotal numeric(12,2) not null,
  tax_amount numeric(12,2) default 0,
  total_amount numeric(12,2) not null,
  status invoice_status default 'draft',
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);
alter table invoices enable row level security;
drop policy if exists "Read invoices" on invoices;
drop policy if exists "Officer read invoices" on invoices;
drop policy if exists "Manage invoices" on invoices;
create policy "Officer read invoices" on invoices for select using (
  public.is_officer_or_admin() or public.is_admin()
  or (public.is_vendor() and vendor_id = public.get_vendor_id_for_user())
);
create policy "Manage invoices" on invoices for all using (public.is_officer_or_admin());

-- ACTIVITY LOGS
create table if not exists activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  user_name text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  metadata jsonb,
  created_at timestamptz default now()
);
alter table activity_logs enable row level security;
drop policy if exists "Read logs" on activity_logs;
drop policy if exists "Insert logs" on activity_logs;
create policy "Read logs" on activity_logs for select to authenticated using (true);
create policy "Insert logs" on activity_logs for insert to authenticated with check (true);

-- RFQ ATTACHMENTS
create table if not exists rfq_attachments (
  id uuid default gen_random_uuid() primary key,
  rfq_id uuid references rfqs(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size integer,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table rfq_attachments enable row level security;
drop policy if exists "Read rfq_attachments" on rfq_attachments;
drop policy if exists "Officer manage rfq_attachments" on rfq_attachments;
create policy "Read rfq_attachments" on rfq_attachments for select to authenticated using (true);
create policy "Officer manage rfq_attachments" on rfq_attachments for all using (public.is_officer_or_admin());

-- SEQUENCES for human-readable numbers
create sequence if not exists rfq_seq start 1001;
create sequence if not exists po_seq start 2001;
create sequence if not exists invoice_seq start 3001;

-- Number generation functions
create or replace function next_rfq_number() returns text as $$
declare seq_val bigint;
begin
  select nextval('rfq_seq') into seq_val;
  return 'RFQ-' || to_char(now(), 'YYYY') || '-' || seq_val;
end;
$$ language plpgsql;

create or replace function next_po_number() returns text as $$
declare seq_val bigint;
begin
  select nextval('po_seq') into seq_val;
  return 'PO-' || to_char(now(), 'YYYY') || '-' || seq_val;
end;
$$ language plpgsql;

create or replace function next_invoice_number() returns text as $$
declare seq_val bigint;
begin
  select nextval('invoice_seq') into seq_val;
  return 'INV-' || to_char(now(), 'YYYY') || '-' || seq_val;
end;
$$ language plpgsql;

grant execute on function public.next_rfq_number() to authenticated;
grant execute on function public.next_po_number() to authenticated;
grant execute on function public.next_invoice_number() to authenticated;
grant execute on function public.get_vendor_id_for_user() to authenticated;

-- Enable Realtime for activity logs (ignore if already added)
do $$ begin
  alter publication supabase_realtime add table activity_logs;
exception when duplicate_object then null;
end $$;

-- TRIGGER: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'procurement_officer'));
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure handle_new_user();

-- SEED DATA (skip rows that already exist)
insert into vendors (company_name, contact_person, email, phone, gst_number, category,
  address, city, state, status, rating) values
('TechSupply Co.', 'Raj Patel', 'vendor@techsupply.com', '9876543210', '27AABCT1332L1ZV',
  'IT Equipment', '123 Tech Park', 'Mumbai', 'Maharashtra', 'active', 4.5),
('OfficeWorld India', 'Priya Sharma', 'priya@officeworld.in', '9123456789', '29AACCG0567A1ZQ',
  'Office Supplies', '456 Business Hub', 'Bengaluru', 'Karnataka', 'active', 4.2),
('IndustrialPro', 'Amit Gupta', 'amit@industrialpro.com', '9988776655', '24AABCI3345K1ZM',
  'Industrial', '789 GIDC', 'Surat', 'Gujarat', 'active', 3.8),
('SwiftLogistics', 'Neha Joshi', 'neha@swiftlog.co', '8877665544', '06AACCS4567B1ZT',
  'Logistics', 'Plot 12, Logistics Park', 'Gurugram', 'Haryana', 'pending', 4.0),
('CleanTech Solutions', 'Vikram Singh', 'vikram@cleantech.in', '7766554433', '07AABCC2345N1ZP',
  'Facility Management', '234 Green Zone', 'Delhi', 'Delhi', 'active', 4.7)
on conflict (email) do update set
  email = excluded.email,
  company_name = excluded.company_name;

-- Fix legacy seed email if present
update vendors set email = 'vendor@techsupply.com' where email = 'raj@techsupply.com';
