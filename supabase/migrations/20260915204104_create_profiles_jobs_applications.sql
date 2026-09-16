/*
# Create profiles, jobs, and applications tables for SkillBridge

## Purpose
Transforms SkillBridge from an in-memory prototype into a full-stack multi-user
application with persistent data storage and Supabase Auth integration.

## New Tables

### 1. profiles
Stores one row per user, linked to Supabase Auth. Also holds seed/sample student
data (is_seed = true) that dashboards display before real users sign up.
- id (uuid PK, auto-generated)
- user_id (uuid, nullable, unique — references auth.users; null for seed data)
- role (text — 'student', 'recruiter', 'faculty', or 'placement')
- email (text)
- name (text)
- username (text)
- college (text)
- department (text)
- year (text — student-specific)
- industry (text — recruiter-specific)
- designation (text — faculty/placement-specific)
- skills (text[] — known skills)
- gaps (text[] — skills to learn / improvement areas)
- interests (text[] — career goals)
- required_skills (text[] — skills a recruiter hires for)
- portfolio (jsonb — { headline, bio, projects, links })
- is_seed (boolean, default false — flags sample data)
- created_at (timestamptz, default now())

### 2. jobs
Stores job and internship postings. Seed jobs have recruiter_id = null.
- id (uuid PK)
- title (text)
- company (text)
- type (text — 'Internship' or 'Full-time')
- location (text)
- stipend (text)
- skills (text[] — required skills)
- recruiter_id (uuid, nullable — references auth.users; null for seed jobs)
- created_at (timestamptz, default now())

### 3. applications
Tracks student applications to jobs with status progression.
- id (uuid PK)
- job_id (uuid — references jobs(id) ON DELETE CASCADE)
- student_id (uuid — default auth.uid(), the applicant)
- student_name (text — denormalized for display)
- job_title (text — denormalized for display)
- company (text — denormalized for display)
- status (text — default 'Applied')
- created_at (timestamptz, default now())

## Security — Row Level Security

All three tables have RLS enabled.

### profiles
- SELECT: all authenticated users (portal design — recruiters, faculty, placement
  need to see student profiles)
- INSERT: own profile only (auth.uid() = user_id)
- UPDATE: own profile only (auth.uid() = user_id)
- DELETE: own profile only (auth.uid() = user_id)
Seed rows have user_id = null so no authenticated user can modify or delete them.

### jobs
- SELECT: all authenticated users (everyone browses jobs)
- INSERT: recruiter posting it (auth.uid() = recruiter_id)
- UPDATE: owning recruiter (auth.uid() = recruiter_id)
- DELETE: owning recruiter (auth.uid() = recruiter_id)

### applications
- SELECT: all authenticated users (students see their own, recruiters see apps
  on their jobs, placement sees all)
- INSERT: student applying (auth.uid() = student_id)
- UPDATE: all authenticated (for future status advancement by recruiters/placement)
- DELETE: owning student only (auth.uid() = student_id)

## Notes
1. Passwords are NEVER stored in these tables — Supabase Auth manages them
   securely in auth.users.
2. Seed rows (is_seed = true, user_id = null) are read-only under RLS.
3. The applications.student_id column defaults to auth.uid() so inserts that omit
   it still satisfy the INSERT policy's WITH CHECK.
*/

-- ============================
-- PROFILES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  email text,
  name text,
  username text,
  college text,
  department text,
  year text,
  industry text,
  designation text,
  skills text[] DEFAULT '{}',
  gaps text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  required_skills text[] DEFAULT '{}',
  portfolio jsonb DEFAULT '{"headline":"","bio":"","projects":[],"links":{"github":"","linkedin":""}}'::jsonb,
  is_seed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================
-- JOBS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  type text,
  location text,
  stipend text,
  skills text[] DEFAULT '{}',
  recruiter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_all_authenticated" ON jobs;
CREATE POLICY "jobs_select_all_authenticated"
  ON jobs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs_insert_own_recruiter" ON jobs;
CREATE POLICY "jobs_insert_own_recruiter"
  ON jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "jobs_update_own_recruiter" ON jobs;
CREATE POLICY "jobs_update_own_recruiter"
  ON jobs FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "jobs_delete_own_recruiter" ON jobs;
CREATE POLICY "jobs_delete_own_recruiter"
  ON jobs FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

-- ============================
-- APPLICATIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text,
  job_title text,
  company text,
  status text DEFAULT 'Applied',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select_all_authenticated" ON applications;
CREATE POLICY "applications_select_all_authenticated"
  ON applications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "applications_insert_own_student" ON applications;
CREATE POLICY "applications_insert_own_student"
  ON applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "applications_update_all_authenticated" ON applications;
CREATE POLICY "applications_update_all_authenticated"
  ON applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "applications_delete_own_student" ON applications;
CREATE POLICY "applications_delete_own_student"
  ON applications FOR DELETE TO authenticated USING (auth.uid() = student_id);
