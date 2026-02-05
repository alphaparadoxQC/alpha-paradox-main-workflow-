-- Add category column to quantum_circuits
ALTER TABLE public.quantum_circuits 
ADD COLUMN category text DEFAULT 'Custom' 
CHECK (category IN ('Education', 'Chemistry', 'Algorithms', 'Custom'));

-- Create index for category filtering
CREATE INDEX idx_quantum_circuits_category ON public.quantum_circuits(category);

-- Create circuit_likes table
CREATE TABLE public.circuit_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circuit_id UUID NOT NULL REFERENCES public.quantum_circuits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(circuit_id, user_id)
);

-- Enable RLS on circuit_likes
ALTER TABLE public.circuit_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view like counts (needed for public display)
CREATE POLICY "Anyone can view likes"
ON public.circuit_likes
FOR SELECT
USING (true);

-- Users can like circuits (must be authenticated)
CREATE POLICY "Users can like circuits"
ON public.circuit_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can unlike circuits"
ON public.circuit_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster like counts
CREATE INDEX idx_circuit_likes_circuit_id ON public.circuit_likes(circuit_id);
CREATE INDEX idx_circuit_likes_user_id ON public.circuit_likes(user_id);