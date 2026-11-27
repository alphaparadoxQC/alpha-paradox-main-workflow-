-- Supabase Schema for Notebook Storage

CREATE TABLE public.notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) Policies
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notebooks"
    ON public.notebooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notebooks"
    ON public.notebooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks"
    ON public.notebooks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks"
    ON public.notebooks FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Create a trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notebooks_modtime
BEFORE UPDATE ON public.notebooks
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ─── Quantum Simulation Jobs Table ──────────────────────────────────────────
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    circuit_name TEXT,
    circuit_json JSONB NOT NULL,
    processor TEXT DEFAULT 'CPU',
    backend TEXT DEFAULT 'statevector',
    shots INTEGER DEFAULT 1024,
    noise_config JSONB,
    status TEXT DEFAULT 'PENDING',
    progress INTEGER DEFAULT 0,
    result JSONB,
    error TEXT,
    celery_task_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- RLS for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
    ON public.jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
    ON public.jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE TRIGGER update_jobs_modtime
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
