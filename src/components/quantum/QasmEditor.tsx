import { useState, useEffect } from 'react';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { Button } from '@/components/ui/button';
import { Code, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const QasmEditor = () => {
  const { getQASM, setFromQASM, gates, qubitCount, classicalBitCount } = useQuantumCircuitStore();
  const [qasm, setQasm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync from store to editor when not actively typing
  useEffect(() => {
    if (!isEditing) {
      setQasm(getQASM());
      setError(null);
    }
  }, [gates, qubitCount, classicalBitCount, getQASM, isEditing]);

  const handleApply = () => {
    try {
      setFromQASM(qasm);
      setError(null);
      toast.success('Circuit updated from QASM');
      setIsEditing(false); // Reset to allow auto-sync again
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid QASM syntax';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">OpenQASM 2.0</h3>
        </div>
        <div className="flex items-center gap-2">
          {error && <span title={error}><AlertCircle className="w-4 h-4 text-destructive" /></span>}
          {!error && !isEditing && <span title="Synced"><CheckCircle className="w-4 h-4 text-green-500" /></span>}
          <Button 
            size="sm" 
            variant="default"
            onClick={handleApply}
            disabled={!isEditing}
          >
            Apply Changes
          </Button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <textarea
          className="absolute inset-0 w-full h-full p-4 font-mono text-xs md:text-sm bg-transparent resize-none outline-none focus:ring-1 focus:ring-inset focus:ring-accent leading-relaxed whitespace-pre"
          value={qasm}
          onChange={(e) => {
            setQasm(e.target.value);
            setIsEditing(true);
            setError(null);
          }}
          spellCheck="false"
          placeholder="OPENQASM 2.0;&#10;include &#34;qelib1.inc&#34;;&#10;"
        />
      </div>
    </div>
  );
};
