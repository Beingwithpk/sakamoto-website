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


-- 4. Add is_admin, phone and shipping_address to public.profiles table
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists shipping_address jsonb;



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


-- 6. Create orders table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_email text not null,
  customer_name text not null,
  shipping_address jsonb not null,
  subtotal numeric not null,
  shipping_cost numeric not null,
  total numeric not null,
  status text default 'paid' not null,
  payment_method text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on orders
alter table public.orders enable row level security;

-- Create policies for orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Allow admins to select all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Anyone can insert orders"
  on public.orders for insert
  with check (true);


-- 7. Create order_items table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  product_id integer not null,
  name text not null,
  price numeric not null,
  image text not null,
  category text not null,
  quantity integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on order_items
alter table public.order_items enable row level security;

-- Create policies for order_items
create policy "Users can view order items for their own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Allow admins to select all order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Anyone can insert order items"
  on public.order_items for insert
  with check (true);


-- 8. Add stock_quantity to products table
alter table public.products add column if not exists stock_quantity integer default 10;

-- 9. Create FAQs table
create table if not exists public.faqs (
  id serial primary key,
  question text not null,
  answer text not null,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on faqs
alter table public.faqs enable row level security;

-- Create policies for faqs
create policy "Allow public read access to faqs" 
  on public.faqs for select 
  using (true);

create policy "Allow admins to manage faqs" 
  on public.faqs for all
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

-- Seed initial FAQs if the table is empty
insert into public.faqs (id, question, answer, display_order) values
  (1, 'What is your shipping policy?', 'We offer standard and express shipping options. Standard shipping (3–5 business days) is free on all orders above ₹15,000, otherwise ₹250. Express shipping (1–2 business days) is available for flat ₹600.', 1),
  (2, 'How do I return or exchange my order?', 'We accept returns and exchanges on unworn, unwashed items in their original packaging with tags attached within 14 days of delivery. Please contact our support team to register your request.', 2),
  (3, 'Are your streetwear collections unisex?', 'Yes, all SAKAMOTO collections feature gender-neutral patterns and relaxed oversized fits designed for modern unisex styling. Please refer to our Size Guide for detailed measurements.', 3),
  (4, 'How should I wash and care for my items?', 'To preserve premium Japanese cotton prints, we recommend washing garments inside out in cold water with similar colors. Line dry or tumble dry low. Do not iron directly on graphics or embroideries.', 4),
  (5, 'Do you release limited drops?', 'Yes, we release limited-edition drops throughout the year. Once an item in a drop is sold out, it is rarely restocked. Follow our newsletter and marquee ticker for release dates.', 5)
on conflict (id) do nothing;

-- Reset serial sequence
select setval(pg_get_serial_sequence('public.faqs', 'id'), coalesce((select max(id) from public.faqs), 1));




