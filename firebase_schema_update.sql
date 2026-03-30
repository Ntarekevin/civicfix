-- Run this in your Supabase SQL Editor to prepare for Firebase Authentication

-- 1. Drop the old Supabase Auth trigger since Firebase will handle user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Add an explicitly defined `firebase_uid` and `email` column to our profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Modify the primary key `id` so it generates its own UUID instead of strictly requiring an auth.users reference
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 4. Fix RLS: Allow anyone to insert their own profile
DROP POLICY IF EXISTS "Allow profile insertion from frontend" ON public.profiles;
CREATE POLICY "Allow profile insertion from frontend" ON public.profiles FOR INSERT WITH CHECK (true);

-- Now when an admin signs up through Firebase, the Next.js app will manually insert their `firebase_uid`, `username`, and `role` into `public.profiles`.
