-- V3 Fresh Database Schema for Israeli Meat Market
-- Designed for matrix price comparison and real market data

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. Meat Categories (בקר, עוף, כבש, etc.)
create table meat_categories (
  id uuid default uuid_generate_v4() primary key,
  name_hebrew text not null unique,
  name_english text not null unique,
  display_order integer not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Meat Cuts (חתכי בשר)
create table meat_cuts (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references meat_categories(id) on delete cascade,
  name_hebrew text not null,
  name_english text,
  description text,
  typical_price_range_min integer, -- in agorot
  typical_price_range_max integer, -- in agorot
  is_popular boolean default false,
  display_order integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Retailers (קמעונאים)
create table retailers (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  type text not null check (type in ('supermarket', 'butcher', 'online', 'wholesale')),
  logo_url text,
  website_url text,
  is_chain boolean default false,
  location_coverage text[], -- areas they serve
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Price Reports (דיווחי מחירים)
create table price_reports (
  id uuid default uuid_generate_v4() primary key,
  meat_cut_id uuid references meat_cuts(id) on delete cascade,
  retailer_id uuid references retailers(id) on delete cascade,
  price_per_kg integer not null, -- in agorot
  is_on_sale boolean default false,
  sale_price_per_kg integer, -- if on sale
  reported_by uuid, -- user who reported (future auth)
  location text, -- specific store location
  confidence_score integer default 5 check (confidence_score between 1 and 5),
  verified_at timestamp with time zone,
  expires_at timestamp with time zone default (now() + interval '7 days'),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Users (for future authentication)
create table user_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  preferred_retailers uuid[] default '{}',
  location text,
  reputation_score integer default 0,
  total_reports integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_meat_cuts_category on meat_cuts(category_id);
create index idx_meat_cuts_active on meat_cuts(is_active);
create index idx_price_reports_cut on price_reports(meat_cut_id);
create index idx_price_reports_retailer on price_reports(retailer_id);
create index idx_price_reports_active on price_reports(is_active);
create index idx_price_reports_expires on price_reports(expires_at);

-- RLS (Row Level Security) policies
alter table meat_categories enable row level security;
alter table meat_cuts enable row level security;
alter table retailers enable row level security;
alter table price_reports enable row level security;
alter table user_profiles enable row level security;

-- Public read access for core tables
create policy "Public read access" on meat_categories for select using (true);
create policy "Public read access" on meat_cuts for select using (true);
create policy "Public read access" on retailers for select using (true);
create policy "Public read access" on price_reports for select using (true);

-- Price reporting policies (authenticated users can insert)
create policy "Authenticated users can insert prices" on price_reports 
  for insert with check (auth.role() = 'authenticated');

-- User profile policies
create policy "Users can view own profile" on user_profiles 
  for select using (auth.uid() = id);
create policy "Users can update own profile" on user_profiles 
  for update using (auth.uid() = id);