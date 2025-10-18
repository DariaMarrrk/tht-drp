-- Add imagery_theme column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN imagery_theme TEXT DEFAULT 'space';