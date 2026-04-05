 import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { QuantumCircuitBuilder } from '@/components/quantum';
 import { useAuth } from '@/hooks/useAuth';
 import { Loader2 } from 'lucide-react';

const Index = () => {
   const { user, loading } = useAuth();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (!loading && !user) {
       // Store current path for redirect after login
       sessionStorage.setItem('returnUrl', window.location.pathname);
       navigate('/auth', { replace: true, state: { returnTo: '/builder' } });
     }
   }, [user, loading, navigate]);
 
   // Show loading while checking auth
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   // Don't render if not authenticated
   if (!user) {
     return null;
   }
 
   return <QuantumCircuitBuilder />;
};

export default Index;
