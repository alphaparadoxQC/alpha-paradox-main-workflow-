import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cpu, Mail, Lock, Loader2, Eye, EyeOff, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { toast } from 'sonner';
import { z } from 'zod';
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { BRANDING } from '@/config/branding';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
 
 export default function Auth() {
   const navigate = useNavigate();
   const { signIn, signUp, user } = useAuth();
   const [isLoading, setIsLoading] = useState(false);
   const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isPasswordReset = searchParams.get('reset') === 'true';
 
   // Redirect if already logged in
   if (user) {
     const returnUrl = sessionStorage.getItem('returnUrl') || '/';
     sessionStorage.removeItem('returnUrl');
     navigate(returnUrl, { replace: true });
     return null;
   }
 
   const validateForm = () => {
     const newErrors: { email?: string; password?: string } = {};
     
     const emailResult = emailSchema.safeParse(email);
     if (!emailResult.success) {
       newErrors.email = emailResult.error.errors[0].message;
     }
     
     const passwordResult = passwordSchema.safeParse(password);
     if (!passwordResult.success) {
       newErrors.password = passwordResult.error.errors[0].message;
     }
     
     setErrors(newErrors);
     return Object.keys(newErrors).length === 0;
   };
 
   const handleSignIn = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!validateForm()) return;
     
     setIsLoading(true);
     const { error } = await signIn(email, password);
     setIsLoading(false);
     
     if (error) {
       if (error.message.includes('Invalid login credentials')) {
         toast.error('Invalid email or password');
       } else if (error.message.includes('Email not confirmed')) {
         toast.error('Please verify your email before signing in');
       } else {
         toast.error(error.message);
       }
     } else {
       toast.success('Welcome back!');
       const returnUrl = sessionStorage.getItem('returnUrl') || '/';
       sessionStorage.removeItem('returnUrl');
       navigate(returnUrl);
     }
   };
 
   const handleSignUp = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!validateForm()) return;
     
     setIsLoading(true);
     const { error } = await signUp(email, password);
     setIsLoading(false);
     
     if (error) {
       if (error.message.includes('already registered')) {
         toast.error('This email is already registered. Try signing in instead.');
       } else {
         toast.error(error.message);
       }
     } else {
       toast.success('Account created! Please check your email to verify your account.');
     }
   };
 
   const handleGoogleSignIn = async () => {
     setIsGoogleLoading(true);
     const { error } = await lovable.auth.signInWithOAuth('google', {
       redirect_uri: window.location.origin,
     });
     setIsGoogleLoading(false);
     
     if (error) {
       toast.error('Failed to sign in with Google');
     }
   };
 
   return (
     <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Animated background elements */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {[...Array(20)].map((_, i) => (
           <motion.div
             key={i}
             className="absolute w-1 h-1 rounded-full bg-primary/30"
             initial={{ 
               x: Math.random() * window.innerWidth, 
               y: Math.random() * window.innerHeight,
               scale: Math.random() * 2 + 0.5,
             }}
             animate={{ 
               y: [null, Math.random() * -200 - 100],
               opacity: [0.3, 0.8, 0.3],
             }}
             transition={{ 
               duration: Math.random() * 10 + 10,
               repeat: Infinity,
               ease: "linear"
             }}
           />
         ))}
         
         {/* Floating quantum orbitals */}
         <motion.div 
           className="absolute top-20 left-20 w-64 h-64 rounded-full border border-primary/20"
           animate={{ rotate: 360 }}
           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
         />
         <motion.div 
           className="absolute bottom-20 right-20 w-48 h-48 rounded-full border border-secondary/20"
           animate={{ rotate: -360 }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
         />
         <motion.div 
           className="absolute top-1/2 left-10 w-32 h-32 rounded-full border border-accent/20"
           animate={{ rotate: 360 }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
         />
       </div>
 
       {/* Logo and Title */}
       <motion.div 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="flex items-center gap-3 mb-8"
       >
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center"
         >
           <Cpu className="w-6 h-6 text-background" />
         </motion.div>
        <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {BRANDING.platformName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {BRANDING.platformTagline}
            </p>
          </div>
        </motion.div>

        {/* Password Reset Form */}
        {isPasswordReset ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ResetPasswordForm onComplete={() => navigate('/')} />
          </motion.div>
        ) : (
        /* Auth Card */
        <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.1 }}
       >
         <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
           <CardHeader className="text-center">
             <CardTitle className="text-xl">Welcome</CardTitle>
             <CardDescription>
               Sign in to save and manage your quantum circuits
             </CardDescription>
           </CardHeader>
           <CardContent>
             <Tabs defaultValue="signin" className="w-full">
               <TabsList className="grid w-full grid-cols-2 mb-6">
                 <TabsTrigger value="signin">Sign In</TabsTrigger>
                 <TabsTrigger value="signup">Sign Up</TabsTrigger>
               </TabsList>
               
               <TabsContent value="signin">
                 <form onSubmit={handleSignIn} className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="signin-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signin-email"
                         type="email"
                         placeholder="quantum@example.com"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="pl-10"
                       />
                     </div>
                     {errors.email && (
                       <p className="text-sm text-destructive">{errors.email}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="signin-password">Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signin-password"
                         type={showPassword ? 'text' : 'password'}
                         placeholder="••••••••"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="pl-10 pr-10"
                       />
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                       >
                         {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                     {errors.password && (
                       <p className="text-sm text-destructive">{errors.password}</p>
                     )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setForgotPasswordOpen(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
               <TabsContent value="signup">
                 <form onSubmit={handleSignUp} className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="signup-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-email"
                         type="email"
                         placeholder="quantum@example.com"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="pl-10"
                       />
                     </div>
                     {errors.email && (
                       <p className="text-sm text-destructive">{errors.email}</p>
                     )}
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="signup-password">Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-password"
                         type={showPassword ? 'text' : 'password'}
                         placeholder="••••••••"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="pl-10 pr-10"
                       />
                       <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                       >
                         {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                     </div>
                     {errors.password && (
                       <p className="text-sm text-destructive">{errors.password}</p>
                     )}
                   </div>
                   
                   <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? (
                       <>
                         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                         Creating account...
                       </>
                     ) : (
                       'Create Account'
                     )}
                   </Button>
                 </form>
               </TabsContent>
             </Tabs>
             
             {/* Divider */}
             <div className="relative my-6">
               <div className="absolute inset-0 flex items-center">
                 <span className="w-full border-t border-border" />
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
               </div>
             </div>
             
             {/* Google Sign In */}
             <Button 
               variant="outline" 
               className="w-full" 
               onClick={handleGoogleSignIn}
               disabled={isGoogleLoading}
             >
               {isGoogleLoading ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                   <path
                     fill="currentColor"
                     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                   />
                   <path
                     fill="currentColor"
                     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                   />
                   <path
                     fill="currentColor"
                     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                   />
                   <path
                     fill="currentColor"
                     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                   />
                 </svg>
               )}
               Continue with Google
             </Button>
             
             {/* Quantum decoration */}
             <div className="mt-6 flex justify-center">
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 className="relative"
               >
                 <Atom className="w-6 h-6 text-primary/30" />
               </motion.div>
             </div>
           </CardContent>
         </Card>
        </motion.div>
        )}
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-sm text-muted-foreground text-center"
        >
          Build and simulate quantum circuits in your browser
        </motion.p>
        
        {/* Forgot Password Dialog */}
        <ForgotPasswordDialog 
          open={forgotPasswordOpen} 
          onOpenChange={setForgotPasswordOpen} 
        />
      </div>
    );
  }