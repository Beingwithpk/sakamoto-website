-- ====================================================================
-- SAKAMOTO SUPABASE DATABASE SCHEMA
-- Run this in the Supabase SQL Editor to initialize your database
-- ====================================================================

-- 1. Create a table for user profiles linked to Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Allow public read access to profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow users to update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'avatar_url', 
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || new.id::text
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create a table for Cart Items
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id integer not null,
  name text not null,
  price numeric not null,
  image text not null,
  category text not null,
  quantity integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicates for the same user & product
  constraint cart_user_product_unique unique (user_id, product_id)
);

-- Enable RLS on cart_items
alter table public.cart_items enable row level security;

-- Create policies for cart_items
create policy "Users can view their own cart items"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cart items"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cart items"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cart items"
  on public.cart_items for delete
  using (auth.uid() = user_id);


-- 3. Create a table for Wishlist Items
create table public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id integer not null,
  name text not null,
  price numeric not null,
  image text not null,
  category text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent duplicates for the same user & product
  constraint wishlist_user_product_unique unique (user_id, product_id)
);

-- Enable RLS on wishlist_items
alter table public.wishlist_items enable row level security;

-- Create policies for wishlist_items
create policy "Users can view their own wishlist items"
  on public.wishlist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wishlist items"
  on public.wishlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own wishlist items"
  on public.wishlist_items for delete
  using (auth.uid() = user_id);


-- 4. Add is_admin flag to public.profiles table
alter table public.profiles add column if not exists is_admin boolean default false;


-- 5. Create products table
create table if not exists public.products (
  id serial primary key,
  name text not null,
  price numeric not null,
  category text not null,
  image text not null,
  is_new boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on products
alter table public.products enable row level security;

-- Create policies for products
create policy "Allow public read access to products"
  on public.products for select
  using (true);

create policy "Allow admin to manage products"
  on public.products for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Seed initial products if the table is empty
insert into public.products (id, name, price, category, image, is_new) values
  (1, 'Oversized Essential Tee', 3999, 'Tops', '/images/product-tee-black.png', true),
  (2, 'Heavyweight Hoodie', 7999, 'Outerwear', '/images/product-hoodie.png', true),
  (3, 'Utility Cargo Pants', 6499, 'Bottoms', '/images/product-cargo.png', false),
  (4, 'Bomber Jacket', 12999, 'Outerwear', '/images/product-jacket.png', true),
  (5, 'Kanji Print Tee', 4299, 'Tops', '/images/product-tee-white.png', false),
  (6, 'Wide-Leg Trousers', 5999, 'Bottoms', '/images/product-pants.png', false),
  (7, 'Canvas Overshirt', 8499, 'Outerwear', '/images/product-overshirt.png', true),
  (8, 'Merino Knit Sweater', 9999, 'Knitwear', '/images/product-knit.png', false)
on conflict (id) do nothing;

-- Reset the serial sequence to match the max id
select setval(pg_get_serial_sequence('public.products', 'id'), coalesce((select max(id) from public.products), 1));

