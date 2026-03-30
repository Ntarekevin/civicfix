-- ============================================================
-- CIVIFIX v2 SUPABASE SCHEMA & RLS POLICIES
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- 1. Create Custom Types
CREATE TYPE report_status AS ENUM ('open', 'in-progress', 'resolved', 'rejected', 'escalated');
CREATE TYPE user_role AS ENUM ('citizen', 'official', 'authority', 'admin');

-- 2. Create Tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'official'::user_role,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  tracking_token TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  status report_status DEFAULT 'open'::report_status,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.report_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.report_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, ip_address)
);

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_token TEXT,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  is_unread BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.report_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  authority_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, authority_id)
);

-- 3. Row Level Security (RLS) Configuration

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_mentions ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, only admins/auth can update themselves
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Locations: Anyone can read and insert
CREATE POLICY "Locations viewable by everyone" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Locations insertable by everyone" ON public.locations FOR INSERT WITH CHECK (true);

-- Reports: Anyone can read existing reports
CREATE POLICY "Reports viewable by everyone" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Reports insertable by everyone" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Reports updateable by assigned or token" ON public.reports FOR UPDATE USING (true); -- Custom logic handled in RPC or API

-- Media: Anyone can read and insert
CREATE POLICY "Media viewable by everyone" ON public.media FOR SELECT USING (true);
CREATE POLICY "Media insertable by everyone" ON public.media FOR INSERT WITH CHECK (true);

-- Comments: Anyone can read and insert
CREATE POLICY "Comments viewable by everyone" ON public.report_comments FOR SELECT USING (true);
CREATE POLICY "Comments insertable by everyone" ON public.report_comments FOR INSERT WITH CHECK (true);

-- Likes: Anyone can read and insert
CREATE POLICY "Likes viewable by everyone" ON public.report_likes FOR SELECT USING (true);
CREATE POLICY "Likes insertable by everyone" ON public.report_likes FOR INSERT WITH CHECK (true);

-- Notifications: Anyone can read, insert
CREATE POLICY "Notifications viewable by everyone" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Notifications insertable by everyone" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Notifications updatable by everyone" ON public.notifications FOR UPDATE USING (true);

-- Mentions: Anyone can read, insert
CREATE POLICY "Mentions viewable by everyone" ON public.report_mentions FOR SELECT USING (true);
CREATE POLICY "Mentions insertable by everyone" ON public.report_mentions FOR INSERT WITH CHECK (true);

-- 4. Storage Bucket Setup (content)
-- Make sure a bucket named 'content' exists and is Public.
-- Policy for Storage: Anyone can view, Anyone can insert.
-- Note: You might need to adjust these in the Storage UI if SQL doesn't apply to storage directly.

-- 5. Triggers for `updated_at`
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_reports_modtime BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 6. Trigger to automatically create a Profile when a User signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'official')::public.user_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Statistics Functions
CREATE OR REPLACE FUNCTION get_category_stats()
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT category as tag, count(*) as count
  FROM reports
  GROUP BY category;
END;
$$ LANGUAGE plpgsql;

-- Done!
