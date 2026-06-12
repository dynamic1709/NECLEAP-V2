-- NECLEAP V2 Supabase Database Schema

-- Drop tables if they exist (Be careful in production)
-- DROP TABLE IF EXISTS activity_logs;
-- DROP TABLE IF EXISTS pdfs;
-- DROP TABLE IF EXISTS subjects;
-- DROP TABLE IF EXISTS profiles;

-- 1. Profiles Table (linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('super_admin', 'teacher_admin')) DEFAULT 'teacher_admin',
    department TEXT,
    designation TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    branch TEXT NOT NULL, -- CSE, AIML, AI, DS, IT, ECE, EEE, MECH, CIVIL
    year TEXT NOT NULL, -- 1, 2, 3, 4
    semester TEXT NOT NULL, -- 1, 2
    subject_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 3. PDFs Table
CREATE TABLE IF NOT EXISTS pdfs (
    id BIGSERIAL PRIMARY KEY,
    teacher_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,
    semester TEXT NOT NULL,
    subject TEXT NOT NULL,
    pdf_title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    storage_url TEXT NOT NULL,
    downloads INTEGER DEFAULT 0 NOT NULL,
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending' NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Setup Row Level Security Policies

-- Profiles:
-- Public can read profiles (or restrict to authenticated)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admin can do everything on profiles" ON profiles 
    FOR ALL USING (
        ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin')
    );


-- Subjects:
-- Public can select subjects
CREATE POLICY "Subjects are viewable by everyone" ON subjects 
    FOR SELECT USING (true);

-- Admins can manage subjects (both super_admin and teacher_admin)
CREATE POLICY "Admins can manage subjects" ON subjects 
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('super_admin', 'teacher_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('super_admin', 'teacher_admin')
        )
    );

-- PDFs:
-- Public can select approved PDFs
CREATE POLICY "Approved PDFs are viewable by everyone" ON pdfs 
    FOR SELECT USING (status = 'Approved');

-- Teachers can view their own pending/rejected PDFs
CREATE POLICY "Users can view their own PDFs" ON pdfs 
    FOR SELECT USING (auth.uid() = uploaded_by);

-- Admins can view all PDFs
CREATE POLICY "Admins can view all PDFs" ON pdfs 
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('super_admin', 'teacher_admin')
        )
    );

-- Teachers/Admins can insert PDFs
CREATE POLICY "Authenticated users can insert PDFs" ON pdfs 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Teachers can update their own PDFs
CREATE POLICY "Users can update their own PDFs" ON pdfs 
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Admins can update any PDF (e.g. approve/reject)
CREATE POLICY "Admins can update any PDF" ON pdfs 
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('super_admin', 'teacher_admin')
        )
    );

-- Admins or owner can delete PDF
CREATE POLICY "Admins or owners can delete PDFs" ON pdfs 
    FOR DELETE TO authenticated
    USING (
        auth.uid() = uploaded_by OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('super_admin', 'teacher_admin')
        )
    );

-- Activity Logs:
-- Only admins can read/write logs
CREATE POLICY "Admins can view logs" ON activity_logs 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert logs" ON activity_logs 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'New Teacher'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'teacher_admin')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
