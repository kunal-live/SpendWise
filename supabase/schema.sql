create extension if not exists pgcrypto;

-- ============================================================================
-- 1. AUTHENTICATION & IDENTITY ARCHITECTURE TABLES
-- ============================================================================

-- Core users entity
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended', 'locked')),
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive unique indexes on users
create unique index if not exists users_username_lower_idx on public.users (lower(trim(username)));
create unique index if not exists users_email_lower_idx on public.users (lower(trim(email)));

-- User credentials (password hash & failed attempts tracking)
create table if not exists public.user_credentials (
  user_id uuid primary key references public.users(id) on delete cascade,
  password_hash text not null,
  password_changed_at timestamptz not null default now(),
  failed_attempts integer not null default 0 check (failed_attempts >= 0)
);

-- User profiles (personal, lifestyle & financial starting numbers)
create table if not exists public.user_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  id uuid generated always as (user_id) stored, -- Backwards compatibility alias for queries using id
  name text,
  age integer check (age is null or age > 0),
  dob text,
  gender text,
  city text,
  occupation text,
  profile_photo text,
  financial_type text check (financial_type in ('student','earning','both')),
  user_type text default 'Professional',
  goal text default 'track',
  monthly_income numeric(14,2) default 0,
  monthly_pocket_money numeric(14,2) default 0,
  current_spend numeric(14,2) default 0,
  monthly_investment numeric(14,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- OAuth provider accounts (Google, etc.)
create table if not exists public.oauth_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique(provider, provider_user_id)
);

-- Email verification tokens
create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- Password reset tokens
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Sessions management
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Login attempts & security auditing
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  ip_address text,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);

-- ============================================================================
-- 2. FINANCIAL DOMAIN TABLES (SPENDWISE MODULES)
-- ============================================================================

create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount >= 0),
  frequency text not null default 'monthly',
  created_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  parent_name text
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  payment_method text not null default 'UPI',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  month_start date not null,
  amount numeric(14,2) not null check (amount >= 0),
  unique(user_id, category, month_start)
);

create table if not exists public.emis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  total_amount numeric(14,2) not null check (total_amount > 0),
  monthly_emi numeric(14,2) not null check (monthly_emi > 0),
  duration_months integer not null check (duration_months > 0),
  start_date date not null,
  payment_day integer not null default 1 check (payment_day between 1 and 28),
  interest_amount numeric(14,2) not null default 0,
  status text not null default 'active'
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  investment_type text not null,
  name text,
  amount numeric(14,2) not null check (amount > 0),
  frequency text not null default 'one_time',
  investment_date date not null default current_date
);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  amount numeric(14,2) not null check (amount > 0),
  frequency text not null default 'monthly',
  next_due_date date not null
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  condition_type text not null
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.users enable row level security;
alter table public.user_credentials enable row level security;
alter table public.user_profiles enable row level security;
alter table public.oauth_accounts enable row level security;
alter table public.email_verifications enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.sessions enable row level security;
alter table public.login_attempts enable row level security;

alter table public.income_sources enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.emis enable row level security;
alter table public.investments enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.user_badges enable row level security;
alter table public.expense_categories enable row level security;
alter table public.badges enable row level security;

-- Users policies
create policy "users own row readable" on public.users
for select using (auth.uid() = id);

create policy "users own row updatable" on public.users
for update using (auth.uid() = id);

-- User profiles policies
create policy "profiles own rows" on public.user_profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User credentials (strictly restricted to backend functions / service_role)
create policy "credentials own update" on public.user_credentials
for update using (auth.uid() = user_id);

-- OAuth accounts policies
create policy "oauth own rows" on public.oauth_accounts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Sessions policies
create policy "sessions own rows" on public.sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Financial modules policies
create policy "income own rows" on public.income_sources
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "expenses own rows" on public.expenses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets own rows" on public.budgets
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "emis own rows" on public.emis
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "investments own rows" on public.investments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring own rows" on public.recurring_expenses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user badges own rows" on public.user_badges
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories readable" on public.expense_categories
for select using (true);

create policy "badges readable" on public.badges
for select using (true);

-- Seed static lookup data
insert into public.expense_categories(name, parent_name) values
  ('Food', 'Essentials'),
  ('EMI', 'Financial'),
  ('Invest', 'Financial'),
  ('Personal Expense', 'Lifestyle'),
  ('Outing', 'Lifestyle'),
  ('Night Out', 'Lifestyle'),
  ('Hospital', 'Medical'),
  ('Medical', 'Medical'),
  ('Gym', 'Lifestyle'),
  ('Supplements', 'Lifestyle'),
  ('Bank Savings', 'Financial'),
  ('Petrol & Travel', 'Essentials'),
  ('Shopping', 'Lifestyle'),
  ('Bills', 'Essentials'),
  ('Education', 'Essentials'),
  ('Miscellaneous', 'Other')
on conflict (name) do nothing;

insert into public.badges(code, name, description, condition_type) values
  ('FIRST_SAVER', 'First Saver', 'Saved money for the first time.', 'savings_positive'),
  ('INVESTOR', 'Investor', 'Made your first investment.', 'first_investment'),
  ('BUDGET_KEEPER', 'Budget Keeper', 'Stayed within category budgets.', 'budget_adherence'),
  ('CONSISTENT_SAVER', 'Consistent Saver', 'Maintained a positive savings rate for multiple months.', 'saving_streak'),
  ('DEBT_CRUSHER', 'Debt Crusher', 'Completed an EMI schedule.', 'emi_completed')
on conflict (code) do nothing;

-- ============================================================================
-- 4. SECURITY DEFINER FUNCTIONS & AUTH TRIGGERS
-- ============================================================================

-- Function to check if a username is available (case-insensitive)
create or replace function public.check_username_available(requested_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_uname text;
begin
  if requested_username is null then
    return false;
  end if;
  clean_uname := lower(trim(requested_username));
  if length(clean_uname) < 3 or length(clean_uname) > 30 then
    return false;
  end if;

  -- Check in public.users
  if exists (select 1 from public.users where lower(trim(username)) = clean_uname) then
    return false;
  end if;

  return true;
end;
$$;

grant execute on function public.check_username_available(text) to anon, authenticated, service_role;

-- Function to check if an email exists in public.users or auth.users
create or replace function public.check_email_exists(lookup_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  clean_email text;
begin
  if lookup_email is null then
    return false;
  end if;
  clean_email := lower(trim(lookup_email));
  if clean_email = '' then
    return false;
  end if;

  -- 1. Check in public.users
  if exists (select 1 from public.users where lower(trim(email)) = clean_email) then
    return true;
  end if;

  -- 2. Check in auth.users
  if exists (select 1 from auth.users where lower(trim(email)) = clean_email) then
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.check_email_exists(text) to anon, authenticated, service_role;

-- Function to record login attempts for audit and rate limiting
create or replace function public.record_login_attempt(
  p_user_id uuid,
  p_ip text,
  p_success boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.login_attempts (user_id, ip_address, success, attempted_at)
  values (p_user_id, p_ip, p_success, now());

  -- If failure, increment failed attempts in credentials
  if p_user_id is not null then
    if p_success then
      update public.user_credentials set failed_attempts = 0 where user_id = p_user_id;
    else
      update public.user_credentials set failed_attempts = failed_attempts + 1 where user_id = p_user_id;
    end if;
  end if;
end;
$$;

grant execute on function public.record_login_attempt(uuid, text, boolean) to anon, authenticated, service_role;

-- Automated trigger to sync new user registrations from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_uname text;
  raw_name text;
begin
  raw_uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', raw_uname);

  -- 1. Sync into public.users
  insert into public.users (id, email, username, email_verified, status)
  values (
    new.id,
    new.email,
    raw_uname,
    (new.email_confirmed_at is not null),
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.users.username, excluded.username),
    email_verified = (new.email_confirmed_at is not null),
    updated_at = now();

  -- 2. Sync into public.user_profiles
  insert into public.user_profiles (user_id, name)
  values (new.id, raw_name)
  on conflict (user_id) do update set
    name = coalesce(public.user_profiles.name, excluded.name),
    updated_at = now();

  -- 3. If OAuth provider is present, record in oauth_accounts
  if new.raw_app_meta_data->>'provider' is not null and new.raw_app_meta_data->>'provider' != 'email' then
    insert into public.oauth_accounts (user_id, provider, provider_user_id)
    values (
      new.id,
      new.raw_app_meta_data->>'provider',
      coalesce(new.raw_user_meta_data->>'provider_id', new.id::text)
    )
    on conflict (provider, provider_user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 5. BILL UPLOAD & AUTOMATIC EXPENSE CATEGORIZATION MODULE
-- ============================================================================

-- Standard Categories Table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed initial 13 standard categories
insert into public.categories (name, description) values
  ('Food', 'Dining out, cafes, fast food, and food delivery'),
  ('Groceries', 'Supermarket, provisions, fresh produce, and daily essentials'),
  ('Shopping', 'General retail shopping, lifestyle, and consumer goods'),
  ('Clothing', 'Apparel, footwear, fashion accessories, and garments'),
  ('Electronics', 'Gadgets, computer hardware, peripherals, and electronics'),
  ('Transport', 'Fuel, public transit, cabs, taxis, tolls, and auto'),
  ('Healthcare', 'Medicines, clinic visits, pharmacy, tests, and medical care'),
  ('Entertainment', 'Movies, events, games, concerts, and recreational activities'),
  ('Bills & Utilities', 'Electricity, water, gas, broadband, phone, and municipal bills'),
  ('Travel', 'Flights, hotels, train tickets, lodging, and holiday trips'),
  ('Education', 'Courses, books, tuition fees, certifications, and school'),
  ('Subscriptions', 'Digital subscriptions, streaming, SaaS, and memberships'),
  ('Other', 'Miscellaneous transactions and unassigned expenses')
on conflict (name) do nothing;

-- Merchant Category Rules Table (Layer 1)
create table if not exists public.merchant_category_rules (
  id uuid primary key default gen_random_uuid(),
  merchant_name text not null unique,
  category text not null,
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

-- Seed standard merchant category mappings
insert into public.merchant_category_rules (merchant_name, category, priority) values
  ('Uber', 'Transport', 10),
  ('Ola', 'Transport', 10),
  ('Rapido', 'Transport', 10),
  ('Swiggy', 'Food', 10),
  ('Zomato', 'Food', 10),
  ('McDonald''s', 'Food', 10),
  ('Starbucks', 'Food', 10),
  ('Domino''s Pizza', 'Food', 10),
  ('KFC', 'Food', 10),
  ('Zepto', 'Groceries', 10),
  ('Blinkit', 'Groceries', 10),
  ('BigBasket', 'Groceries', 10),
  ('DMart', 'Groceries', 10),
  ('Instamart', 'Groceries', 10),
  ('Netflix', 'Subscriptions', 10),
  ('Spotify', 'Subscriptions', 10),
  ('Prime Video', 'Subscriptions', 10),
  ('YouTube Premium', 'Subscriptions', 10),
  ('Disney+ Hotstar', 'Subscriptions', 10),
  ('Apollo Pharmacy', 'Healthcare', 10),
  ('1mg', 'Healthcare', 10),
  ('MedPlus', 'Healthcare', 10),
  ('MakeMyTrip', 'Travel', 10),
  ('IndiGo', 'Travel', 10),
  ('Air India', 'Travel', 10),
  ('IRCTC', 'Travel', 10),
  ('Coursera', 'Education', 10),
  ('Udemy', 'Education', 10),
  ('Airtel', 'Bills & Utilities', 10),
  ('Jio', 'Bills & Utilities', 10),
  ('BESCOM', 'Bills & Utilities', 10),
  ('Zara', 'Clothing', 10),
  ('H&M', 'Clothing', 10),
  ('Myntra', 'Clothing', 10),
  ('Uniqlo', 'Clothing', 10),
  ('Croma', 'Electronics', 10),
  ('Reliance Digital', 'Electronics', 10),
  ('Apple Store', 'Electronics', 10)
on conflict (merchant_name) do nothing;

-- Bill Documents Table
create table if not exists public.bill_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  storage_key text not null,
  original_filename text not null,
  mime_type text not null,
  file_size integer not null check (file_size > 0),
  file_hash text not null, -- SHA-256 for duplicate detection
  processing_status text not null default 'uploaded' check (
    processing_status in ('uploaded', 'ocr_processing', 'extraction_processing', 'classification_processing', 'review_required', 'confirmed', 'failed', 'processing')
  ),
  ocr_status text not null default 'pending',
  extraction_status text not null default 'pending',
  classification_status text not null default 'pending',
  raw_text text,
  extracted_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enhance expenses table with bill upload source & metadata
alter table public.expenses add column if not exists merchant text;
alter table public.expenses add column if not exists currency text default 'INR';
alter table public.expenses add column if not exists source text default 'manual' check (source in ('manual', 'bill_upload', 'import'));
alter table public.expenses add column if not exists bill_document_id uuid references public.bill_documents(id) on delete set null;
alter table public.expenses add column if not exists classification_confidence numeric(4,2);
alter table public.expenses add column if not exists invoice_number text;
alter table public.expenses add column if not exists line_items jsonb default '[]'::jsonb;

-- Classification Feedback Table (User Corrections Learning)
create table if not exists public.classification_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bill_id uuid references public.bill_documents(id) on delete cascade,
  original_category text not null,
  corrected_category text not null,
  merchant text,
  item_summary text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE & DUPLICATE DETECTION
-- ============================================================================

create index if not exists bill_documents_user_id_created_at_idx 
  on public.bill_documents (user_id, created_at desc);

create index if not exists bill_documents_user_file_hash_idx 
  on public.bill_documents (user_id, file_hash);

create index if not exists classification_feedback_user_merchant_idx 
  on public.classification_feedback (user_id, lower(trim(merchant)));

create index if not exists expenses_user_id_date_idx 
  on public.expenses (user_id, expense_date desc);

create index if not exists expenses_user_bill_doc_idx 
  on public.expenses (user_id, bill_document_id);

-- ============================================================================
-- 7. RLS POLICIES FOR BILL DOCUMENTS & FEEDBACK
-- ============================================================================

alter table public.categories enable row level security;
alter table public.merchant_category_rules enable row level security;
alter table public.bill_documents enable row level security;
alter table public.classification_feedback enable row level security;

create policy "categories are publicly readable" on public.categories
  for select using (true);

create policy "merchant rules are publicly readable" on public.merchant_category_rules
  for select using (true);

create policy "bill_documents user isolation" on public.bill_documents
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "classification_feedback user isolation" on public.classification_feedback
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 8. FEATURE 2 — PAYMENT HISTORY & BANK STATEMENT IMPORT
-- ============================================================================

-- User Accounts (e.g. HDFC Savings, ICICI Credit Card)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  institution_name text not null,
  account_type text not null default 'Savings',
  masked_identifier text not null, -- e.g. 'XXXX1234'
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

-- Merchant Aliases for Canonical Normalization (Section 37)
create table if not exists public.merchant_aliases (
  id uuid primary key default gen_random_uuid(),
  canonical_merchant text not null,
  alias text not null unique,
  category_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed common Indian & Global merchant aliases
insert into public.merchant_aliases (canonical_merchant, alias, category_name) values
  ('Swiggy', 'SWIGGY PVT LTD', 'Food'),
  ('Swiggy', 'SWIGGY*ORDER123', 'Food'),
  ('Swiggy', 'SWIGGY INSTAMART', 'Groceries'),
  ('Swiggy', 'BUNDL TECHNOLOGIES', 'Food'),
  ('Zomato', 'ZOMATO ONLINE', 'Food'),
  ('Zomato', 'ZOMATO LIMITED', 'Food'),
  ('Zomato', 'BLINKIT COMMERCE', 'Groceries'),
  ('Uber', 'UBER INDIA', 'Transport'),
  ('Uber', 'UBER INDIA SYSTEMS', 'Transport'),
  ('Uber', 'UBER TRIP', 'Transport'),
  ('Ola', 'ANI TECHNOLOGIES', 'Transport'),
  ('Ola', 'OLA CABS', 'Transport'),
  ('Amazon', 'AMAZON PAY INDIA', 'Shopping'),
  ('Amazon', 'AMAZON SELLER SERVICES', 'Shopping'),
  ('Flipkart', 'FLIPKART INTERNET', 'Shopping'),
  ('Flipkart', 'FLIPKART PAYMENTS', 'Shopping'),
  ('Zepto', 'KIRANAKART TECHNOLOGIES', 'Groceries'),
  ('Zepto', 'ZEPTO COMMERCE', 'Groceries'),
  ('Netflix', 'NETFLIX ENTERTAINMENT', 'Subscriptions'),
  ('Spotify', 'SPOTIFY INDIA', 'Subscriptions'),
  ('Airtel', 'BHARTI AIRTEL LTD', 'Bills & Utilities'),
  ('Jio', 'RELIANCE JIO INFOCOMM', 'Bills & Utilities'),
  ('Croma', 'INFINITI RETAIL LTD', 'Electronics'),
  ('Reliance Digital', 'RELIANCE DIGITAL RETAIL', 'Electronics'),
  ('Tata 1mg', 'TATA 1MG TECHNOLOGIES', 'Healthcare'),
  ('Apollo Pharmacy', 'APOLLO PHARMACIES LTD', 'Healthcare'),
  ('MakeMyTrip', 'MAKEMYTRIP INDIA PVT', 'Travel'),
  ('IRCTC', 'INDIAN RAILWAY CATERING', 'Travel'),
  ('Zerodha', 'ZERODHA BROKING LTD', 'Invest'),
  ('Groww', 'NEXTBILLION TECHNOLOGY', 'Invest')
on conflict (alias) do nothing;

-- Import Batches (Tracks every uploaded payment history or bank statement)
create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_type text not null check (source_type in ('bank_statement', 'payment_app', 'csv', 'pdf', 'xlsx')),
  source_name text not null, -- 'HDFC', 'Google Pay', 'PhonePe', 'SBI', etc.
  original_filename text not null,
  file_size integer not null default 0,
  file_hash text,
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  created_expenses integer not null default 0,
  review_count integer not null default 0,
  duplicate_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'uploaded' check (
    status in ('uploaded', 'parsing', 'review_required', 'ready_to_import', 'imported', 'partially_imported', 'failed', 'cancelled')
  ),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Staging Table: Imported Transactions (Never write statement directly to expenses!)
create table if not exists public.imported_transactions (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  transaction_date date not null,
  value_date date,
  description text not null,
  merchant text,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'INR',
  direction text not null check (direction in ('debit', 'credit')),
  transaction_type text not null default 'expense' check (
    transaction_type in ('expense', 'income', 'refund', 'transfer', 'cash_withdrawal', 'cash_deposit', 'card_payment', 'subscription', 'investment', 'loan', 'fee', 'unknown')
  ),
  reference_id text, -- UTR, UPI Ref, Cheque Number, or Transaction ID
  suggested_category_id text,
  suggested_category text,
  confidence_score numeric(4,2) default 0.50,
  confidence_level text default 'medium' check (confidence_level in ('high', 'medium', 'low')),
  dedupe_status text not null default 'unique' check (dedupe_status in ('unique', 'possible_duplicate', 'exact_duplicate')),
  dedupe_reason text,
  review_status text not null default 'pending' check (review_status in ('pending', 'accepted', 'edited', 'ignored', 'duplicate', 'invalid')),
  selected_category text,
  expense_id uuid references public.expenses(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Expense Sources (Reconciliation audit trail linking canonical expenses to origin)
create table if not exists public.expense_sources (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete cascade,
  source_type text not null check (source_type in ('bank_statement', 'payment_app', 'bill_upload')),
  source_name text,
  source_transaction_id text,
  source_record_hash text,
  created_at timestamptz not null default now()
);

-- Indexes for Feature 2
create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists merchant_aliases_alias_idx on public.merchant_aliases (lower(trim(alias)));
create index if not exists import_batches_user_id_created_at_idx on public.import_batches (user_id, created_at desc);
create index if not exists imported_transactions_batch_id_idx on public.imported_transactions (import_batch_id);
create index if not exists imported_transactions_user_id_date_idx on public.imported_transactions (user_id, transaction_date desc);
create index if not exists imported_transactions_ref_id_idx on public.imported_transactions (user_id, reference_id);
create index if not exists expense_sources_expense_id_idx on public.expense_sources (expense_id);
create index if not exists expense_sources_batch_id_idx on public.expense_sources (import_batch_id);

-- RLS Policies for Feature 2
alter table public.accounts enable row level security;
alter table public.merchant_aliases enable row level security;
alter table public.import_batches enable row level security;
alter table public.imported_transactions enable row level security;
alter table public.expense_sources enable row level security;

create policy "accounts user isolation" on public.accounts
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "merchant aliases are readable" on public.merchant_aliases
  for select using (true);

create policy "import_batches user isolation" on public.import_batches
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "imported_transactions user isolation" on public.imported_transactions
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "expense_sources user isolation" on public.expense_sources
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


