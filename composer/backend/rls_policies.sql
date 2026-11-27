-- Alpha Paradox Enterprise - Row Level Security (RLS) Policies
-- This file configures Supabase for strictly isolated enterprise workspaces.

-- Enable RLS on core tables
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analog_presets ENABLE ROW LEVEL SECURITY;

-- 1. Workspace Isolation for Notebooks
CREATE POLICY "Users can only see their own workspace notebooks"
ON public.notebooks
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT member_id FROM workspace_members WHERE workspace_id = notebooks.workspace_id
));

CREATE POLICY "Users can insert notebooks into their workspaces"
ON public.notebooks
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
    SELECT member_id FROM workspace_members WHERE workspace_id = notebooks.workspace_id
));

-- 2. Enterprise SSO / SAML Enforcement 
-- (Assuming auth.users has an 'is_sso' custom claim via Supabase Hooks)
CREATE POLICY "Strict SSO requirement for Alpha cluster jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'is_sso')::boolean = true
    AND (auth.uid() = user_id)
);

-- 3. Read access for simulation jobs
CREATE POLICY "Users can read their own jobs"
ON public.jobs
FOR SELECT
USING (auth.uid() = user_id);
