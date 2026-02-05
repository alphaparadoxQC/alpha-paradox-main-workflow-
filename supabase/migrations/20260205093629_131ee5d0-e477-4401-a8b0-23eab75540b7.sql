-- ============================================================
-- QUANTUM CIRCUITS TABLE
-- ============================================================
-- This table stores user-created quantum circuits with their
-- gate configurations, qubit counts, and metadata.
-- 
-- The circuit_data JSONB column stores the full circuit state:
-- - gates: Array of QuantumGate objects with positions
-- - connections: Control/target relationships for multi-qubit gates
-- ============================================================

CREATE TABLE public.quantum_circuits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  circuit_data JSONB NOT NULL DEFAULT '{"gates": []}'::jsonb,
  qubit_count INTEGER NOT NULL DEFAULT 5,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS to ensure users can only access their own circuits
-- or public circuits shared by others.
-- ============================================================

ALTER TABLE public.quantum_circuits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICY: Users can view their own circuits
-- ============================================================
-- Authenticated users can SELECT rows where they are the owner.
-- ============================================================
CREATE POLICY "Users can view their own circuits"
  ON public.quantum_circuits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- POLICY: Anyone can view public circuits
-- ============================================================
-- Any authenticated user can SELECT rows marked as public.
-- This enables circuit sharing functionality.
-- ============================================================
CREATE POLICY "Anyone can view public circuits"
  ON public.quantum_circuits
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- ============================================================
-- POLICY: Users can create their own circuits
-- ============================================================
-- Authenticated users can INSERT rows only if they set user_id
-- to their own auth.uid(). Prevents creating circuits for others.
-- ============================================================
CREATE POLICY "Users can create their own circuits"
  ON public.quantum_circuits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICY: Users can update their own circuits
-- ============================================================
-- Authenticated users can UPDATE only rows they own.
-- ============================================================
CREATE POLICY "Users can update their own circuits"
  ON public.quantum_circuits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POLICY: Users can delete their own circuits
-- ============================================================
-- Authenticated users can DELETE only rows they own.
-- ============================================================
CREATE POLICY "Users can delete their own circuits"
  ON public.quantum_circuits
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================
-- Automatically sets updated_at to current time on any UPDATE.
-- Uses the existing update_updated_at_column function if available,
-- or creates it if not.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_quantum_circuits_updated_at
  BEFORE UPDATE ON public.quantum_circuits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INDEX: Faster lookups by user_id
-- ============================================================
-- Speeds up queries filtering by user_id (common pattern).
-- ============================================================
CREATE INDEX idx_quantum_circuits_user_id ON public.quantum_circuits(user_id);

-- ============================================================
-- INDEX: Faster lookups for public circuits
-- ============================================================
-- Speeds up queries for browsing public circuits.
-- ============================================================
CREATE INDEX idx_quantum_circuits_is_public ON public.quantum_circuits(is_public) WHERE is_public = true;