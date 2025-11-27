/*
  # Civic Complaint Management System Database Schema

  ## Overview
  Complete database structure for AI-powered civic complaint system with citizen and admin portals.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text, not null)
  - `phone` (text)
  - `role` (text, default 'citizen') - 'citizen' or 'admin'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `departments`
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) - e.g., 'Sanitation', 'Public Works', 'Electrical'
  - `description` (text)
  - `contact_email` (text)
  - `contact_phone` (text)
  - `created_at` (timestamptz)

  ### `complaint_categories`
  - `id` (uuid, primary key)
  - `name` (text, unique, not null) - 'garbage_overflow', 'broken_street_light', 'pothole'
  - `display_name` (text, not null)
  - `department_id` (uuid, references departments)
  - `ai_keywords` (text[]) - keywords for AI classification
  - `created_at` (timestamptz)

  ### `complaints`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `category_id` (uuid, references complaint_categories)
  - `department_id` (uuid, references departments)
  - `title` (text, not null)
  - `description` (text, not null)
  - `location` (text, not null)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `image_url` (text)
  - `status` (text, default 'pending') - 'pending', 'assigned', 'in_progress', 'resolved', 'rejected'
  - `priority` (integer, default 5) - 1-10, higher = more urgent
  - `ai_category_confidence` (numeric) - AI confidence score 0-1
  - `ai_detected_category` (text) - AI suggested category
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `resolved_at` (timestamptz)

  ### `complaint_history`
  - `id` (uuid, primary key)
  - `complaint_id` (uuid, references complaints)
  - `action` (text, not null) - 'created', 'status_changed', 'assigned', 'resolved'
  - `old_value` (text)
  - `new_value` (text)
  - `notes` (text)
  - `actor_id` (uuid, references profiles)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Citizens can view and create their own complaints
  - Admins can view and manage all complaints
  - Public can view departments and categories
  - Only admins can modify departments and categories

  ## 3. Indexes
  - Index on complaints(user_id) for fast user queries
  - Index on complaints(status) for filtering
  - Index on complaints(category_id) for categorization
  - Index on complaints(created_at) for sorting
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now()
);

-- Create complaint_categories table
CREATE TABLE IF NOT EXISTS complaint_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ai_keywords text[],
  created_at timestamptz DEFAULT now()
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES complaint_categories(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'rejected')),
  priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  ai_category_confidence numeric CHECK (ai_category_confidence >= 0 AND ai_category_confidence <= 1),
  ai_detected_category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create complaint_history table
CREATE TABLE IF NOT EXISTS complaint_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_value text,
  new_value text,
  notes text,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category_id ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_history_complaint_id ON complaint_history(complaint_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Departments policies (public read, admin write)
CREATE POLICY "Anyone can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Complaint categories policies (public read, admin write)
CREATE POLICY "Anyone can view categories"
  ON complaint_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON complaint_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Complaints policies
CREATE POLICY "Users can view own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can create own complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Complaint history policies
CREATE POLICY "Users can view own complaint history"
  ON complaint_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM complaints
      WHERE complaints.id = complaint_history.complaint_id
      AND complaints.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all complaint history"
  ON complaint_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create complaint history"
  ON complaint_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default departments
INSERT INTO departments (name, description, contact_email, contact_phone) VALUES
  ('Sanitation', 'Handles waste management and garbage collection', 'sanitation@civic.gov', '555-0001'),
  ('Public Works', 'Manages road maintenance and infrastructure', 'publicworks@civic.gov', '555-0002'),
  ('Electrical', 'Handles street lights and electrical infrastructure', 'electrical@civic.gov', '555-0003')
ON CONFLICT (name) DO NOTHING;

-- Insert default complaint categories
INSERT INTO complaint_categories (name, display_name, department_id, ai_keywords)
SELECT
  'garbage_overflow',
  'Garbage Overflow',
  (SELECT id FROM departments WHERE name = 'Sanitation'),
  ARRAY['garbage', 'trash', 'waste', 'overflow', 'bin', 'dumpster', 'rubbish', 'litter']
WHERE NOT EXISTS (SELECT 1 FROM complaint_categories WHERE name = 'garbage_overflow');

INSERT INTO complaint_categories (name, display_name, department_id, ai_keywords)
SELECT
  'broken_street_light',
  'Broken Street Light',
  (SELECT id FROM departments WHERE name = 'Electrical'),
  ARRAY['street light', 'lamp', 'light post', 'lighting', 'broken light', 'dark', 'pole']
WHERE NOT EXISTS (SELECT 1 FROM complaint_categories WHERE name = 'broken_street_light');

INSERT INTO complaint_categories (name, display_name, department_id, ai_keywords)
SELECT
  'pothole',
  'Pothole',
  (SELECT id FROM departments WHERE name = 'Public Works'),
  ARRAY['pothole', 'road', 'street', 'crack', 'pavement', 'asphalt', 'hole', 'damage']
WHERE NOT EXISTS (SELECT 1 FROM complaint_categories WHERE name = 'pothole');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
