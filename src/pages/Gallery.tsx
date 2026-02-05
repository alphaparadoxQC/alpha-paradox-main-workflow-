 import { useState, useEffect, useMemo } from 'react';
 import { motion } from 'framer-motion';
 import { Search, Filter, Star, Clock, Cpu, ArrowLeft, Loader2, User } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/hooks/useAuth';
 import { useNavigate, Link } from 'react-router-dom';
 import { toast } from 'sonner';
 import { formatDistanceToNow } from 'date-fns';
 import { CircuitThumbnail } from '@/components/quantum/CircuitThumbnail';
 import { QuantumGate } from '@/types/quantum';
 import { Json } from '@/integrations/supabase/types';
 
 type Category = 'Education' | 'Chemistry' | 'Algorithms' | 'Custom';
 
 interface PublicCircuit {
   id: string;
   name: string;
   description: string | null;
   circuit_data: Json;
   qubit_count: number;
   category: Category;
   created_at: string;
   user_id: string;
   like_count: number;
   user_has_liked: boolean;
 }
 
 const CATEGORIES: Category[] = ['Education', 'Chemistry', 'Algorithms', 'Custom'];
 
 const categoryColors: Record<Category, string> = {
   Education: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
   Chemistry: 'bg-green-500/20 text-green-400 border-green-500/30',
   Algorithms: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
   Custom: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
 };
 
 function getGatesFromJson(circuitData: Json): QuantumGate[] {
   const data = circuitData as Record<string, unknown>;
   if (data && typeof data === 'object' && 'gates' in data && Array.isArray(data.gates)) {
     return data.gates as QuantumGate[];
   }
   return [];
 }
 
 export default function Gallery() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [circuits, setCircuits] = useState<PublicCircuit[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
   const [likingCircuits, setLikingCircuits] = useState<Set<string>>(new Set());
 
   useEffect(() => {
     fetchPublicCircuits();
   }, [user]);
 
   const fetchPublicCircuits = async () => {
     setIsLoading(true);
     try {
       // Fetch public circuits
       const { data: circuitsData, error: circuitsError } = await supabase
         .from('quantum_circuits')
         .select('*')
         .eq('is_public', true)
         .order('created_at', { ascending: false });
 
       if (circuitsError) throw circuitsError;
 
       // Fetch like counts
       const { data: likeCounts, error: likeCountError } = await supabase
         .from('circuit_likes')
         .select('circuit_id');
 
       if (likeCountError) throw likeCountError;
 
       // Count likes per circuit
       const likeCountMap = new Map<string, number>();
       likeCounts?.forEach(like => {
         likeCountMap.set(like.circuit_id, (likeCountMap.get(like.circuit_id) || 0) + 1);
       });
 
       // Fetch user's likes if logged in
       let userLikes = new Set<string>();
       if (user) {
         const { data: userLikesData } = await supabase
           .from('circuit_likes')
           .select('circuit_id')
           .eq('user_id', user.id);
         
         userLikesData?.forEach(like => userLikes.add(like.circuit_id));
       }
 
       const enrichedCircuits: PublicCircuit[] = (circuitsData || []).map(circuit => ({
         ...circuit,
         category: (circuit.category as Category) || 'Custom',
         like_count: likeCountMap.get(circuit.id) || 0,
         user_has_liked: userLikes.has(circuit.id),
       }));
 
       setCircuits(enrichedCircuits);
     } catch (error) {
       console.error('Error fetching circuits:', error);
       toast.error('Failed to load circuits');
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleLike = async (circuitId: string, currentlyLiked: boolean) => {
     if (!user) {
       toast.error('Please sign in to like circuits');
       return;
     }
 
     setLikingCircuits(prev => new Set(prev).add(circuitId));
 
     try {
       if (currentlyLiked) {
         // Unlike
         const { error } = await supabase
           .from('circuit_likes')
           .delete()
           .eq('circuit_id', circuitId)
           .eq('user_id', user.id);
         
         if (error) throw error;
 
         setCircuits(prev => prev.map(c => 
           c.id === circuitId 
             ? { ...c, like_count: c.like_count - 1, user_has_liked: false }
             : c
         ));
       } else {
         // Like
         const { error } = await supabase
           .from('circuit_likes')
           .insert({ circuit_id: circuitId, user_id: user.id });
         
         if (error) throw error;
 
         setCircuits(prev => prev.map(c => 
           c.id === circuitId 
             ? { ...c, like_count: c.like_count + 1, user_has_liked: true }
             : c
         ));
       }
     } catch (error) {
       console.error('Error toggling like:', error);
       toast.error('Failed to update like');
     } finally {
       setLikingCircuits(prev => {
         const next = new Set(prev);
         next.delete(circuitId);
         return next;
       });
     }
   };
 
   const openCircuit = (circuit: PublicCircuit) => {
     // Store circuit in sessionStorage for the editor to pick up
     const gates = getGatesFromJson(circuit.circuit_data);
     sessionStorage.setItem('loadCircuit', JSON.stringify({
       gates,
       qubitCount: circuit.qubit_count,
       name: circuit.name,
       isCopy: true,
     }));
     navigate('/');
   };
 
   const filteredCircuits = useMemo(() => {
     return circuits.filter(circuit => {
       const matchesSearch = circuit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (circuit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
       const matchesCategory = selectedCategory === 'All' || circuit.category === selectedCategory;
       return matchesSearch && matchesCategory;
     });
   }, [circuits, searchQuery, selectedCategory]);
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <motion.header
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="border-b border-border bg-card"
       >
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link to="/">
               <Button variant="ghost" size="sm">
                 <ArrowLeft className="w-4 h-4 mr-2" />
                 Back to Editor
               </Button>
             </Link>
             <div className="h-6 w-px bg-border" />
             <div className="flex items-center gap-2">
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center"
               >
                 <Cpu className="w-4 h-4 text-background" />
               </motion.div>
               <div>
                 <h1 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                   Circuit Gallery
                 </h1>
                 <p className="text-xs text-muted-foreground">
                   Explore public quantum circuits
                 </p>
               </div>
             </div>
           </div>
         </div>
       </motion.header>
 
       {/* Search and Filters */}
       <div className="container mx-auto px-4 py-6">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="flex flex-col md:flex-row gap-4 mb-8"
         >
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="Search circuits..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10 bg-card border-border"
             />
           </div>
           <div className="flex items-center gap-2">
             <Filter className="w-4 h-4 text-muted-foreground" />
             <div className="flex gap-2">
               <Button
                 variant={selectedCategory === 'All' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setSelectedCategory('All')}
               >
                 All
               </Button>
               {CATEGORIES.map(category => (
                 <Button
                   key={category}
                   variant={selectedCategory === category ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => setSelectedCategory(category)}
                 >
                   {category}
                 </Button>
               ))}
             </div>
           </div>
         </motion.div>
 
         {/* Loading State */}
         {isLoading && (
           <div className="flex items-center justify-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
           </div>
         )}
 
         {/* Empty State */}
         {!isLoading && filteredCircuits.length === 0 && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-center py-20"
           >
             <Cpu className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
             <h3 className="text-lg font-medium text-muted-foreground">No circuits found</h3>
             <p className="text-sm text-muted-foreground/70">
               {searchQuery || selectedCategory !== 'All'
                 ? 'Try adjusting your search or filters'
                 : 'Be the first to share a public circuit!'}
             </p>
           </motion.div>
         )}
 
         {/* Circuit Grid */}
         {!isLoading && filteredCircuits.length > 0 && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
           >
             {filteredCircuits.map((circuit, index) => (
               <motion.div
                 key={circuit.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
               >
                 <Card className="group hover:border-primary/50 transition-colors cursor-pointer bg-card">
                   <CardHeader className="pb-2">
                     <div className="flex items-start justify-between">
                       <Badge variant="outline" className={categoryColors[circuit.category]}>
                         {circuit.category}
                       </Badge>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleLike(circuit.id, circuit.user_has_liked);
                         }}
                         disabled={likingCircuits.has(circuit.id)}
                       >
                         <Star
                           className={`w-4 h-4 transition-colors ${
                             circuit.user_has_liked
                               ? 'fill-yellow-400 text-yellow-400'
                               : 'text-muted-foreground group-hover:text-yellow-400'
                           }`}
                         />
                       </Button>
                     </div>
                     <CardTitle className="text-base line-clamp-1">{circuit.name}</CardTitle>
                     {circuit.description && (
                       <p className="text-xs text-muted-foreground line-clamp-2">
                         {circuit.description}
                       </p>
                     )}
                   </CardHeader>
                   <CardContent className="pb-2" onClick={() => openCircuit(circuit)}>
                     <CircuitThumbnail
                       gates={getGatesFromJson(circuit.circuit_data)}
                       qubitCount={circuit.qubit_count}
                     />
                   </CardContent>
                   <CardFooter className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                     <div className="flex items-center gap-3">
                       <span className="flex items-center gap-1">
                         <Cpu className="w-3 h-3" />
                         {circuit.qubit_count} qubits
                       </span>
                       <span className="flex items-center gap-1">
                         <Star className="w-3 h-3" />
                         {circuit.like_count}
                       </span>
                     </div>
                     <span className="flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {formatDistanceToNow(new Date(circuit.created_at), { addSuffix: true })}
                     </span>
                   </CardFooter>
                 </Card>
               </motion.div>
             ))}
           </motion.div>
         )}
       </div>
     </div>
   );
 }