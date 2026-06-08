-- =============================================
-- Migration: Add status and is_active to training_sessions
-- =============================================
-- Run this in the Supabase SQL Editor
-- =============================================

-- Add columns to training_sessions
ALTER TABLE training_sessions 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled'));

-- Update any existing rows to have default values
UPDATE training_sessions 
SET 
  is_active = COALESCE(is_active, true),
  status = COALESCE(status, 'scheduled');
