-- Fix profiles table RLS policies

-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2. Create new SELECT policy requiring authentication
-- Users can view all profiles but only when authenticated
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Add INSERT policy allowing users to create their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Add DELETE policy allowing users to delete their own profile
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = id);