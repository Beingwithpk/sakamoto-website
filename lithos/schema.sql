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
      'https://api.dicebear.com/7.x/adventurer/svg?seed=' || encode(hmac(new.email, 'sakamoto-seed', 'sha256'), 'hex')
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
