 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { User, LogOut, ChevronDown, LogIn } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import { useAuth } from '@/hooks/useAuth';
 import { toast } from 'sonner';
 
 export const UserMenu = () => {
   const { user, signOut } = useAuth();
   const navigate = useNavigate();
   const [isLoggingOut, setIsLoggingOut] = useState(false);
 
   const handleSignOut = async () => {
     setIsLoggingOut(true);
     await signOut();
     setIsLoggingOut(false);
     toast.success('Signed out successfully');
     navigate('/auth');
   };
 
   if (!user) {
     return (
       <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
         <Button
           variant="outline"
           size="sm"
           onClick={() => navigate('/auth')}
           className="border-primary/30 hover:border-primary/50"
         >
           <LogIn className="w-4 h-4 mr-2" />
           Sign In
         </Button>
       </motion.div>
     );
   }
 
   const userInitial = user.email?.charAt(0).toUpperCase() || 'U';
   const userEmail = user.email || 'User';
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
           <Button variant="ghost" className="flex items-center gap-2 px-2">
             <Avatar className="h-7 w-7 border border-primary/30">
               <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground text-xs">
                 {userInitial}
               </AvatarFallback>
             </Avatar>
             <span className="text-sm text-muted-foreground max-w-[120px] truncate hidden sm:block">
               {userEmail}
             </span>
             <ChevronDown className="w-3 h-3 opacity-60" />
           </Button>
         </motion.div>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="w-56">
         <DropdownMenuLabel className="font-normal">
           <div className="flex flex-col space-y-1">
             <p className="text-sm font-medium leading-none">Account</p>
             <p className="text-xs leading-none text-muted-foreground truncate">
               {userEmail}
             </p>
           </div>
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
         <DropdownMenuItem
           onClick={handleSignOut}
           disabled={isLoggingOut}
           className="text-destructive focus:text-destructive cursor-pointer"
         >
           <LogOut className="w-4 h-4 mr-2" />
           {isLoggingOut ? 'Signing out...' : 'Sign Out'}
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
 };