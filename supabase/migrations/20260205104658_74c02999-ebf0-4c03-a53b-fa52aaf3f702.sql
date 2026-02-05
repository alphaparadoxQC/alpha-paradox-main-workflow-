-- Create quantum_jobs table for IBM Quantum job tracking
CREATE TABLE public.quantum_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  circuit_id UUID REFERENCES public.quantum_circuits(id) ON DELETE SET NULL,
  job_id TEXT NOT NULL,
  backend TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitting',
  qubit_count INTEGER NOT NULL,
  shots INTEGER NOT NULL DEFAULT 1024,
  qasm TEXT,
  local_results JSONB,
  hardware_results JSONB,
  queue_position INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quantum_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.quantum_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create their own jobs"
  ON public.quantum_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
  ON public.quantum_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON public.quantum_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_quantum_jobs_updated_at
  BEFORE UPDATE ON public.quantum_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_quantum_jobs_user_id ON public.quantum_jobs(user_id);
CREATE INDEX idx_quantum_jobs_status ON public.quantum_jobs(status);
CREATE INDEX idx_quantum_jobs_job_id ON public.quantum_jobs(job_id);