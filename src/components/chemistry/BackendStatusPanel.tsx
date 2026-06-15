import { useEffect, useState } from 'react';
import { ChemistryAPI, BackendStatus } from '@/lib/chemistry/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function BackendStatusPanel() {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    ChemistryAPI.getStatus()
      .then(setStatus)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <Activity className="w-5 h-5" />
            <p className="font-semibold">Backend Offline</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            The Python chemistry backend is not reachable. Ensure it is running on port 8000.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return <Skeleton className="h-[120px] w-full rounded-xl" />;
  }

  const renderBadge = (state: string) => {
    if (state === 'available' || state === 'configured') {
      return <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20">{state}</Badge>;
    }
    return <Badge variant="secondary" className="text-muted-foreground">{state}</Badge>;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-4 border-b border-border/50 mb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          Backend Technology Stack
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">RDKit</p>
          {renderBadge(status.rdkit)}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">PySCF</p>
          {renderBadge(status.pyscf)}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Psi4</p>
          {renderBadge(status.psi4)}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">OpenFermion</p>
          {renderBadge(status.openfermion)}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">Qiskit Nature</p>
          {renderBadge(status.qiskit_nature)}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-foreground">PennyLane</p>
          {renderBadge(status.pennylane_qchem)}
        </div>
      </CardContent>
    </Card>
  );
}
