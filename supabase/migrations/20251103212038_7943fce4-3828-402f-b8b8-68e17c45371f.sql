-- Add onboarding and tutorial fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tutorial_flags JSONB DEFAULT '{}'::jsonb;

-- Update dose_instances status to include 'missed' if not already present
-- This is handled by the existing enum, just documenting it's already supported