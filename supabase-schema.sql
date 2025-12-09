-- Supabase Database Schema for CivicX
-- Run these SQL commands in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  coords JSONB,
  image TEXT,
  video TEXT,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  type TEXT DEFAULT 'garbage',
  completion_image TEXT,
  completion_notes TEXT,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT,
  recipient_role TEXT,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users (for role management)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: location_references (for admin map images/videos)
CREATE TABLE IF NOT EXISTS location_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL, -- e.g. "pune", "gkvk road"
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_email ON reports(user_email);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_references ENABLE ROW LEVEL SECURITY;

-- Policies for reports table
-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

-- Users can create their own reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT
  WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

-- Admins can update any report
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

-- Policies for notifications table
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (
    recipient_email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = recipient_role
    )
  );

-- Admins can create notifications
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (recipient_email = auth.jwt() ->> 'email');

-- Policies for location_references table
-- Everyone can view location references (or maybe just admins? Assuming mostly admins for map)
-- Let's allow public read for now so it works easily, or restrict to admin. 
-- Given the requirement "accessible by the admin", we will restrict write to admin, read to all or admin.
CREATE POLICY "Everyone can read location references" ON location_references
    FOR SELECT USING (true); -- Public read access for map fallback

CREATE POLICY "Admins can insert location references" ON location_references
    FOR INSERT WITH CHECK (
        EXISTS ( SELECT 1 FROM users WHERE users.email = auth.jwt() ->> 'email' AND users.role = 'admin' )
    );

CREATE POLICY "Admins can update location references" ON location_references
    FOR UPDATE USING (
        EXISTS ( SELECT 1 FROM users WHERE users.email = auth.jwt() ->> 'email' AND users.role = 'admin' )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for reports table
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
