-- Add forked_from column to quantum_circuits for tracking attribution
ALTER TABLE public.quantum_circuits 
ADD COLUMN forked_from UUID REFERENCES public.quantum_circuits(id) ON DELETE SET NULL;

-- Add fork_count column for quick access (denormalized for performance)
ALTER TABLE public.quantum_circuits 
ADD COLUMN fork_count INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient fork lookups
CREATE INDEX idx_quantum_circuits_forked_from ON public.quantum_circuits(forked_from);

-- Create function to increment fork count
CREATE OR REPLACE FUNCTION public.increment_fork_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.forked_from IS NOT NULL THEN
    UPDATE public.quantum_circuits 
    SET fork_count = fork_count + 1 
    WHERE id = NEW.forked_from;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-increment fork count
CREATE TRIGGER on_circuit_fork
AFTER INSERT ON public.quantum_circuits
FOR EACH ROW
EXECUTE FUNCTION public.increment_fork_count();