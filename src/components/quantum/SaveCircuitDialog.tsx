 import { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { Save, Globe, Lock, Loader2, Tag } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
 import { useCircuits, SavedCircuit } from '@/hooks/useCircuits';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 
 type Category = 'Education' | 'Chemistry' | 'Algorithms' | 'Custom';
 
 const CATEGORIES: Category[] = ['Education', 'Chemistry', 'Algorithms', 'Custom'];
 
 interface SaveCircuitDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   existingCircuit?: SavedCircuit | null;
 }
 
 export const SaveCircuitDialog = ({
   open,
   onOpenChange,
   existingCircuit,
 }: SaveCircuitDialogProps) => {
   const { user } = useAuth();
   const { gates, qubitCount } = useQuantumCircuitStore();
   const { saveCircuit, isSaving } = useCircuits();
   
   const [name, setName] = useState('');
   const [description, setDescription] = useState('');
   const [isPublic, setIsPublic] = useState(false);
   const [category, setCategory] = useState<Category>('Custom');
   const [error, setError] = useState('');
 
   useEffect(() => {
     if (existingCircuit) {
       setName(existingCircuit.name);
       setDescription(existingCircuit.description || '');
       setIsPublic(existingCircuit.is_public);
       setCategory((existingCircuit as any).category || 'Custom');
     } else {
       setName('');
       setDescription('');
       setIsPublic(false);
       setCategory('Custom');
     }
     setError('');
   }, [existingCircuit, open]);
 
   const handleSave = async () => {
     if (!name.trim()) {
       setError('Name is required');
       return;
     }
 
     if (!user) {
       toast.error('Please sign in to save circuits');
       return;
     }
 
     const result = await saveCircuit(
       name.trim(),
       description.trim() || null,
       gates,
       qubitCount,
       isPublic,
       existingCircuit?.id,
       category
     );
 
     if (result) {
       toast.success('Saved!', {
         description: `Circuit "${name}" has been saved successfully.`,
       });
       onOpenChange(false);
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Save className="w-5 h-5 text-primary" />
             {existingCircuit ? 'Update Circuit' : 'Save Circuit'}
           </DialogTitle>
           <DialogDescription>
             Save your quantum circuit to access it later.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="circuit-name">Name *</Label>
             <Input
               id="circuit-name"
               placeholder="My Quantum Circuit"
               value={name}
               onChange={(e) => {
                 setName(e.target.value);
                 setError('');
               }}
               className={error ? 'border-destructive' : ''}
             />
             {error && (
               <p className="text-sm text-destructive">{error}</p>
             )}
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="circuit-description">Description</Label>
             <Textarea
               id="circuit-description"
               placeholder="Describe what this circuit does..."
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               rows={3}
             />
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="circuit-category" className="flex items-center gap-2">
               <Tag className="w-4 h-4" />
               Category
             </Label>
             <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
               <SelectTrigger id="circuit-category">
                 <SelectValue placeholder="Select a category" />
               </SelectTrigger>
               <SelectContent>
                 {CATEGORIES.map((cat) => (
                   <SelectItem key={cat} value={cat}>
                     {cat}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="flex items-center justify-between rounded-lg border p-4">
             <div className="space-y-0.5">
               <div className="flex items-center gap-2">
                 {isPublic ? (
                   <Globe className="w-4 h-4 text-primary" />
                 ) : (
                   <Lock className="w-4 h-4 text-muted-foreground" />
                 )}
                 <Label htmlFor="circuit-public">
                   {isPublic ? 'Public' : 'Private'}
                 </Label>
               </div>
               <p className="text-sm text-muted-foreground">
                 {isPublic
                   ? 'Anyone can view this circuit'
                   : 'Only you can view this circuit'}
               </p>
             </div>
             <Switch
               id="circuit-public"
               checked={isPublic}
               onCheckedChange={setIsPublic}
             />
           </div>
 
           <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
             <div className="flex justify-between">
               <span>Gates:</span>
               <span className="font-medium text-foreground">{gates.length}</span>
             </div>
             <div className="flex justify-between">
               <span>Qubits:</span>
               <span className="font-medium text-foreground">{qubitCount}</span>
             </div>
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Saving...
               </>
             ) : (
               <>
                 <Save className="w-4 h-4 mr-2" />
                 Save
               </>
             )}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };