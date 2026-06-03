import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const QubitWarningBanner = () => {
  const { qubitCount } = useQuantumCircuitStore();

  if (qubitCount < 16) return null;

  const message =
    qubitCount >= 50
      ? `${qubitCount}-qubit MPS simulation — may take 10-60s depending on circuit depth`
      : qubitCount >= 21
      ? 'Very large circuit — QPU submission recommended for accuracy'
      : 'Large circuit — simulation may be slow';

  return (
    <Alert className="rounded-none border-x-0 border-amber-500/40 bg-amber-500/10 [&>svg]:text-amber-500 py-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-xs text-amber-500">
        {message}
      </AlertDescription>
    </Alert>
  );
};
