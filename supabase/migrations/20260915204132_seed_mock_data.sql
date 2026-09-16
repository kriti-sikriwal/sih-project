/*
# Seed SkillBridge with initial mock data

## Purpose
Populates the jobs and profiles tables with the same sample data that was
previously hardcoded in the React prototype, so dashboards aren't empty
before real users sign up.

## Changes
1. Inserts 5 seed jobs (internships and full-time roles) into the jobs table.
   All have recruiter_id = null (no owning recruiter).
2. Inserts 3 seed student profiles into the profiles table.
   All have user_id = null and is_seed = true (read-only under RLS).

## Notes
- Seed rows are immutable under RLS: user_id / recruiter_id is null, so no
  authenticated user can modify or delete them.
- These rows match the original MOCK_JOBS and MOCK_STUDENTS arrays from the
  prototype exactly.
*/

-- Seed jobs
INSERT INTO jobs (id, title, company, type, location, stipend, skills, recruiter_id)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Frontend Engineering Intern', 'Nimbus Cloudworks', 'Internship', 'Bengaluru · Hybrid', '₹18,000/mo', '{HTML,CSS,JavaScript,React}', null),
  ('a0000000-0000-0000-0000-000000000002', 'Data Analyst Trainee', 'Vantara Analytics', 'Internship', 'Remote', '₹15,000/mo', '{SQL,Excel,"Power BI",Statistics}', null),
  ('a0000000-0000-0000-0000-000000000003', 'Associate Backend Developer', 'Kavach Systems', 'Full-time', 'Pune · On-site', '₹6.5 LPA', '{Java,SQL,"REST APIs",Git}', null),
  ('a0000000-0000-0000-0000-000000000004', 'UX Design Intern', 'Studio Aakar', 'Internship', 'Mumbai · Hybrid', '₹12,000/mo', '{Figma,Wireframing,"User Research"}', null),
  ('a0000000-0000-0000-0000-000000000005', 'Cloud Support Intern', 'OrbitNine Technologies', 'Internship', 'Remote', '₹20,000/mo', '{AWS,Linux,Networking}', null)
ON CONFLICT (id) DO NOTHING;

-- Seed student profiles
INSERT INTO profiles (id, user_id, role, email, name, username, college, department, year, skills, gaps, interests, is_seed)
VALUES
  ('b0000000-0000-0000-0000-000000000001', null, 'student', 'ananya.rao@example.edu', 'Ananya Rao', 'ananya.rao', 'SRM Institute of Technology', 'Computer Science', '3rd Year',
    '{Python,SQL,Excel,Statistics}', '{"Power BI","Data Visualization"}', '{"Data Analyst"}', true),
  ('b0000000-0000-0000-0000-000000000002', null, 'student', 'rohit.malhotra@example.edu', 'Rohit Malhotra', 'rohit.malhotra', 'VIT Vellore', 'Information Technology', '4th Year',
    '{HTML,CSS,JavaScript,Git}', '{React,"REST APIs"}', '{"Frontend Developer"}', true),
  ('b0000000-0000-0000-0000-000000000003', null, 'student', 'fatima.sheikh@example.edu', 'Fatima Sheikh', 'fatima.sheikh', 'MIT-WPU Pune', 'Design', '2nd Year',
    '{Figma,Wireframing}', '{"User Research",Prototyping}', '{"UI/UX Designer"}', true)
ON CONFLICT (id) DO NOTHING;
