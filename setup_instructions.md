# Supabase & Local Setup Instructions

Follow these exact steps to configure your backend for the Smart Asset Scanner.

## 1. Database Setup (SQL Editor)

Run the following SQL in your Supabase Dashboard's **SQL Editor** to create the `assets` table and enable RLS (Row Level Security).

```sql
-- 1. Create the assets table
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  "productName" text not null,
  "storeName" text,
  "purchaseDate" date,
  "price" numeric,
  "currency" text default 'USD',
  "warrantyDurationMonths" int default 0,
  "receiptUrl" text,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null default auth.uid()
);

-- 2. Enable Row Level Security (RLS)
alter table public.assets enable row level security;

-- 3. Create Policies
-- Allow users to insert their own assets
create policy "Users can insert their own assets"
on public.assets for insert
with check ( auth.uid() = user_id );

-- Allow users to view their own assets
create policy "Users can view their own assets"
on public.assets for select
using ( auth.uid() = user_id );

-- Allow users to delete their own assets
create policy "Users can delete their own assets"
on public.assets for delete
using ( auth.uid() = user_id );

-- Allow users to update their own assets
create policy "Users can update their own assets"
on public.assets for update
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );
```

## 2. Storage Setup (SQL Editor)

Run this SQL to create the storage bucket for receipts and set up access policies.

```sql
-- 1. Create a new storage bucket called 'receipts'
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true);

-- 2. Policy: Allow authenticated users to upload files
create policy "Authenticated users can upload receipts"
on storage.objects for insert
with check (
  bucket_id = 'receipts' 
  and auth.role() = 'authenticated'
);

-- 3. Policy: Allow anyone to view receipts (since they are public links)
-- Alternatively, restrict this if you want private links only
create policy "Public can view receipts"
on storage.objects for select
using ( bucket_id = 'receipts' );
```

## 3. Edge Function Setup (Terminal)

You need to deploy the `process-warranty` function and set the Gemini API key.

**Prerequisites:**
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
- Logged in via `supabase login`.
- Linked to your project via `supabase link --project-ref <your-project-id>`.

**Commands:**

1.  **Set the API Key Secret**:
    Get your key from [Google AI Studio](https://aistudio.google.com/).
    ```bash
    supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
    ```

2.  **Deploy the Function**:
    ```bash
    supabase functions deploy process-warranty --no-verify-jwt
    ```
    *Note: We use `--no-verify-jwt` if you want to call it easily from the client without complex RLS for the function itself, but usually, the client `supabase.functions.invoke` automatically sends the user's JWT. If you enforce JWT verification (default), ensure your client is authenticated.*

## 4. Local Environment

Ensure your `.env.local` contains your Supabase credentials so the frontend can connect.

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
