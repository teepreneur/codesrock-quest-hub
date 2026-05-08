-- Migration: Add phone_number to profiles
-- Description: Supports searching for teachers by phone number for school pairing.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
