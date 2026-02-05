 import { motion } from 'framer-motion';
 import { Lock, ArrowRight } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { useAuth } from '@/hooks/useAuth';
 
 export const AnonymousUserBanner = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
 
   if (user) return null;
 
   return (
     <motion.div
       initial={{ opacity: 0, y: -10 }}
       animate={{ opacity: 1, y: 0 }}
       className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-3"
     >
       <Lock className="w-4 h-4 text-primary" />
       <span className="text-sm text-muted-foreground">
         Sign in to save your circuits
       </span>
       <Button
         variant="link"
         size="sm"
         onClick={() => navigate('/auth')}
         className="text-primary p-0 h-auto"
       >
         Login <ArrowRight className="w-3 h-3 ml-1" />
       </Button>
     </motion.div>
   );
 };